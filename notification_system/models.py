from django.db import models

from students.models import Student, Teacher


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
