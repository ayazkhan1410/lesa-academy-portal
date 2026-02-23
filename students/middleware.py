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
