import traceback

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination

from drf_spectacular.utils import extend_schema
from .models import NotificationPreference
from .serializers import NotificationPreferenceSerializer


class NotificationPreferencePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class NotificationPreferenceAPIView(APIView):
    @extend_schema(
        summary="List Notification Preferences",
        description="Retrieve all notification preferences for the system.",
        responses={200: NotificationPreferenceSerializer(many=True)},
        tags=['Notification System']
    )
    def get(self, request):
        try:
            preference = NotificationPreference.objects.all().values(
                'id',
                'priority',
                'retention_period',
                'is_active',
                'created_at',
                'updated_at'
            )

            # Pagination
            paginator = NotificationPreferencePagination()
            paginated_data = paginator.paginate_queryset(
                preference, request
            )

            serializer = NotificationPreferenceSerializer(
                paginated_data, many=True
            )
            response = paginator.get_paginated_response(serializer.data)
            return response
        except Exception as e:
            traceback.print_exc()
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        summary="Create Notification Preference",
        description="Create a new notification preference record.",
        request=NotificationPreferenceSerializer,
        responses={
            201: NotificationPreferenceSerializer,
            400: {"description": "Invalid data"},
            500: {"description": "Internal server error"}
        },
        tags=['Notification System']
    )
    def post(self, request):
        try:
            serializer = NotificationPreferenceSerializer(
                data=request.data
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response({
                'message': 'Notification preference created successfully',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            traceback.print_exc()
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class NotificationPreferenceDetailAPIView(APIView):
    @extend_schema(
        summary="Retrieve Notification Preference",
        description=(
            "Retrieve a specific notification preference record by ID."
        ),
        responses={
            200: NotificationPreferenceSerializer,
            404: {"description": "Notification preference not found"},
            500: {"description": "Internal server error"}
        },
        tags=['Notification System']
    )
    def get(self, request, pk):
        try:
            preference = NotificationPreference.objects.get(pk=pk)
            serializer = NotificationPreferenceSerializer(
                preference
            )
            return Response({
                'message': 'Notification preference retrieved successfully',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except NotificationPreference.DoesNotExist:
            return Response(
                {"error": "Notification preference not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            traceback.print_exc()
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        summary="Update Notification Preference",
        description="Update a specific notification preference record by ID.",
        request=NotificationPreferenceSerializer,
        responses={
            200: NotificationPreferenceSerializer,
            404: {"description": "Notification preference not found"},
            500: {"description": "Internal server error"}
        },
        tags=['Notification System']
    )
    def patch(self, request, pk):
        try:
            preference = NotificationPreference.objects.get(pk=pk)
            serializer = NotificationPreferenceSerializer(
                preference,
                data=request.data,
                partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response({
                'message': 'Notification preference updated successfully',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except NotificationPreference.DoesNotExist:
            return Response(
                {"error": "Notification preference not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            traceback.print_exc()
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        summary="Delete Notification Preference",
        description="Delete a specific notification preference record by ID.",
        responses={
            200: {
                "description": "Notification preference deleted successfully"
            },
            404: {"description": "Notification preference not found"},
            500: {"description": "Internal server error"}
        },
        tags=['Notification System']
    )
    def delete(self, request, pk):
        try:
            preference = NotificationPreference.objects.get(pk=pk)
            preference.delete()
            return Response({
                'message': 'Notification preference deleted successfully'
            }, status=status.HTTP_200_OK)
        except NotificationPreference.DoesNotExist:
            return Response(
                {"error": "Notification preference not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            traceback.print_exc()
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
