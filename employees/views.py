import random
from datetime import datetime
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import F
from django.http import HttpResponse
from openpyxl import Workbook
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
import logging
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.core.signing import Signer, BadSignature, SignatureExpired
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph 
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from django.core.signing import TimestampSigner 
signer = TimestampSigner()

from .models import PasswordResetOTP

logger = logging.getLogger(__name__)


from rest_framework import status
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.core.mail import send_mail
from django.conf import settings
from .models import PasswordResetOTP
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.password_validation import validate_password
from .models import Employee, ExpenseCategory, Expense, Payment
from .serializers import (
    EmployeeSerializer,
    ExpenseCategorySerializer,
    ExpenseSerializer,
    PaymentSerializer,
    PaymentMiniSerializer,
)


class LoginAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        identifier = request.data.get("identifier")
        password = request.data.get("password")

        if not identifier or not password:
            return Response(
                {"error": "Username/Email and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user_obj = User.objects.get(username=identifier)
        except User.DoesNotExist:
            try:
                user_obj = User.objects.get(email=identifier)
            except User.DoesNotExist:
                return Response(
                    {"error": "Invalid username or email"},
                    status=status.HTTP_401_UNAUTHORIZED
                )

        user = authenticate(
            request,
            username=user_obj.username,
            password=password
        )

        if user is None:
            return Response(
                {"error": "Invalid password"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {"error": "Account is disabled. Contact administrator"},
                status=status.HTTP_403_FORBIDDEN
            )

        if not user.is_staff:
            return Response(
                {"error": "Access denied"},
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "is_staff": user.is_staff,
                },
            },
            status=status.HTTP_200_OK
        )

class UserListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = User.objects.filter(is_staff=True)
        data = []
        for u in users:
            data.append(
                {
                    "id": u.id,
                    "username": u.username,
                    "email": u.email,
                    "is_active": u.is_active,
                    "created_by": u.last_name or "system",
                }
            )
        return Response(data)

    def post(self, request):
        if not request.user.is_staff:
            return Response({"error": "Forbidden"}, status=403)

        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")

        if not username or not password:
            return Response({"error": "username and password required"}, status=400)

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists"}, status=400)

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_staff=True,
            is_active=True,
        )
        user.last_name = request.user.username
        user.save()

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            },
            status=201,
        )


class UserDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_active": user.is_active,
            "is_staff": user.is_staff,
        })

    def put(self, request, pk):
        if not request.user.is_superuser:
            return Response(
                {"error": "Only superadmin can update users"},
                status=status.HTTP_403_FORBIDDEN
            )

        user = get_object_or_404(User, pk=pk)

        if user.id == request.user.id:
            return Response(
                {"error": "Cannot update yourself"},
                status=status.HTTP_400_BAD_REQUEST
            )

        username = request.data.get("username")
        password = request.data.get("password")
        is_active = request.data.get("is_active")

        updated = False

        if username:
            if User.objects.filter(username=username).exclude(pk=user.pk).exists():
                return Response(
                    {"error": "Username already exists"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.username = username
            updated = True

        if password:
            try:
                validate_password(password, user)
            except Exception as e:
                return Response(
                    {"error": list(e.messages)},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.set_password(password)
            updated = True

        if is_active is not None:
            user.is_active = bool(is_active)
            updated = True

        if not updated:
            return Response(
                {"message": "No changes detected"},
                status=status.HTTP_200_OK
            )

        user.save()
        return Response(
            {"message": "User updated successfully"},
            status=status.HTTP_200_OK
        )

    def delete(self, request, pk):
        if not request.user.is_superuser:
            return Response(
                {"error": "Only superadmin can delete or disable users"},
                status=status.HTTP_403_FORBIDDEN
            )

        user = get_object_or_404(User, pk=pk)

        if user.id == request.user.id:
            return Response(
                {"error": "Cannot delete or disable yourself"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user.is_superuser:
            return Response(
                {"error": "Cannot delete or disable superadmin users"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.is_active = False
        user.save(update_fields=["is_active"])

        return Response(
            {"message": "User account disabled successfully"},
            status=status.HTTP_200_OK
        )

class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response(
            {"message": "Logout successful"},
            status=status.HTTP_200_OK
        )
        
        
class ForgotPasswordAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")

        logger.info(f"Forgot password requested for email: {email}")

        if not email:
            logger.warning("Email missing in forgot-password request")
            return Response(
                {"error": "email is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email__iexact=email, is_active=True)
            logger.info(f"User found for email: {email}, user_id={user.id}")

        except User.DoesNotExist:
            logger.warning(f"No active user found for email: {email}")

            return Response(
                {"message": "If the email exists, OTP has been sent"},
                status=status.HTTP_200_OK
            )

        except User.MultipleObjectsReturned:
            logger.error(f"Multiple users found for email: {email}")
            user = User.objects.filter(email__iexact=email, is_active=True).first()

        otp = f"{random.randint(100000, 999999)}"
        logger.debug(f"Generated OTP for user_id={user.id}: {otp}")

        PasswordResetOTP.objects.create(
            user=user,
            otp=otp
        )

        send_mail(
            subject="Password Reset OTP",
            message=(
                f"Hello {user.username},\n\n"
                f"Your OTP is {otp}. It is valid for 10 minutes.\n\n"
                f"If you did not request this, please ignore this email."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )

        logger.info(f"OTP sent successfully to email: {email}")

        return Response(
            {"message": "OTP sent to email"},
            status=status.HTTP_200_OK
        )


class VerifyOTPAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        otp = request.data.get("otp")

        if not email or not otp:
            return Response(
                {"error": "email and otp are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email__iexact=email, is_active=True)
            otp_obj = PasswordResetOTP.objects.filter(
                user=user,
                otp=otp,
                is_verified=False
            ).latest("created_at")
        except PasswordResetOTP.DoesNotExist:
            return Response({"error": "Invalid OTP"}, status=400)

        if otp_obj.is_expired():
            return Response({"error": "OTP expired"}, status=400)

        otp_obj.is_verified = True
        otp_obj.save(update_fields=["is_verified"])

        reset_token = signer.sign(user.pk)

        return Response(
            {
                "message": "OTP verified",
                "reset_token": reset_token
            },
            status=200
        )
        
     
class ResetPasswordAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        reset_token = request.data.get("reset_token")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not reset_token or not new_password or not confirm_password:
            return Response(
                {"error": "reset_token, new_password, confirm_password required"},
                status=400
            )

        if new_password != confirm_password:
            return Response({"error": "Passwords do not match"}, status=400)

        try:
            user_id = signer.unsign(reset_token, max_age=600)
            user = User.objects.get(pk=user_id, is_active=True)
        except SignatureExpired:
            return Response({"error": "Reset token expired"}, status=400)
        except BadSignature:
            return Response({"error": "Invalid reset token"}, status=400)
        except User.DoesNotExist:
            return Response({"error": "Invalid user"}, status=400)

        try:
            validate_password(new_password, user)
        except Exception as e:
            return Response({"error": list(e.messages)}, status=400)

        user.set_password(new_password)
        user.save(update_fields=["password"])

        PasswordResetOTP.objects.filter(user=user).delete()

        return Response(
            {"message": "Password reset successful"},
            status=200
        )


class ChangePasswordAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not old_password or not new_password:
            return Response(
                {"error": "old_password and new_password required"},
                status=400
            )

        user = request.user

        if not user.check_password(old_password):
            return Response({"error": "Old password incorrect"}, status=400)

        try:
            validate_password(new_password, user)
        except Exception as e:
            return Response({"error": list(e.messages)}, status=400)

        user.set_password(new_password)
        user.save(update_fields=["password"])

        return Response({"message": "Password changed successfully"}, status=200)


class EmployeeListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        employees = (
            Employee.objects
            .filter(is_active=True)
            .prefetch_related(
                "expense_set__payments",
                "expense_set__category"
            )
            .select_related("created_by")
        )

        serializer = EmployeeSerializer(employees, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = EmployeeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user)
        return Response(serializer.data, status=201)


class EmployeeDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        return Response(EmployeeSerializer(get_object_or_404(Employee, pk=pk)).data)

    def put(self, request, pk):
        e = get_object_or_404(Employee, pk=pk)
        s = EmployeeSerializer(e, data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)

    def delete(self, request, pk):
        e = get_object_or_404(Employee, pk=pk)
        e.is_active = False
        e.save()
        return Response(status=204)


class ExpenseCategoryListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(ExpenseCategorySerializer(ExpenseCategory.objects.filter(is_active=True), many=True).data)

    def post(self, request):
        s = ExpenseCategorySerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data, status=201)


class ExpenseListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(ExpenseSerializer(Expense.objects.all(), many=True).data)

    def post(self, request):
        s = ExpenseSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save(created_by=request.user)
        return Response(s.data, status=201)


class ExpenseDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        return Response(ExpenseSerializer(get_object_or_404(Expense, pk=pk)).data)

    def put(self, request, pk):
        e = get_object_or_404(Expense, pk=pk)

        if e.status == Expense.STATUS_PAID:
            return Response({"error": "Expense already paid"}, status=400)

        s = ExpenseSerializer(e, data=request.data)
        s.is_valid(raise_exception=True)
        s.save(updated_by=request.user)
        return Response(s.data)

    def delete(self, request, pk):
        get_object_or_404(Expense, pk=pk).delete()
        return Response(status=204)


class EmployeeExpensesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        employee = get_object_or_404(Employee, pk=pk, is_active=True)

        expenses = (
            Expense.objects.filter(employee=employee)
            .select_related("employee", "category", "created_by", "updated_by")
            .prefetch_related("payments__created_by")
            .order_by("-created_at")
        )

        serializer = ExpenseSerializer(expenses, many=True)

        return Response(
            {
                "employee": {
                    "employee_id": employee.employee_id,
                    "full_name": employee.full_name,
                    "department": employee.department,
                    "designation": employee.designation,
                },
                "expenses": serializer.data,
            }
        )
    


class PaymentListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        payments = (
            Payment.objects
            .select_related("expense", "expense__employee", "created_by")
            .order_by("-paid_at")
        )

        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @transaction.atomic
    def post(self, request):
        serializer = PaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        expense = serializer.validated_data["expense"]
        amount = serializer.validated_data["amount"]

        remaining = expense.amount_requested - expense.amount_paid

        if amount > remaining:
            return Response(
                {"error": "Payment exceeds remaining balance"},
                status=status.HTTP_400_BAD_REQUEST
            )

        payment = serializer.save(created_by=request.user)

        Expense.objects.filter(pk=expense.pk).update(
            amount_paid=F("amount_paid") + amount
        )

        expense.refresh_from_db()

        if expense.amount_paid == 0:
            expense.status = Expense.STATUS_UNPAID
        elif expense.amount_paid < expense.amount_requested:
            expense.status = Expense.STATUS_PARTIAL
        else:
            expense.status = Expense.STATUS_PAID

        expense.save(update_fields=["status"])

        return Response(
    {
        "message": "Payment added successfully",
        "expense": ExpenseSerializer(expense).data
    },
    status=status.HTTP_201_CREATED
)

class PaymentDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        payment = get_object_or_404(Payment, pk=pk)
        return Response(PaymentSerializer(payment).data)

    def delete(self, request, pk):
        payment = get_object_or_404(Payment, pk=pk)
        expense = payment.expense

        if expense.status == Expense.STATUS_PAID:
            return Response(
                {"error": "Cannot delete payment for paid expense"},
                status=400
            )

        payment.delete()
        return Response(status=204)


class EmployeePaymentsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        payments = Payment.objects.filter(expense__employee__pk=pk).order_by("paid_at")
        serializer = PaymentMiniSerializer(payments, many=True)
        return Response(serializer.data)
    
class ExpenseReportExcelAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        start_date = request.data.get("start_date")
        end_date = request.data.get("end_date")

        expenses = Expense.objects.select_related(
            "employee", "category", "created_by"
        )

        if start_date and end_date:
            expenses = expenses.filter(
                created_at__date__gte=start_date,
                created_at__date__lte=end_date
            )
            filename = f"expense_report_{start_date}_to_{end_date}.xlsx"
        else:
            filename = "expense_report_all.xlsx"

        wb = Workbook()
        ws = wb.active
        ws.title = "Expenses"

        ws.append([
            "Expense ID",
            "Employee",
            "Category",
            "Amount Requested",
            "Amount Paid",
            "Status",
            "Created By",
            "Created At",
        ])

        for e in expenses:
            ws.append([
                e.id,
                e.employee.full_name,
                e.category.name,
                float(e.amount_requested),
                float(e.amount_paid),
                e.status,
                e.created_by.username if e.created_by else "",
                e.created_at.strftime("%Y-%m-%d"),
            ])

        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = (
            f'attachment; filename="{filename}"'
        )

        wb.save(response)
        return response


class ExpenseReportPDFAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        start_date = request.data.get("start_date")
        end_date = request.data.get("end_date")

        expenses = Expense.objects.select_related(
            "employee", "category", "created_by"
        )

        if start_date and end_date:
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            end_date = datetime.strptime(end_date, "%Y-%m-%d").date()

            expenses = expenses.filter(
                created_at__date__gte=start_date,
                created_at__date__lte=end_date
            )

            filename = f"expense_report_{start_date}_to_{end_date}.pdf"
        else:
            filename = "expense_report_all.pdf"

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        doc = SimpleDocTemplate(
            response,
            pagesize=A4,
            rightMargin=30,
            leftMargin=30,
            topMargin=30,
            bottomMargin=30,
        )

        styles = getSampleStyleSheet()
        elements = []

        elements.append(Paragraph("<b>Expense Report</b>", styles["Title"]))

        table_data = [
            [
                "Employee",
                "Category",
                "Amount Requested",
                "Amount Paid",
                "Remaining",
                "Status",
                "Date",
            ]
        ]

        for e in expenses:
            table_data.append([
                e.employee.full_name,
                e.category.name,
                str(e.amount_requested),
                str(e.amount_paid),
                str(e.amount_requested - e.amount_paid),
                e.status,
                e.created_at.strftime("%Y-%m-%d"),
            ])

        table = Table(table_data, repeatRows=1)

        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ALIGN", (2, 1), (-1, -1), "CENTER"),
            ("GRID", (0, 0), (-1, -1), 1, colors.black),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
            ("TOPPADDING", (0, 0), (-1, 0), 8),
        ]))

        elements.append(table)
        doc.build(elements)

        return response