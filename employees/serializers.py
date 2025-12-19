from rest_framework import serializers
from django.contrib.auth.models import User
from django.db.models import Sum, F
from .models import Employee, ExpenseCategory, Expense, Payment


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
    payments = PaymentMiniSerializer(many=True, read_only=True)
    remaining_amount = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = "__all__"
        read_only_fields = [
            "amount_paid",
            "status",
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
        return attrs



class EmployeeSerializer(serializers.ModelSerializer):
    created_by = UserMiniSerializer(read_only=True)
    expenses = ExpenseSerializer(
        many=True,
        read_only=True,
        source="expense_set"
    )
    total_remaining_amount = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = "__all__"
        read_only_fields = [
            "employee_id",
            "created_by",
        ]

    def get_total_remaining_amount(self, obj):
        result = obj.expense_set.aggregate(
            total=Sum(F("amount_requested") - F("amount_paid"))
        )
        return result["total"] or 0