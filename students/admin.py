from django.contrib import admin
from .models import (
    CustomUser, Guardian, Student,
    FeePayment, Teacher, SalaryPayment,
    Expense
)


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'email', 'username', 'is_active', 'is_admin', 'is_staff'
    )
    list_filter = ('is_active', 'is_admin')
    search_fields = ('email', 'username')
    ordering = ('email',)


@admin.register(Guardian)
class GuardianAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'name', 'cnic', 'phone_number',
        'last_message_send', 'address', 'created_at'
    )
    search_fields = ('name', 'cnic', 'phone_number')


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'name', 'age', 'grade', 'student_image',
        'guardian', 'date_joined',
        'is_active', 'created_at'
    )
    list_filter = ('grade', 'is_active', 'date_joined')
    search_fields = ('name', 'guardian__name')
    autocomplete_fields = ['guardian']


@admin.register(FeePayment)
class FeePaymentAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'student', 'amount', 'month_paid_for', 'date_paid', 'status'
    )
    list_filter = ('status', 'month_paid_for', 'date_paid')
    search_fields = ('student__name',)
    readonly_fields = ('date_paid',)


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'name', 'phone_number', 'subject',
        'salary', 'date_joined', 'created_at'
    )
    list_filter = ('subject', 'date_joined')
    search_fields = ('name', 'subject')


@admin.register(SalaryPayment)
class SalaryPaymentAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'teacher', 'amount', 'month', 'paid_on', 'salary_slip'
    )
    list_filter = ('month', 'paid_on')
    search_fields = ('teacher__name',)


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "category",
        "amount",
        "status",
        "expense_date",
        "created_at",
        "updated_at"
    )

    list_filter = (
        "category",
        "status",
        "expense_date",
        "created_at",
    )

    search_fields = (
        "title",
        "description",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    fieldsets = (
        ("Basic Information", {
            "fields": ("title", "category", "amount", "status")
        }),
        ("Details", {
            "fields": ("expense_date", "description")
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at")
        }),
    )
