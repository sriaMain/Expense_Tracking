from datetime import datetime, date
from dateutil.relativedelta import relativedelta
from django.db import transaction
from django.utils import timezone

from .models import Expense, RecurringExpense


def generate_recurring_expenses():
    today = date.today()

    recurring_items = RecurringExpense.objects.filter(
        is_active=True,
        start_date__lte=today
    )

    for item in recurring_items:
        already_created = Expense.objects.filter(
            vendor=item.vendor,
            category=item.category,
            project=item.project,
            created_at__year=today.year,
            created_at__month=today.month,
            reason__icontains="Recurring"
        ).exists()

        if already_created:
            continue

        Expense.objects.create(
            vendor=item.vendor,
            category=item.category,
            project=item.project,
            amount_requested=item.amount,
            amount_paid=0,
            status=Expense.STATUS_PENDING,
            reason=f"Recurring expense for {today.strftime('%B %Y')}",
            created_by=item.created_by,
        )


def carry_forward_monthly_expenses(year, month):
    start_date = timezone.make_aware(datetime(year, month, 1))

    if month == 12:
        end_date = timezone.make_aware(datetime(year + 1, 1, 1))
    else:
        end_date = timezone.make_aware(datetime(year, month + 1, 1))

    expenses = Expense.objects.filter(
        created_at__gte=start_date,
        created_at__lt=end_date
    )

    with transaction.atomic():
        for expense in expenses:
            remaining = expense.amount_requested - expense.amount_paid

            if remaining > 0:
                Expense.objects.create(
                    vendor=expense.vendor,
                    project=expense.project,
                    category=expense.category,
                    amount_requested=remaining,
                    amount_paid=0,
                    status=Expense.STATUS_PENDING,
                    reason=f"Carry forward from {start_date.strftime('%B %Y')}",
                    created_by=expense.created_by,
                )
