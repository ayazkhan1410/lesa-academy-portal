from django.contrib import admin
from .models import (
    CustomUser, Guardian, Student,
    FeePayment, Teacher, SalaryPayment,
    Expense, StudentTestRecords, Subject, TeacherSubject
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
        'is_active', 'total_tests_conducted', 'created_at'
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
        'id', 'name', 'phone_number',
        'salary', 'date_joined', 'created_at'
    )
    list_filter = ('date_joined', 'created_at')
    search_fields = ('name', 'phone_number')


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


@admin.register(StudentTestRecords)
class StudentTestRecordsAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'student',
        'test_name',
        'subject',
        'test_date',
        'total_marks',
        'obtained_marks',
        'percentage',
    )

    list_filter = ('subject', 'test_date', 'student')
    search_fields = ('student__name', 'test_name', 'subject', 'remarks')
    readonly_fields = ('percentage', 'created_at', 'updated_at')


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('name',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(TeacherSubject)
class TeacherSubjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'teacher', 'subject', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('teacher__name', 'subject__name')
    readonly_fields = ('created_at', 'updated_at')
