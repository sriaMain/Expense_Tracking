from django.core.management.base import BaseCommand
from employees.services import generate_recurring_expenses


class Command(BaseCommand):
    help = "Generate monthly recurring expenses"

    def handle(self, *args, **kwargs):
        generate_recurring_expenses()
        self.stdout.write(self.style.SUCCESS("Recurring expenses generated"))
