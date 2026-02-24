import calendar

from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

from django.utils import timezone
from datetime import timedelta

from students.models import (
    Student, Teacher, StudentAttendance,
    AttendanceStatus, FeePayment
)


class NotificationPriority(models.TextChoices):
    HIGH = "HIGH", "High"
    MEDIUM = "MEDIUM", "Medium"
    LOW = "LOW", "Low"


class NotificationType(models.TextChoices):
    STUDENT = "STUDENT", "Student"
    TEACHER = "TEACHER", "Teacher"


class BaseClass(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class NotificationPreference(BaseClass):
    priority = models.CharField(
        max_length=10,
        choices=NotificationPriority.choices,
        default=NotificationPriority.MEDIUM,
        blank=True,
        null=True,
    )
    retention_period = models.IntegerField(
        default=10,
        help_text="Number of days to keep notifications",
        blank=True,
        null=True,
    )
    default_notification_type = models.CharField(
        max_length=10,
        choices=NotificationType.choices,
        default=NotificationType.STUDENT,
        blank=True,
        null=True,
    )
    is_active = models.BooleanField(default=True)


class Notification(BaseClass):
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="notifications",
        blank=True,
        null=True,
    )
    teacher = models.ForeignKey(
        Teacher,
        on_delete=models.CASCADE,
        related_name="notifications",
        blank=True,
        null=True,
    )
    title = models.CharField(max_length=255, blank=True, null=True)
    message = models.TextField(blank=True, null=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    priority = models.CharField(
        max_length=10,
        choices=NotificationPriority.choices,
        default=NotificationPriority.MEDIUM,
        blank=True,
        null=True,
    )
    notification_type = models.CharField(
        max_length=10,
        choices=NotificationType.choices,
        default=NotificationType.STUDENT,
        blank=True,
        null=True,
    )
    expires_at = models.DateTimeField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)


@receiver(post_save, sender=StudentAttendance)
def attendance_shortage_notification(sender, instance, **kwargs):
    student = instance.student
    attendance = getattr(student, 'overall_attendance', None)

    if attendance is None or attendance == 0:
        return

    notifications_enabled = NotificationPreference.objects.filter(
        default_notification_type=NotificationType.STUDENT,
        is_active=True,
    ).exists()
    if not notifications_enabled:
        return

    has_low_attendance = attendance < 80
    today = timezone.now().date()

    attendance_status = [AttendanceStatus.ABSENT, AttendanceStatus.LEAVE]
    has_three_absences_this_month = StudentAttendance.objects.filter(
        student=student,
        status__in=attendance_status,
        date__year=today.year,
        date__month=today.month,
    ).count() >= 3

    if has_three_absences_this_month:
        already_notified = Notification.objects.filter(
            title="Monthly Absences Alert",
            student=student,
            notification_type=NotificationType.STUDENT,
            is_active=True,
        ).exists()

        if not already_notified:
            Notification.objects.create(
                student=student,
                title="Monthly Absences Alert",
                message=(
                    f"Student name {student.name} has "
                    f"3 absences this month"
                ),
                priority=NotificationPriority.HIGH,
                notification_type=NotificationType.STUDENT,
                is_active=True,
            )

    if has_low_attendance:
        already_notified = Notification.objects.filter(
            title="Attendance Alert",
            student=student,
            notification_type=NotificationType.STUDENT,
            is_active=True,
        ).exists()

        if not already_notified:
            Notification.objects.create(
                student=student,
                title="Attendance Alert",
                message=(
                    f"Student name {student.name} has "
                    f"overall attendance of {student.overall_attendance:.2f}%"
                ),
                priority=NotificationPriority.HIGH,
                notification_type=NotificationType.STUDENT,
                is_active=True,
            )


@receiver(post_save, sender=FeePayment)
def send_fee_payment_notification(sender, instance, **kwargs):
    student = instance.student

    notifications_enabled = NotificationPreference.objects.filter(
        default_notification_type=NotificationType.STUDENT,
        is_active=True,
    ).exists()
    if not notifications_enabled:
        return
    is_pending = instance.status == 'pending'

    today = timezone.now().date()
    _, last_day_num = calendar.monthrange(today.year, today.month)
    last_day_of_month = today.replace(day=last_day_num)
    ten_days_before_end = last_day_of_month - timedelta(days=10)
    is_within_date_window = ten_days_before_end <= today <= last_day_of_month

    already_notified = Notification.objects.filter(
        title="Fee Payment Alert",
        student=student,
        notification_type=NotificationType.STUDENT,
        is_active=True,
    ).exists()

    if (
        not already_notified and
        is_within_date_window and
        is_pending
    ):
        Notification.objects.create(
            student=student,
            title="Fee Payment Alert",
            message=(
                f"Student name {student.name} has "
                f"Pending Fee Payment with amount of {instance.amount}"
            ),
            priority=NotificationPriority.HIGH,
            notification_type=NotificationType.STUDENT,
            is_active=True,
        )
