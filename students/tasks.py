import os
import requests
import traceback

from celery import shared_task


@shared_task(bind=True, max_retries=3)
def send_message(self, phone_number, message):
    try:
        url = os.getenv('MOBILE_GATEWAY_URL')
        payload = {
            "phone": phone_number,
            "message": message
        }
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        return {
            'status': 'success',
            'message': 'SMS sent successfully'
        }
    except Exception as e:
        traceback.print_exc()
        print('ERROR WHILE SENDING MESSAGE ===', str(e))
        raise self.retry(exc=e, countdown=60)
