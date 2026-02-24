from rest_framework import serializers
from .models import NotificationPreference, Notification
from students.models import Student, Teacher


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            'id',
            'priority',
            'retention_period',
            'is_active',
            'created_at',
            'updated_at'
        ]


class CreateNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


class StudentNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = [
            'id',
            'name',
        ]


class TeacherNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = [
            'id',
            'name',
        ]


class ReadNotificationSerializer(serializers.ModelSerializer):
    student = StudentNotificationSerializer(read_only=True)
    teacher = TeacherNotificationSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = '__all__'


class UpdateNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
