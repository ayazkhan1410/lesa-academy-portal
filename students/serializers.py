from django.db import transaction
from django.db import models

from rest_framework import serializers
from .models import Student, Guardian, FeePayment


class ReadStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'


class CreateGuardianSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guardian
        fields = ['name', 'cnic', 'phone_number', 'address']
        extra_kwargs = {
            'cnic': {'validators': []},
            'phone_number': {'validators': []}
        }


class CreateFeePayment(serializers.ModelSerializer):
    class Meta:
        model = FeePayment
        fields = ['amount', 'month_paid_for', 'screenshot', 'status']


class CreateStudentSerializer(serializers.ModelSerializer):
    guardian = CreateGuardianSerializer()
    payments = CreateFeePayment(write_only=True, required=False)

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
            'id', 'name', 'grade', 'guardian_name',
            'guardian_phone', 'is_active', 'latest_fee_status',
            'fees_amount'
        ]

    def get_latest_fee_status(self, obj):
        latest_payment = obj.payments.order_by('-date_paid').first()
        return latest_payment.status if latest_payment else 'no_payment'

    def get_fees_amount(self, obj):
        latest_payments = obj.payments.order_by('-date_paid').first()
        return latest_payments.amount if latest_payments else 0


class GuardianDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed guardian information"""
    class Meta:
        model = Guardian
        fields = ['id', 'name', 'cnic', 'phone_number', 'address']


class FeePaymentSerializer(serializers.ModelSerializer):
    """Serializer for fee payment details"""
    class Meta:
        model = FeePayment
        fields = [
            'id', 'amount', 'date_paid', 'month_paid_for',
            'status', 'screenshot'
        ]


class StudentDetailSerializer(serializers.ModelSerializer):
    """
    Comprehensive serializer for student detail view.
    Includes all student info, guardian details, and fee payments.
    """
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
    payments = FeePaymentSerializer(many=True, read_only=True)
    latest_fee_status = serializers.SerializerMethodField()
    total_fees_paid = serializers.SerializerMethodField()
    total_fees_pending = serializers.SerializerMethodField()
    payment_count = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id', 'name', 'age', 'grade', 'is_active', 'date_joined',
            'guardian', 'guardian_name', 'guardian_cnic',
            'guardian_phone', 'address',
            'payments', 'latest_fee_status',
            'total_fees_paid', 'total_fees_pending', 'payment_count'
        ]

    def get_latest_fee_status(self, obj):
        """Get the status of the most recent payment"""
        latest_payment = obj.payments.order_by('-date_paid').first()
        return latest_payment.status if latest_payment else 'no_payment'

    def get_total_fees_paid(self, obj):
        """Calculate total amount of paid fees"""
        paid_fees = obj.payments.filter(
            status='paid'
        ).aggregate(total=models.Sum('amount'))
        return paid_fees['total'] or 0

    def get_total_fees_pending(self, obj):
        """Calculate total amount of pending fees"""
        pending_fees = obj.payments.filter(
            status='pending'
        ).aggregate(total=models.Sum('amount'))
        return pending_fees['total'] or 0

    def get_payment_count(self, obj):
        """Get total number of payments"""
        return obj.payments.count()


class FeePaymentSerializer(serializers.ModelSerializer):
    screenshot = serializers.ImageField(use_url=True, required=False)

    class Meta:
        model = FeePayment
        fields = '__all__'


class DashboardStatsSerializer(serializers.ModelSerializer):
    fee_status = serializers.SerializerMethodField()
    guardian_name = serializers.CharField(
        source='guardian.name', read_only=True
    )

    class Meta:
        model = Student
        fields = [
            'id', 'name', 'grade', 'date_joined', "fee_status", "guardian_name"
        ]

    def get_fee_status(self, obj):
        latest_payment = obj.payments.order_by('-date_paid').first()
        return latest_payment.status if latest_payment else 'no_payment'
