from django.contrib import admin
from django.urls import path
from django.conf.urls.static import static
from django.conf import settings

from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from students.views import (
    SecureLoginAPIView,
    ListCreateStudentAPIView,
    BulkEnrollStudentAPIView,
    ListGuardianAPIView,
    GuardianDetailAPIView,
    StudentDetailAPIView,
    ListCreatePaymentAPIView,
    DashboardStatsAPIView,
    SendMessageAPIView,
    ListCreateExpenseAPIView,
    ExpenseDetailAPIView,
    MonthlyFinanceSummaryAPIView,
    BulkTestRecordsAPIView,
    StudentAcademicSummaryAPIView,
)


urlpatterns = [
    path('admin/', admin.site.urls),

    # Swagger
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path(
        'docs/',
        SpectacularSwaggerView.as_view(url_name='schema'),
        name='swagger-ui'
    ),

    # JWT
    path(
        "api/token/",
        TokenObtainPairView.as_view(), name='token_obtain_pair'
    ),
    path(
        "api/token/refresh/",
        TokenRefreshView.as_view(), name='token_refresh'
    ),

    # Endpoints
    path("api/secure-login/", SecureLoginAPIView.as_view()),
    path('api/guardian/', ListGuardianAPIView.as_view()),
    path('api/guardian/<int:pk>/', GuardianDetailAPIView.as_view()),
    path("api/students/", ListCreateStudentAPIView.as_view()),
    path('api/students/<int:student_id>/', StudentDetailAPIView.as_view()),
    path('api/bulk-enroll-students', BulkEnrollStudentAPIView.as_view()),
    path('api/payments/', ListCreatePaymentAPIView.as_view()),
    path("api/dashboard-stats", DashboardStatsAPIView.as_view()),
    path("api/send-message/", SendMessageAPIView.as_view()),
    path("api/expenses/", ListCreateExpenseAPIView.as_view()),
    path("api/expenses/<int:pk>", ExpenseDetailAPIView.as_view()),
    path(
        'api/finances/monthly-summary/',
        MonthlyFinanceSummaryAPIView.as_view()
    ),
    path(
        'api/students/<int:student_id>/test-records-bulk/',
        BulkTestRecordsAPIView.as_view()
    ),
    path(
        'api/students/<int:student_id>/academic-summary/',
        StudentAcademicSummaryAPIView.as_view()
    ),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL, document_root=settings.MEDIA_ROOT
    )
