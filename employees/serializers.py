from rest_framework import serializers
from django.contrib.auth.models import User
from django.db.models import Sum, F

from .models import (
    Vendor,
    VendorBankDetails,
    RecurringExpense,
    ExpenseCategory,
    Expense,
    Payment,
    Project,
)


class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]


class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = "__all__"


class PaymentMiniSerializer(serializers.ModelSerializer):
    created_by = UserMiniSerializer(read_only=True)

    class Meta:
        model = Payment
        fields = ["id", "amount", "paid_at", "created_by"]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"
        read_only_fields = ["paid_at", "created_by"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero")
        return value

    def validate(self, attrs):
        expense = attrs.get("expense")
        amount = attrs.get("amount")

        if not expense:
            raise serializers.ValidationError({"expense": "Expense is required"})

        if expense.status == Expense.STATUS_PAID:
            raise serializers.ValidationError({"error": "Expense already fully paid"})

        remaining = expense.amount_requested - expense.amount_paid
        if amount > remaining:
            raise serializers.ValidationError(
                {"error": "Payment exceeds remaining balance"}
            )
        return attrs


class ExpenseSerializer(serializers.ModelSerializer):
    created_by = UserMiniSerializer(read_only=True)
    updated_by = UserMiniSerializer(read_only=True)

    vendor = serializers.PrimaryKeyRelatedField(read_only=True)
    vendor_id = serializers.PrimaryKeyRelatedField(
        queryset=Vendor.objects.filter(is_active=True),
        source="vendor",
        write_only=True
    )

    payments = PaymentMiniSerializer(many=True, read_only=True)
    remaining_amount = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = [
            "id",
            "vendor",
            "vendor_id",
            "category",
            "project",
            "amount_requested",
            "amount_paid",
            "remaining_amount",
            "reason",
            "status",
            "payments",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "vendor",
            "amount_paid",
            "status",
            "payments",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]

    def get_remaining_amount(self, obj):
        return obj.remaining_amount

    def validate_amount_requested(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Amount requested must be greater than 0"
            )
        return value

    def validate(self, attrs):
        if self.instance and self.instance.status == Expense.STATUS_PAID:
            raise serializers.ValidationError(
                {"error": "Paid expense cannot be modified"}
            )

        project = attrs.get("project")
        reason = attrs.get("reason", "").strip()

        if project is None and not reason:
            raise serializers.ValidationError({
                "reason": "Reason is required when expense is not related to a project"
            })

        return attrs



class VendorSerializer(serializers.ModelSerializer):
    created_by = UserMiniSerializer(read_only=True)
    expenses = ExpenseSerializer(many=True, read_only=True)
    total_remaining_amount = serializers.SerializerMethodField()

    class Meta:
        model = Vendor
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_by",
            "created_at",
        ]

    def get_total_remaining_amount(self, obj):
        result = obj.expenses.aggregate(
            total=Sum(F("amount_requested") - F("amount_paid"))
        )
        return result["total"] or 0

class VendorBankDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorBankDetails
        fields = "__all__"
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs):
        vendor = attrs.get(
            "vendor",
            self.instance.vendor if self.instance else None
        )

        is_active = attrs.get("is_active", True)

        if vendor and is_active:
            VendorBankDetails.objects.filter(
                vendor=vendor,
                is_active=True
            ).exclude(id=self.instance.id if self.instance else None).update(
                is_active=False
            )

        return attrs


class ProjectSerializer(serializers.ModelSerializer):
    total_expense = serializers.SerializerMethodField()
    remaining_budget = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "budget",
            "is_active",
            "total_expense",
            "remaining_budget",
        ]

    def get_total_expense(self, obj):
        return sum(e.amount_paid for e in obj.expenses.all())

    def get_remaining_budget(self, obj):
        return obj.budget - self.get_total_expense(obj)

class RecurringExpenseSerializer(serializers.ModelSerializer):
    vendor_id = serializers.PrimaryKeyRelatedField(
        queryset=Vendor.objects.filter(is_active=True),
        source="vendor",
        write_only=True
    )

    vendor = VendorSerializer(read_only=True)

    class Meta:
        model = RecurringExpense
        fields = "__all__"
        read_only_fields = ["id", "created_by", "created_at"]
