from django.db import transaction

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

    class Meta:
        model = Student
        fields = [
            'id', 'name', 'grade', 'guardian_name',
            'guardian_phone', 'is_active', 'latest_fee_status'
        ]

    def get_latest_fee_status(self, obj):
        latest_payment = obj.payments.order_by('-date_paid').first()
        return latest_payment.status if latest_payment else 'no_payment'
