from django.contrib import admin
from .models import NotificationPreference, Notification


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'priority',
        'retention_period',
        'is_active',
        'created_at',
        'updated_at'
    )
    list_filter = ('priority', 'is_active')
    readonly_fields = ('created_at', 'updated_at')
    search_fields = ('priority',)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'title',
        'notification_type',
        'student',
        'teacher',
        'priority',
        'is_read',
        'created_at'
    )
    list_filter = (
        'notification_type',
        'is_read',
        'priority',
        'is_active',
        'created_at'
    )
    search_fields = ('title', 'message')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'
    fieldsets = (
        ('Target Audience', {
            'fields': ('notification_type', 'student', 'teacher')
        }),
        ('Notification Content', {
            'fields': ('title', 'message', 'priority')
        }),
        ('Status', {
            'fields': (
                'is_read', 'read_at', 'expires_at', 'deleted_at', 'is_active'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
