import random
from datetime import datetime

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.mail import send_mail
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.db import transaction
from django.db.models import F
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Sum
from .services import generate_recurring_expenses

from openpyxl import Workbook
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import RecurringExpense
from .serializers import RecurringExpenseSerializer

from .models import (
    Vendor,
    VendorBankDetails,
    ExpenseCategory,
    Expense,
    Payment,
    Project,
    PasswordResetOTP,
)

from .serializers import (
    VendorSerializer,
    VendorBankDetailsSerializer,
    ExpenseCategorySerializer,
    ExpenseSerializer,
    PaymentSerializer,
    PaymentMiniSerializer,
    ProjectSerializer,
)

from .services import carry_forward_monthly_expenses

signer = TimestampSigner()


class LoginAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        identifier = request.data.get("identifier")
        password = request.data.get("password")

        try:
            user = User.objects.get(username=identifier)
        except User.DoesNotExist:
            try:
                user = User.objects.get(email=identifier)
            except User.DoesNotExist:
                return Response({"error": "Invalid credentials"}, status=401)

        user = authenticate(request, username=user.username, password=password)
        if not user:
            return Response({"error": "Invalid credentials"}, status=401)

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })


class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.data.get("refresh")
        RefreshToken(token).blacklist()
        return Response({"message": "Logged out successfully"})


class ForgotPasswordAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        user = get_object_or_404(User, email=email, is_active=True)

        otp = str(random.randint(100000, 999999))
        PasswordResetOTP.objects.filter(user=user).delete()
        PasswordResetOTP.objects.create(user=user, otp=otp)

        send_mail(
            "Password Reset OTP",
            f"Your OTP is {otp}",
            settings.DEFAULT_FROM_EMAIL,
            [email],
        )
        return Response({"message": "OTP sent"})


class VerifyOTPAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        otp = request.data.get("otp")

        user = get_object_or_404(User, email=email, is_active=True)
        otp_obj = get_object_or_404(
            PasswordResetOTP, user=user, otp=otp, is_verified=False
        )

        if otp_obj.is_expired():
            otp_obj.delete()
            return Response({"error": "OTP expired"}, status=400)

        otp_obj.is_verified = True
        otp_obj.save()

        return Response({
            "reset_token": signer.sign(user.id)
        })


class ResetPasswordAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("reset_token")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if new_password != confirm_password:
            return Response({"error": "Passwords do not match"}, status=400)

        try:
            user_id = signer.unsign(token, max_age=600)
            user = User.objects.get(pk=user_id)
        except (BadSignature, SignatureExpired, User.DoesNotExist):
            return Response({"error": "Invalid token"}, status=400)

        validate_password(new_password, user)
        user.set_password(new_password)
        user.save()
        PasswordResetOTP.objects.filter(user=user).delete()

        return Response({"message": "Password reset successful"})


class ChangePasswordAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old = request.data.get("old_password")
        new = request.data.get("new_password")

        if not user.check_password(old):
            return Response({"error": "Old password incorrect"}, status=400)

        validate_password(new, user)
        user.set_password(new)
        user.save()
        return Response({"message": "Password changed"})


class UserListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = User.objects.all()
        return Response([{
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "is_active": u.is_active
        } for u in users])

    def post(self, request):
        user = User.objects.create_user(
            username=request.data["username"],
            email=request.data.get("email"),
            password=request.data["password"],
            is_staff=True
        )
        return Response({"id": user.id}, status=201)
    

class UserDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        u = get_object_or_404(User, pk=pk)
        return Response({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "is_active": u.is_active
        })

    def patch(self, request, pk):
        u = get_object_or_404(User, pk=pk)
        u.is_active = request.data.get("is_active", u.is_active)
        u.save(update_fields=["is_active"])
        return Response({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "is_active": u.is_active
        })

    def put(self, request, pk):
        u = get_object_or_404(User, pk=pk)

        username = request.data.get("username")
        email = request.data.get("email")
        is_active = request.data.get("is_active")

        if username is not None:
            u.username = username

        if email is not None:
            u.email = email

        if is_active is not None:
            u.is_active = is_active

        u.save()

        return Response({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "is_active": u.is_active
        })

class VendorListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(VendorSerializer(Vendor.objects.all(), many=True).data)

    def post(self, request):
        s = VendorSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save(created_by=request.user)
        return Response(s.data, status=201)


class VendorDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        return Response(VendorSerializer(get_object_or_404(Vendor, pk=pk)).data)

    def put(self, request, pk):
        v = get_object_or_404(Vendor, pk=pk)
        s = VendorSerializer(v, data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)

    def delete(self, request, pk):
        v = get_object_or_404(Vendor, pk=pk)
        v.is_active = False
        v.save()
        return Response(status=204)

class VendorBankDetailsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, vendor_id=None, pk=None):
        if pk:
            bank = get_object_or_404(VendorBankDetails, pk=pk)
            return Response(VendorBankDetailsSerializer(bank).data)

        if vendor_id:
            banks = VendorBankDetails.objects.filter(vendor_id=vendor_id)
            return Response(
                VendorBankDetailsSerializer(banks, many=True).data
            )

        return Response(
            {"error": "vendor_id is required"},
            status=400
        )

    def post(self, request, vendor_id=None):
        if not vendor_id:
            return Response(
                {"error": "vendor_id is required"},
                status=400
            )

        data = request.data.copy()
        data["vendor"] = vendor_id

        serializer = VendorBankDetailsSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=201)

    def put(self, request, pk=None):
        bank = get_object_or_404(VendorBankDetails, pk=pk)
        serializer = VendorBankDetailsSerializer(bank, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk=None):
        bank = get_object_or_404(VendorBankDetails, pk=pk)
        bank.is_active = False
        bank.save(update_fields=["is_active"])
        return Response(status=204)



class VendorExpensesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        expenses = Expense.objects.filter(vendor_id=pk)
        return Response(ExpenseSerializer(expenses, many=True).data)


class ExpenseCategoryListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            ExpenseCategorySerializer(ExpenseCategory.objects.all(), many=True).data
        )

    def post(self, request):
        s = ExpenseCategorySerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data, status=201)


class ExpenseAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        if pk:
            return Response(
                ExpenseSerializer(get_object_or_404(Expense, pk=pk)).data
            )
        return Response(
            ExpenseSerializer(Expense.objects.all(), many=True).data
        )

    def post(self, request):
        s = ExpenseSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save(created_by=request.user)
        return Response(s.data, status=201)

    def put(self, request, pk):
        e = get_object_or_404(Expense, pk=pk)
        s = ExpenseSerializer(e, data=request.data)
        s.is_valid(raise_exception=True)
        s.save(updated_by=request.user)
        return Response(s.data)

    def delete(self, request, pk):
        get_object_or_404(Expense, pk=pk).delete()
        return Response(status=204)

class AllExpensesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        generate_recurring_expenses()

        expenses = Expense.objects.select_related(
            "vendor", "category", "project"
        ).order_by("-created_at")

        serializer = ExpenseSerializer(expenses, many=True)
        return Response(serializer.data)

class PaymentListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        payments = Payment.objects.all()
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment = serializer.save(created_by=request.user)

        expense = payment.expense

        total_paid = expense.payments.aggregate(
            total=Sum("amount")
        )["total"] or 0

        expense.amount_paid = total_paid

        if total_paid == 0:
            expense.status = Expense.STATUS_PENDING
        elif total_paid < expense.amount_requested:
            expense.status = Expense.STATUS_PARTIAL
        else:
            expense.status = Expense.STATUS_PAID

        expense.save(update_fields=["amount_paid", "status"])

        return Response(
            PaymentSerializer(payment).data,
            status=status.HTTP_201_CREATED
        )


class PaymentDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        return Response(
            PaymentSerializer(get_object_or_404(Payment, pk=pk)).data
        )


class ProjectAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        if pk:
            project = get_object_or_404(Project, pk=pk)
            serializer = ProjectSerializer(project)
            return Response(serializer.data)

        projects = Project.objects.filter(is_active=True)
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def put(self, request, pk):
        project = get_object_or_404(Project, pk=pk)
        serializer = ProjectSerializer(project, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request, pk):
        project = get_object_or_404(Project, pk=pk)
        serializer = ProjectSerializer(
            project,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        project = get_object_or_404(Project, pk=pk)
        project.is_active = False
        project.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        return Response(
            ProjectSerializer(get_object_or_404(Project, pk=pk)).data
        )

    def put(self, request, pk):
        p = get_object_or_404(Project, pk=pk)
        s = ProjectSerializer(p, data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)

    def delete(self, request, pk):
        p = get_object_or_404(Project, pk=pk)
        p.is_active = False
        p.save()
        return Response(status=204)


class ProjectExpensesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        expenses = Expense.objects.filter(project_id=pk)
        return Response(ExpenseSerializer(expenses, many=True).data)


class ExpenseCarryForwardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        period = request.data.get("period")
        year = request.data.get("year")
        month = request.data.get("month")
        week_start = request.data.get("week_start")
        week_end = request.data.get("week_end")

        generate_recurring_expenses()

        if period == "weekly":
            if not week_start or not week_end:
                return Response(
                    {"error": "week_start and week_end are required for weekly carry forward"},
                    status=400
                )

            start_date = timezone.make_aware(datetime.fromisoformat(week_start))
            end_date = timezone.make_aware(datetime.fromisoformat(week_end))

        elif period == "monthly":
            if not year or not month:
                return Response(
                    {"error": "year and month are required for monthly carry forward"},
                    status=400
                )

            start_date = timezone.make_aware(datetime(int(year), int(month), 1))
            if int(month) == 12:
                end_date = timezone.make_aware(datetime(int(year) + 1, 1, 1))
            else:
                end_date = timezone.make_aware(datetime(int(year), int(month) + 1, 1))

        elif period == "yearly":
            if not year:
                return Response(
                    {"error": "year is required for yearly carry forward"},
                    status=400
                )

            start_date = timezone.make_aware(datetime(int(year), 1, 1))
            end_date = timezone.make_aware(datetime(int(year) + 1, 1, 1))

        else:
            return Response(
                {"error": "Invalid period. Use weekly, monthly, or yearly"},
                status=400
            )

        expenses = Expense.objects.filter(
            created_at__gte=start_date,
            created_at__lt=end_date
        )

        carried_count = 0

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
                        reason=f"Carry forward ({period}) from {start_date.date()}",
                        created_by=expense.created_by,
                    )
                    carried_count += 1

        return Response({
            "message": f"{period.capitalize()} carry forward completed",
            "period": period,
            "from_date": start_date.date(),
            "to_date": end_date.date(),
            "total_expenses_checked": expenses.count(),
            "total_carried_forward": carried_count,
        })
        
        
class ExpenseReportExcelAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return self._generate_excel(request)

    def post(self, request):
        return self._generate_excel(request)

    def _generate_excel(self, request):
        data_source = request.query_params if request.method == "GET" else request.data

        period = data_source.get("period")
        year = data_source.get("year")
        month = data_source.get("month")
        week_start = data_source.get("week_start")
        week_end = data_source.get("week_end")

        expenses = Expense.objects.select_related(
            "vendor", "category", "project"
        )

        if period == "weekly" and week_start and week_end:
            start_date = timezone.make_aware(datetime.fromisoformat(week_start))
            end_date = timezone.make_aware(datetime.fromisoformat(week_end))
            expenses = expenses.filter(created_at__gte=start_date, created_at__lt=end_date)

        elif period == "monthly" and year and month:
            start_date = timezone.make_aware(datetime(int(year), int(month), 1))
            end_date = (
                timezone.make_aware(datetime(int(year) + 1, 1, 1))
                if int(month) == 12
                else timezone.make_aware(datetime(int(year), int(month) + 1, 1))
            )
            expenses = expenses.filter(created_at__gte=start_date, created_at__lt=end_date)

        elif period == "yearly" and year:
            start_date = timezone.make_aware(datetime(int(year), 1, 1))
            end_date = timezone.make_aware(datetime(int(year) + 1, 1, 1))
            expenses = expenses.filter(created_at__gte=start_date, created_at__lt=end_date)

        wb = Workbook()
        ws = wb.active
        ws.title = "Expense Report"

        ws.append([
            "Expense ID",
            "Vendor",
            "Category",
            "Project",
            "Amount Requested",
            "Amount Paid",
            "Remaining",
            "Status",
            "Reason",
            "Created At",
        ])

        for e in expenses:
            ws.append([
                e.id,
                e.vendor.name if e.vendor else "",
                e.category.name,
                e.project.name if e.project else "",
                float(e.amount_requested),
                float(e.amount_paid),
                float(e.remaining_amount),
                e.status,
                e.reason,
                e.created_at.strftime("%Y-%m-%d"),
            ])

        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = 'attachment; filename="expense_report.xlsx"'
        wb.save(response)

        return response


class ExpenseReportPDFAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return self._generate_pdf(request)

    def post(self, request):
        return self._generate_pdf(request)

    def _generate_pdf(self, request):
        data_source = request.query_params if request.method == "GET" else request.data

        period = data_source.get("period")
        year = data_source.get("year")
        month = data_source.get("month")
        week_start = data_source.get("week_start")
        week_end = data_source.get("week_end")

        expenses = Expense.objects.select_related(
            "vendor", "category", "project"
        )

        if period == "weekly" and week_start and week_end:
            start_date = timezone.make_aware(datetime.fromisoformat(week_start))
            end_date = timezone.make_aware(datetime.fromisoformat(week_end))
            expenses = expenses.filter(created_at__gte=start_date, created_at__lt=end_date)

        elif period == "monthly" and year and month:
            start_date = timezone.make_aware(datetime(int(year), int(month), 1))
            end_date = (
                timezone.make_aware(datetime(int(year) + 1, 1, 1))
                if int(month) == 12
                else timezone.make_aware(datetime(int(year), int(month) + 1, 1))
            )
            expenses = expenses.filter(created_at__gte=start_date, created_at__lt=end_date)

        elif period == "yearly" and year:
            start_date = timezone.make_aware(datetime(int(year), 1, 1))
            end_date = timezone.make_aware(datetime(int(year) + 1, 1, 1))
            expenses = expenses.filter(created_at__gte=start_date, created_at__lt=end_date)

        total_remaining = expenses.aggregate(
            total=Sum(F("amount_requested") - F("amount_paid"))
        )["total"] or 0

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="expense_report.pdf"'

        doc = SimpleDocTemplate(response, pagesize=A4)
        styles = getSampleStyleSheet()
        elements = [Paragraph("Expense Report", styles["Title"]), Spacer(1, 12)]

        data = [[
            "ID",
            "Vendor",
            "Category",
            "Project",
            "Requested",
            "Paid",
            "Remaining",
            "Status",
        ]]

        for e in expenses:
            data.append([
                str(e.id),
                e.vendor.name if e.vendor else "",
                e.category.name,
                e.project.name if e.project else "",
                str(e.amount_requested),
                str(e.amount_paid),
                str(e.remaining_amount),
                e.status,
            ])

        table = Table(data, repeatRows=1)
        table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
            ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ]))

        elements.append(table)
        elements.append(Spacer(1, 20))

        elements.append(
            Paragraph(
                f"<b>Total Remaining Amount :</b> {total_remaining}",
                styles["Heading3"]
            )
        )

        doc.build(elements)

        return response
    
class RecurringExpenseListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = RecurringExpense.objects.all()
        serializer = RecurringExpenseSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = RecurringExpenseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
class RecurringExpenseDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        obj = get_object_or_404(RecurringExpense, pk=pk)
        serializer = RecurringExpenseSerializer(obj)
        return Response(serializer.data)

    def put(self, request, pk):
        obj = get_object_or_404(RecurringExpense, pk=pk)
        serializer = RecurringExpenseSerializer(obj, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        obj = get_object_or_404(RecurringExpense, pk=pk)
        obj.is_active = False
        obj.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)