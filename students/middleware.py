from django.utils.deprecation import MiddlewareMixin
from django.urls import resolve, Resolver404
from django.http import JsonResponse


class Custom404MessageDisplayMiddleWare(MiddlewareMixin):
    def process_request(self, request):
        try:
            resolve(request.path_info)
        except Resolver404:
            return JsonResponse({
                'error': 'Page Not Found',
                'reason': 'The requested URL does not exist.',
                'path': request.path,
            }, status=404)

        return None
