from rest_framework import serializers
from .models import NotificationPreference


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
