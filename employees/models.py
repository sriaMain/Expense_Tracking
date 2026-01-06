from django.db import models
from django.conf import settings
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q
import uuid


class Vendor(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=150)
    address = models.TextField()
    contact_number = models.CharField(max_length=15)

    is_active = models.BooleanField(default=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class VendorBankDetails(models.Model):
    ACCOUNT_SAVINGS = "SAVINGS"
    ACCOUNT_CURRENT = "CURRENT"

    ACCOUNT_TYPE_CHOICES = (
        (ACCOUNT_SAVINGS, "Savings"),
        (ACCOUNT_CURRENT, "Current"),
    )

    vendor = models.ForeignKey(
        Vendor,
        related_name="bank_details",
        on_delete=models.CASCADE
    )

    bank_name = models.CharField(max_length=150)
    account_holder_name = models.CharField(max_length=150)
    account_number = models.CharField(max_length=30)
    ifsc_code = models.CharField(max_length=15)

    account_type = models.CharField(
        max_length=20,
        choices=ACCOUNT_TYPE_CHOICES,
        default=ACCOUNT_SAVINGS
    )

    branch_name = models.CharField(max_length=150, blank=True)
    upi_id = models.CharField(max_length=100, blank=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

class Project(models.Model):
    name = models.CharField(max_length=150, unique=True)
    budget = models.DecimalField(max_digits=12, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class ExpenseCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class RecurringExpense(models.Model):
    FREQUENCY_DAILY = "DAILY"
    FREQUENCY_WEEKLY = "WEEKLY"
    FREQUENCY_MONTHLY = "MONTHLY"
    FREQUENCY_QUARTERLY = "QUARTERLY"
    FREQUENCY_YEARLY = "YEARLY"

    FREQUENCY_CHOICES = (
        (FREQUENCY_DAILY, "Daily"),
        (FREQUENCY_WEEKLY, "Weekly"),
        (FREQUENCY_MONTHLY, "Monthly"),
        (FREQUENCY_QUARTERLY, "Quarterly"),
        (FREQUENCY_YEARLY, "Yearly"),
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="recurring_expenses"
    )

    category = models.ForeignKey(
        ExpenseCategory,
        on_delete=models.PROTECT
    )

    project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)

    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.category.name} - {self.vendor.name}"



class Expense(models.Model):
    STATUS_PENDING = "PENDING"
    STATUS_PARTIAL = "PARTIALLY_PAID"
    STATUS_PAID = "PAID"

    project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="expenses"
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="expenses"
    )

    category = models.ForeignKey(
        ExpenseCategory,
        on_delete=models.PROTECT
    )

    amount_requested = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    reason = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=(
            (STATUS_PENDING, "Pending"),
            (STATUS_PARTIAL, "Partially Paid"),
            (STATUS_PAID, "Paid"),
        ),
        default=STATUS_PENDING,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="expenses_created",
    )

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="expenses_updated",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(amount_paid__gte=0),
                name="expense_amount_paid_non_negative",
            ),
            models.CheckConstraint(
                condition=Q(amount_requested__gt=0),
                name="expense_amount_requested_positive",
            ),
        ]

    @property
    def remaining_amount(self):
        return self.amount_requested - self.amount_paid

    def __str__(self):
        return f"Expense #{self.id} | {self.vendor} | {self.status}"


class PasswordResetOTP(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="password_otps")
    otp = models.CharField(max_length=6)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=10)

    class Meta:
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["created_at"]),
        ]


class Payment(models.Model):
    expense = models.ForeignKey(
        Expense,
        related_name="payments",
        on_delete=models.CASCADE
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    class Meta:
        indexes = [
            models.Index(fields=["expense"]),
            models.Index(fields=["paid_at"]),
        ]
