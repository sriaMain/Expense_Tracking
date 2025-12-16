from django.urls import path
from .views import (
    LoginAPIView,
    UserListCreateAPIView,
    UserDetailAPIView,
    ResetPasswordAPIView,
    EmployeeListCreateAPIView,
    EmployeeDetailAPIView,
    ExpenseCategoryListCreateAPIView,
    ExpenseListCreateAPIView,
    ExpenseDetailAPIView,
    PaymentListCreateAPIView,
    PaymentDetailAPIView,
    ExpenseReportExcelAPIView,
    ExpenseReportPDFAPIView,
    LogoutAPIView,
    ForgotPasswordAPIView,
    VerifyOTPAPIView,
    ResetPasswordAPIView,
    EmployeePaymentsAPIView,EmployeeExpensesAPIView,
)

urlpatterns = [
    path("login/", LoginAPIView.as_view()),
    path("logout/", LogoutAPIView.as_view()),
    path("forgot-password/", ForgotPasswordAPIView.as_view()),
    path("verify-otp/", VerifyOTPAPIView.as_view()),
    path("reset-password/", ResetPasswordAPIView.as_view()),

    path("users/", UserListCreateAPIView.as_view()),
    path("users/<int:pk>/", UserDetailAPIView.as_view()),
    path("users/<int:pk>/reset-password/", ResetPasswordAPIView.as_view()),

    path("employees/", EmployeeListCreateAPIView.as_view()),
    path("employees/<int:pk>/", EmployeeDetailAPIView.as_view()),
    path("employees/<int:pk>/payments/", EmployeePaymentsAPIView.as_view()),
    path("employees/<int:pk>/expenses/",EmployeeExpensesAPIView.as_view()),

    path("categories/", ExpenseCategoryListCreateAPIView.as_view()),

    path("expenses/", ExpenseListCreateAPIView.as_view()),
    path("expenses/<int:pk>/", ExpenseDetailAPIView.as_view()),

    path("payments/", PaymentListCreateAPIView.as_view()),
    path("payments/<int:pk>/", PaymentDetailAPIView.as_view()),
    
    path("reports/excel/", ExpenseReportExcelAPIView.as_view()),
    path("reports/pdf/", ExpenseReportPDFAPIView.as_view()),

]
