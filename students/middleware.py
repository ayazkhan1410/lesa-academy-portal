import time

from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse


class Custom404MessageDisplayMiddleWare(MiddlewareMixin):
    def process_response(self, request, response):
        if response.status_code == 404:
            return JsonResponse({
                'error': 'Page Not Found',
                'reason': 'The requested URL does not exist.',
                'path': request.path,
            }, status=404)
        return response


class RequestLoggingMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.start_time = time.time()
        return None

    def process_response(self, request, response):
        if hasattr(request, 'start_time'):
            end_time = time.time()
            duration = end_time - request.start_time
            print(
                f"REQUEST: {request.method} "
                f"{request.path} took {duration:.4f}s"
            )
        return response
