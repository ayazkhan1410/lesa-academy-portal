import os
import traceback
import requests

from django.utils import timezone
from celery import shared_task

from .models import Guardian


@shared_task(bind=True, max_retries=3)
def send_message(self, phone_number, message, guardian_id):
    try:
        url = os.getenv('MOBILE_GATEWAY_URL')
        payload = {
            "phone": phone_number,
            "message": message
        }
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()

        # update last message send time
        send_time = timezone.now()
        Guardian.objects.filter(id=guardian_id).update(
            last_message_send=send_time
        )

        return {
            'status': 'success',
            'message': 'SMS sent successfully',
            'data': {
                'guardian_id': guardian_id,
                'phone_number': phone_number,
                'message': message,
                'sent_at': send_time
            }
        }
    except Exception as e:
        traceback.print_exc()
        if self.request.retries >= self.max_retries:
            print("FINAL FAILURE FOR GUARDIAN ===", guardian_id)
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))
