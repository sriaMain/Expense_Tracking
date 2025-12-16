import random
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import F
from django.http import HttpResponse
from openpyxl import Workbook
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
import logging
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging

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
            return Response({"error": "identifier and password required"}, status=400)

        user = authenticate(request, username=identifier, password=password)

        if user is None:
            try:
                u = User.objects.get(email=identifier)
                user = authenticate(request, username=u.username, password=password)
            except User.DoesNotExist:
                return Response({"error": "Invalid credentials"}, status=401)

        if not user.is_active or not user.is_staff:
            return Response({"error": "Access denied"}, status=403)

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
            status=200,
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
        user = get_object_or_404(User, pk=pk, is_staff=True)
        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_active": user.is_active,
            }
        )

    def put(self, request, pk):
        user = get_object_or_404(User, pk=pk, is_staff=True)

        if user.id == request.user.id:
            return Response({"error": "Cannot update yourself"}, status=400)

        user.email = request.data.get("email", user.email)
        user.save()
        return Response({"message": "User updated"})

    def delete(self, request, pk):
        user = get_object_or_404(User, pk=pk, is_staff=True)

        if user.id == request.user.id:
            return Response({"error": "Cannot disable yourself"}, status=400)

        user.is_active = False
        user.save(update_fields=["is_active"])
        return Response(status=204)

# class LogoutAPIView(APIView):
#     permission_classes = [IsAuthenticated]

#     def post(self, request):
#         data = request.data or {}
#         refresh = data.get("refresh")

#         if not refresh:
#             return Response(
#                 {"error": "refresh token required"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         try:
#             token = RefreshToken(refresh)
#             token.blacklist()
#         except Exception:
#             return Response(
#                 {"error": "Invalid or expired refresh token"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         return Response(
#             {"message": "Logout successful"},
#             status=status.HTTP_200_OK
        # )
class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response(
            {"message": "Logout successful"},
            status=status.HTTP_200_OK
        )
        
        
class ForgotPasswordAPIView(APIView):
    authentication_classes = []
    permission_classes = []

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
    permission_classes = []

    def post(self, request):
        email = request.data.get("email")
        otp = request.data.get("otp")

        if not email or not otp:
            return Response(
                {"error": "email and otp are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email, is_active=True)
            otp_obj = PasswordResetOTP.objects.filter(
                user=user,
                otp=otp,
                is_verified=False
            ).latest("created_at")
        except:
            return Response(
                {"error": "Invalid OTP"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if otp_obj.is_expired():
            return Response(
                {"error": "OTP expired"},
                status=status.HTTP_400_BAD_REQUEST
            )

        otp_obj.is_verified = True
        otp_obj.save(update_fields=["is_verified"])

        return Response(
            {"message": "OTP verified successfully"},
            status=status.HTTP_200_OK
        )
        

class ResetPasswordAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        email = request.data.get("email")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not email or not new_password or not confirm_password:
            return Response(
                {"error": "email, new_password and confirm_password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != confirm_password:
            return Response(
                {"error": "Passwords do not match"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email__iexact=email, is_active=True)
        except User.DoesNotExist:
            return Response(
                {"error": "Invalid request"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            otp_obj = PasswordResetOTP.objects.filter(
                user=user,
                is_verified=True
            ).latest("created_at")
        except PasswordResetOTP.DoesNotExist:
            return Response(
                {"error": "OTP verification required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if otp_obj.is_expired():
            return Response(
                {"error": "OTP expired"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            validate_password(new_password, user)
        except Exception as e:
            return Response(
                {"error": list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save(update_fields=["password"])

        PasswordResetOTP.objects.filter(user=user).delete()

        logger.info(f"Password reset successful for user_id={user.id}")

        return Response(
            {"message": "Password reset successful"},
            status=status.HTTP_200_OK
        )


class EmployeeListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(EmployeeSerializer(Employee.objects.filter(is_active=True), many=True).data)

    def post(self, request):
        s = EmployeeSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save(created_by=request.user)
        data = dict(s.data)
        name = data.pop("full_name", None)
        data.pop("employee_id", None)
        if name is not None:
            data["employee_name"] = name
        return Response(data, status=201)


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

    @transaction.atomic
    def post(self, request):
        s = PaymentSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        payment_amount = s.validated_data["amount"]
        expense = s.validated_data["expense"]

        if payment_amount <= 0:
            return Response({"error": "Invalid amount"}, status=400)

        remaining = expense.amount_requested - expense.amount_paid
        if payment_amount > remaining:
            return Response({"error": "Payment exceeds remaining balance"}, status=400)

        payment = s.save(created_by=request.user)

        Expense.objects.filter(pk=expense.pk).update(amount_paid=F("amount_paid") + payment_amount)

        expense.refresh_from_db()
        if expense.amount_paid >= expense.amount_requested:
            expense.status = Expense.STATUS_PAID
            expense.save(update_fields=["status"])

        return Response(PaymentSerializer(payment).data, status=201)

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

        if not start_date or not end_date:
            return Response(
                {"error": "start_date and end_date are required"},
                status=400
            )

        expenses = Expense.objects.select_related(
            "employee", "category", "created_by"
        ).filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        )

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
            f'attachment; filename="expense_report_{start_date}_to_{end_date}.xlsx"'
        )

        wb.save(response)
        return response


class ExpenseReportPDFAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        start_date = request.data.get("start_date")
        end_date = request.data.get("end_date")

        if not start_date or not end_date:
            return Response(
                {"error": "start_date and end_date are required"},
                status=400
            )

        expenses = Expense.objects.select_related(
            "employee", "category", "created_by"
        ).filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        )

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = (
            f'attachment; filename="expense_report_{start_date}_to_{end_date}.pdf"'
        )

        pdf = canvas.Canvas(response, pagesize=A4)
        width, height = A4
        y = height - 40

        pdf.setFont("Helvetica-Bold", 14)
        pdf.drawString(40, y, "Expense Report")
        y -= 25

        pdf.setFont("Helvetica", 9)

        for e in expenses:
            if y < 50:
                pdf.showPage()
                pdf.setFont("Helvetica", 9)
                y = height - 40

            pdf.drawString(
                40,
                y,
                f"{e.employee.full_name} | {e.category.name} | "
                f"Req: {e.amount_requested} | Paid: {e.amount_paid} | {e.status}"
            )
            y -= 15

        pdf.save()
        return response
