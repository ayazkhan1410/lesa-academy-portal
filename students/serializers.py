import base64
import uuid

from django.db import transaction, models
from django.core.files.base import ContentFile
from rest_framework import serializers

from .models import (
    Student, Guardian, FeePayment, Expense, StudentTestRecords,
    StudentAttendance, AttendanceStatus,
    Teacher, SalaryPayment, Subject, TeacherSubject
)


class Base64ImageField(serializers.ImageField):
    def to_internal_value(self, data):
        if isinstance(data, str) and data.startswith('data:image'):
            try:
                format, imgstr = data.split(';base64,')
                ext = format.split('/')[-1]
                data = ContentFile(
                    base64.b64decode(imgstr),
                    name=f"student_{uuid.uuid4()}.{ext}"
                )
            except Exception:
                raise serializers.ValidationError("Invalid base64 image")

        return super().to_internal_value(data)


class ReadStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'


class CreateGuardianSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guardian
        fields = ['id', 'name', 'cnic', 'phone_number', 'address']
        extra_kwargs = {
            'cnic': {'validators': []},
            'phone_number': {'validators': []}
        }


class GuardianDetailSerializer(serializers.ModelSerializer):
    students = ReadStudentSerializer(many=True, read_only=True)

    class Meta:
        model = Guardian
        fields = [
            'id', 'name', 'cnic', 'phone_number',
            'address', 'students'
        ]


class CreateFeePayment(serializers.ModelSerializer):
    class Meta:
        model = FeePayment
        fields = ['amount', 'month_paid_for', 'screenshot', 'status']


class CreateStudentSerializer(serializers.ModelSerializer):
    guardian = CreateGuardianSerializer()
    payments = CreateFeePayment(write_only=True, required=False)
    student_image = Base64ImageField(required=False, allow_null=True)

    class Meta:
        model = Student
        fields = '__all__'

    def create(self, validated_data):
        guardian_data = validated_data.pop('guardian', {})
        fee_data = validated_data.pop('payments', {})

        with transaction.atomic():
            guardian, created = Guardian.objects.get_or_create(
                cnic=guardian_data.get('cnic'),
                defaults={
                    'name': guardian_data.get('name'),
                    'phone_number': guardian_data.get('phone_number'),
                    'address': guardian_data.get('address')
                }
            )
            student = Student.objects.create(
                guardian=guardian, **validated_data
            )
            if fee_data:
                FeePayment.objects.create(student=student, **fee_data)
            return student


class CustomStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['payments'] = CreateFeePayment(
            instance.payments, many=True
        ).data
        return representation


class StudentListSerializer(serializers.ModelSerializer):
    guardian_name = serializers.CharField(
        source='guardian.name', read_only=True
    )
    guardian_phone = serializers.CharField(
        source='guardian.phone_number', read_only=True
    )
    latest_fee_status = serializers.SerializerMethodField()
    fees_amount = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id', 'name', 'age', 'grade', 'guardian_name',
            'guardian_phone', 'is_active', 'latest_fee_status',
            'fees_amount', 'student_image'
        ]

    def get_latest_fee_status(self, obj):
        latest_payment = obj.payments.order_by('-date_paid').first()
        return latest_payment.status if latest_payment else 'no_payment'

    def get_fees_amount(self, obj):
        latest_payments = obj.payments.order_by('-date_paid').first()
        return latest_payments.amount if latest_payments else 0


class FeePaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeePayment
        fields = [
            'id', 'amount', 'date_paid', 'month_paid_for',
            'status', 'screenshot'
        ]


class StudentAttendanceSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(
        source='student.id', read_only=True
    )
    student_name = serializers.CharField(
        source='student.name', read_only=True
    )
    student_image = serializers.ImageField(
        source='student.student_image', read_only=True
    )

    class Meta:
        model = StudentAttendance
        exclude = ['student']


class StudentDetailSerializer(serializers.ModelSerializer):
    guardian = GuardianDetailSerializer(read_only=True)
    guardian_name = serializers.CharField(
        source='guardian.name', read_only=True
    )
    guardian_cnic = serializers.CharField(
        source='guardian.cnic', read_only=True
    )
    guardian_phone = serializers.CharField(
        source='guardian.phone_number', read_only=True
    )
    address = serializers.CharField(
        source='guardian.address', read_only=True
    )
    last_message_send = serializers.DateTimeField(
        source='guardian.last_message_send', read_only=True
    )
    payments = FeePaymentSerializer(many=True, read_only=True)
    attendance = StudentAttendanceSerializer(many=True, read_only=True)
    latest_fee_status = serializers.SerializerMethodField()
    total_fees_paid = serializers.SerializerMethodField()
    total_fees_pending = serializers.SerializerMethodField()
    payment_count = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id', 'name', 'age', 'grade', 'is_active', 'date_joined',
            'guardian', 'guardian_name', 'guardian_cnic',
            'guardian_phone', 'address', 'student_image',
            'payments', 'attendance', 'latest_fee_status', 'last_message_send',
            'total_fees_paid', 'total_fees_pending', 'payment_count',
            'overall_attendance'
        ]

    def get_latest_fee_status(self, obj):
        latest_payment = obj.payments.order_by('-date_paid').first()
        return latest_payment.status if latest_payment else 'no_payment'

    def get_total_fees_paid(self, obj):
        paid_fees = obj.payments.filter(
            status='paid'
        ).aggregate(total=models.Sum('amount'))
        return paid_fees['total'] or 0

    def get_total_fees_pending(self, obj):
        pending_fees = obj.payments.filter(
            status='pending'
        ).aggregate(total=models.Sum('amount'))
        return pending_fees['total'] or 0

    def get_payment_count(self, obj):
        return obj.payments.count()


