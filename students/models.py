from django.db import models
from django.contrib.auth.models import AbstractBaseUser
from django.utils import timezone

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .manager import MyUserManager


class CustomUser(AbstractBaseUser):
    email = models.EmailField(
        verbose_name="email address",
        max_length=255,
        unique=True,
    )
    username = models.CharField(max_length=255, unique=True)
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)

    objects = MyUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email

    def has_perm(self, perm, obj=None):
        "Does the user have a specific permission?"
        return True

    def has_module_perms(self, app_label):
        "Does the user have permissions to view the app `app_label`?"
        return True

    @property
    def is_staff(self):
        "Is the user a member of staff?"
        return self.is_admin


class Guardian(models.Model):
    name = models.CharField(max_length=100, null=True, blank=True)
    cnic = models.CharField(
        max_length=15, unique=True,
        help_text="National ID number"
    )
    phone_number = models.CharField(max_length=15, unique=True)
    address = models.TextField(blank=True, null=True)
    last_message_send = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Student(models.Model):
    CLASS_CHOICES = [
        ('Nursery', 'Nursery'),
        ('Prep', 'Prep'),
        ('1', '1st Grade'),
        ('2', '2nd Grade'),
        ('3', '3rd Grade'),
        ('4', '4th Grade'),
        ('5', '5th Grade'),
        ('6', '6th Grade'),
        ('7', '7th Grade'),
        ('8', '8th Grade'),
        ('9', '9th Grade'),
        ('10', '10th Grade'),
        ('11', '1st Year'),
        ('12', '2nd Year'),
    ]

    name = models.CharField(max_length=100, null=True, blank=True)
    student_image = models.ImageField(
        upload_to='students_images/',
        blank=True, null=True
    )
    age = models.IntegerField(null=True, blank=True)
    grade = models.CharField(
        max_length=10,
        choices=CLASS_CHOICES,
        null=True,
        blank=True
    )
    guardian = models.ForeignKey(
        Guardian,
        related_name='students',
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    date_joined = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    total_tests_conducted = models.IntegerField(
        null=True, blank=True
    )
    overall_attendance = models.FloatField(
        null=True, blank=True, default=0.0
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class FeePayment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('late', 'Late'),
    ]

    student = models.ForeignKey(
        Student, related_name='payments',
        on_delete=models.CASCADE,
        null=True, blank=True
    )
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    month_paid_for = models.DateField(
        null=True, blank=True,
    )
    date_paid = models.DateField(auto_now_add=True)
    screenshot = models.ImageField(
        upload_to='fees_screenshots/',
        blank=True, null=True
    )
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES,
        null=True, blank=True
    )


class Teacher(models.Model):
    name = models.CharField(max_length=100, null=True, blank=True)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    salary = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True
    )
    date_joined = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class SalaryPayment(models.Model):
    teacher = models.ForeignKey(
        Teacher, related_name='salary_payments',
        on_delete=models.CASCADE, null=True, blank=True
    )
    amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    month = models.DateField(null=True, blank=True)
    salary_slip = models.FileField(
        upload_to='salary_slips/', blank=True, null=True
    )
    paid_on = models.DateField(auto_now_add=True)


class ExpenseCategory(models.TextChoices):
    SALARY = 'salary', 'Salary'
    RENT = 'rent', 'Rent'
    UTILITIES = 'utilities', 'Utilities'
    OTHER = 'other', 'Other'


class ExpenseStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    PAID = 'paid', 'Paid'


class Expense(models.Model):
    title = models.CharField(max_length=100, null=True, blank=True)
    category = models.CharField(
        max_length=20,
        choices=ExpenseCategory.choices,
        null=True,
        blank=True
    )
    amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    expense_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=10,
        choices=ExpenseStatus.choices,
        null=True,
        blank=True
    )
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class StudentTestRecords(models.Model):
    student = models.ForeignKey(
        Student, on_delete=models.CASCADE,
        related_name='test_records',
        null=True, blank=True
    )
    test_date = models.DateField(null=True, blank=True)
    test_name = models.CharField(
        max_length=100, null=True, blank=True
    )
    subject = models.CharField(
        max_length=100, null=True, blank=True
    )
    total_marks = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    obtained_marks = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    percentage = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    remarks = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.total_marks and self.obtained_marks is not None:
            self.percentage = (self.obtained_marks / self.total_marks) * 100
        else:
            self.percentage = None
        super().save(*args, **kwargs)


@receiver(post_delete, sender=StudentTestRecords)
def update_student_total_tests(sender, instance, **kwargs):
    student = instance.student

    if (
        student and student.total_tests_conducted is not None and
        student.total_tests_conducted > 0
    ):
        student.total_tests_conducted -= 1
        student.save(update_fields=['total_tests_conducted'])


class Subject(models.Model):
    name = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class TeacherSubject(models.Model):
    teacher = models.ForeignKey(
        Teacher, on_delete=models.CASCADE,
        related_name='teacher_subjects',
        null=True, blank=True
    )
    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE,
        related_name='teacher_subjects',
        null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class AttendanceStatus(models.TextChoices):
    PRESENT = 'present', 'Present'
    ABSENT = 'absent', 'Absent'
    LEAVE = 'leave', 'Leave'
    LATE = 'late', 'Late'


class StudentAttendance(models.Model):
    student = models.ForeignKey(
        Student, on_delete=models.CASCADE,
        related_name='attendance',
        null=True, blank=True
    )
    date = models.DateField(default=timezone.now)
    status = models.CharField(
        max_length=10,
        choices=AttendanceStatus.choices,
        null=True, blank=True
    )
    remarks = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'date')


def recalc_overall_attendance(student):
    total = student.attendance.count()
    if total > 0:
        present_count = student.attendance.filter(
            status=AttendanceStatus.PRESENT
        ).count()
        student.overall_attendance = present_count / total * 100
    else:
        student.overall_attendance = 0
    student.save(update_fields=['overall_attendance'])


@receiver(post_save, sender=StudentAttendance)
def update_student_attendance(sender, instance, **kwargs):
    recalc_overall_attendance(instance.student)


@receiver(post_delete, sender=StudentAttendance)
def update_student_attendance_on_delete(sender, instance, **kwargs):
    recalc_overall_attendance(instance.student)
