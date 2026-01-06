from django.contrib import admin
from .models import (
    Vendor,
    VendorBankDetails,
    ExpenseCategory,
    Expense,
    Payment,
    PasswordResetOTP,
    RecurringExpense,
    Project,
)


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "contact_number", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "contact_number")


@admin.register(VendorBankDetails)
class VendorBankDetailsAdmin(admin.ModelAdmin):
    list_display = (
        "vendor",
        "bank_name",
        "account_number",
        "account_type",
        "ifsc_code",
        "is_active",
    )
    list_filter = ("bank_name", "account_type", "is_active")
    search_fields = ("vendor__name", "account_number", "ifsc_code")



@admin.register(ExpenseCategory)
class ExpenseCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name",)


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "vendor",
        "category",
        "amount_requested",
        "amount_paid",
        "status",
        "created_at",
    )
    list_filter = ("status", "category")
    search_fields = ("vendor__name",)
    readonly_fields = ("amount_paid", "created_at", "updated_at")
    ordering = ("-created_at",)

@admin.register(RecurringExpense)
class RecurringExpenseAdmin(admin.ModelAdmin):
    list_display = (
        "vendor",
        "category",
        "project",
        "amount",
        "frequency",
        "start_date",
        "is_active",
    )
    list_filter = ("frequency", "is_active")
    search_fields = ("vendor__name",)

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "expense", "amount", "paid_at", "created_by")
    list_filter = ("paid_at",)
    ordering = ("-paid_at",)


@admin.register(PasswordResetOTP)
class PasswordResetOTPAdmin(admin.ModelAdmin):
    list_display = ("user", "otp", "is_verified", "created_at")
    list_filter = ("is_verified", "created_at")
    readonly_fields = ("otp", "created_at")

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "budget", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name",)