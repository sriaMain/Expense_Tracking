from django.contrib import admin
from .models import (
    Employee,
    ExpenseCategory,
    Expense,
    Payment,
    PasswordResetOTP
)


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("employee_id", "full_name", "department", "designation", "is_active")
    list_filter = ("department", "designation", "is_active")
    search_fields = ("full_name",)
    ordering = ("employee_id",)


@admin.register(ExpenseCategory)
class ExpenseCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name",)


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "employee",
        "category",
        "amount_requested",
        "amount_paid",
        "status",
        "created_at",
    )
    list_filter = ("status", "category")
    search_fields = ("employee__full_name",)
    readonly_fields = ("amount_paid", "created_at", "updated_at")
    ordering = ("-created_at",)


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
