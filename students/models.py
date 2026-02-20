from django.db import models
from django.contrib.auth.models import AbstractBaseUser
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
    subject = models.CharField(max_length=50, null=True, blank=True)
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