class FeePaymentSerializer(serializers.ModelSerializer):
    screenshot = serializers.ImageField(use_url=True, required=False)

    class Meta:
        model = FeePayment
        fields = '__all__'


class DashboardStatsSerializer(serializers.ModelSerializer):
    student_image = serializers.ImageField(use_url=True, required=False)
    fee_status = serializers.SerializerMethodField()
    guardian_name = serializers.CharField(
        source='guardian.name', read_only=True
    )

    class Meta:
        model = Student
        fields = [
            'id', 'name', 'grade', 'date_joined',
            "fee_status", "guardian_name", "student_image"
        ]

    def get_fee_status(self, obj):
        latest_payment = obj.payments.order_by('-date_paid').first()
        return latest_payment.status if latest_payment else 'no_payment'


class ReadExpenseSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(
        source='get_category_display', read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
    )

    class Meta:
        model = Expense
        fields = [
            'id', 'title', 'category', 'category_display',
            'status', 'status_display',
            'amount', 'expense_date', 'description',
            'created_at', 'updated_at'
        ]


class CreateExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'


class TestRecordInputSerializer(serializers.Serializer):
    test_date = serializers.DateField()
    test_name = serializers.CharField()
    subject = serializers.CharField()
    obtained_marks = serializers.FloatField()
    total_marks = serializers.FloatField()
    remarks = serializers.CharField(required=False, allow_blank=True)


class BulkTestRecordsSerializer(serializers.Serializer):
    records = TestRecordInputSerializer(many=True)


class ReadTestRecordsSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentTestRecords
        fields = '__all__'


class StudentAttendanceInputSerializer(serializers.Serializer):
    student_id = serializers.IntegerField(write_only=True)
    status = serializers.ChoiceField(choices=AttendanceStatus.choices)
    remarks = serializers.CharField(required=False, allow_blank=True)


class BulkStudentAttendanceInputSerializer(serializers.Serializer):
    date = serializers.DateField()
    records = StudentAttendanceInputSerializer(many=True)


# ─── Teacher Module Serializer

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name']


class SalaryPaymentSerializer(serializers.ModelSerializer):
    salary_slip = serializers.FileField(use_url=True, required=False)

    class Meta:
        model = SalaryPayment
        fields = ['id', 'amount', 'month', 'salary_slip', 'paid_on']


class CreateSalaryPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryPayment
        fields = ['amount', 'month', 'salary_slip']


class TeacherListSerializer(serializers.ModelSerializer):
    subjects = serializers.SerializerMethodField()
    latest_salary_status = serializers.SerializerMethodField()
    total_salary_paid = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = [
            'id', 'name', 'phone_number', 'salary',
            'date_joined', 'subjects',
            'latest_salary_status', 'total_salary_paid'
        ]

    def get_subjects(self, obj):
        ts = obj.teacher_subjects.select_related('subject').all()
        return [
            {'id': t.subject.id, 'name': t.subject.name}
            for t in ts if t.subject
        ]

    def get_latest_salary_status(self, obj):
        latest = obj.salary_payments.order_by('-paid_on').first()
        if not latest:
            return 'no_payment'
        from django.utils import timezone
        today = timezone.now().date()
        if latest.month and (
            latest.month.year == today.year and
            latest.month.month == today.month
        ):
            return 'paid'
        return 'pending'

    def get_total_salary_paid(self, obj):
        result = obj.salary_payments.aggregate(
            total=models.Sum('amount')
        )
        return result['total'] or 0


class TeacherDetailSerializer(serializers.ModelSerializer):
    subjects = serializers.SerializerMethodField()
    salary_payments = SalaryPaymentSerializer(many=True, read_only=True)
    total_salary_paid = serializers.SerializerMethodField()
    latest_salary_status = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = [
            'id', 'name', 'phone_number', 'salary', 'date_joined',
            'created_at', 'updated_at',
            'subjects', 'salary_payments',
            'total_salary_paid', 'latest_salary_status'
        ]

    def get_subjects(self, obj):
        ts = obj.teacher_subjects.select_related('subject').all()
        return [
            {'id': t.subject.id, 'name': t.subject.name}
            for t in ts if t.subject
        ]

    def get_total_salary_paid(self, obj):
        result = obj.salary_payments.aggregate(
            total=models.Sum('amount')
        )
        return result['total'] or 0

    def get_latest_salary_status(self, obj):
        latest = obj.salary_payments.order_by('-paid_on').first()
        if not latest:
            return 'no_payment'
        from django.utils import timezone
        today = timezone.now().date()
        if latest.month and (
            latest.month.year == today.year and
            latest.month.month == today.month
        ):
            return 'paid'
        return 'pending'


class CreateTeacherSerializer(serializers.ModelSerializer):
    subject_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Teacher
        fields = [
            'id', 'name', 'phone_number', 'salary', 'date_joined',
            'subject_ids'
        ]

    def create(self, validated_data):
        subject_ids = validated_data.pop('subject_ids', [])
        teacher = Teacher.objects.create(**validated_data)
        for sid in subject_ids:
            sub = Subject.objects.filter(id=sid).first()
            if sub:
                TeacherSubject.objects.create(teacher=teacher, subject=sub)
        return teacher

    def update(self, instance, validated_data):
        subject_ids = validated_data.pop('subject_ids', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if subject_ids is not None:
            instance.teacher_subjects.all().delete()
            for sid in subject_ids:
                sub = Subject.objects.filter(id=sid).first()
                if sub:
                    TeacherSubject.objects.create(
                        teacher=instance, subject=sub
                    )
        return instance
