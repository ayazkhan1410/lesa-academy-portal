import traceback
import base64
import uuid

from django.db import transaction
from django.db import models
from django.core.files.base import ContentFile
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import (
    Sum, Q, Case, When, IntegerField, Subquery, OuterRef, Avg, F, Window
)
from django.db.models.functions import DenseRank

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils.dateparse import parse_date
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from drf_spectacular.utils import (
    extend_schema, OpenApiParameter,
    OpenApiResponse, OpenApiExample
)
from drf_spectacular.types import OpenApiTypes


from .models import (
    CustomUser, Student,
    Guardian, FeePayment, Expense, StudentTestRecords
)

from .manager import get_tokens_for_user
from .tasks import send_message

from .serializers import (
    CreateStudentSerializer,
    CustomStudentSerializer, StudentListSerializer,
    CreateGuardianSerializer, StudentDetailSerializer,
    FeePaymentSerializer, DashboardStatsSerializer,
    GuardianDetailSerializer, ReadExpenseSerializer,
    CreateExpenseSerializer, BulkTestRecordsSerializer,
    ReadTestRecordsSerializer
)


class StudentPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class SecureLoginAPIView(APIView):
    @extend_schema(
        summary="User Login",
        description=(
            "Authenticate a user with email and password. "
            "Returns JWT access and refresh tokens upon successful login."
        ),
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'email': {
                        'type': 'string',
                        'format': 'email',
                        'description': 'User email address'
                    },
                    'password': {
                        'type': 'string',
                        'format': 'password',
                        'description': 'User password'
                    }
                },
                'required': ['email', 'password'],
                'example': {
                    'email': 'user@example.com',
                    'password': 'yourpassword'
                }
            }
        },
        responses={
            200: {
                'description': 'Login successful',
                'content': {
                    'application/json': {
                        'example': {
                            'refresh': 'eyJ0eXAiOiJKV1QiLCJhbGc...',
                            'access': 'eyJ0eXAiOiJKV1QiLCJhbGc...',
                            'email': 'user@example.com',
                            'username': 'johndoe'
                        }
                    }
                }
            },
            401: {
                'description': 'Invalid password',
                'content': {
                    'application/json': {
                        'example': {'error': 'Invalid password'}
                    }
                }
            },
            404: {
                'description': 'User not found',
                'content': {
                    'application/json': {
                        'example': {'error': 'User not found'}
                    }
                }
            },
            500: {
                'description': 'Internal server error',
                'content': {
                    'application/json': {
                        'example': {'error': 'Internal server error'}
                    }
                }
            }
        },
        tags=['Authentication']
    )
    def post(self, request):
        try:
            email = request.data.get('email')
            password = request.data.get('password')

            user = CustomUser.objects.filter(email=email).first()
            if not user:
                return Response(
                    {'error': 'User not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            if not user.check_password(password):
                return Response(
                    {'error': 'Invalid password'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            token = get_tokens_for_user(user)
            return Response(token)
        except Exception as e:
            print(traceback.format_exc())
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ListCreateStudentAPIView(APIView):
    parser_classes = (JSONParser,)

    @extend_schema(
        summary="List Students",
        description=(
            "Get paginated list of students with filtering, searching, "
            "and sorting. Returns 10 students per page by default."
        ),
        parameters=[
            OpenApiParameter(
                name='page',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Page number'
            ),
            OpenApiParameter(
                name='search',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description=(
                    'Search by student name, guardian name, '
                    'or guardian phone number (partial match)'
                )
            ),
            OpenApiParameter(
                name='grade',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filter by grade (e.g., 9, 10, 11, 12)'
            ),
            OpenApiParameter(
                name='is_active',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description='Filter by active status (true/false)'
            ),
            OpenApiParameter(
                name='ordering',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description=(
                    'Sort by field. Options: name, grade, date_joined. '
                    'Prefix with - for descending (e.g., -name)'
                )
            ),
        ],
        responses={
            200: {
                'description': 'Paginated student list',
                'content': {
                    'application/json': {
                        'example': {
                            'count': 450,
                            'next': 'http://example.com/api/students/?page=2',
                            'previous': None,
                            'results': [
                                {
                                    'id': 101,
                                    'name': 'Ayaz Khan',
                                    'grade': '12',
                                    'guardian_name': 'Kamran Khan',
                                    'guardian_phone': '0300-1234567',
                                    'is_active': True,
                                    'latest_fee_status': 'paid'
                                }
                            ]
                        }
                    }
                }
            }
        },
        tags=['Students']
    )
    def get(self, request):
        try:
            # Get the latest payment status using Subquery
            latest_payment_status = FeePayment.objects.filter(
                student=OuterRef('pk')
            ).order_by('-date_paid').values('status')[:1]

            queryset = Student.objects.select_related(
                'guardian'
            ).prefetch_related('payments').annotate(
                latest_status=Subquery(latest_payment_status)
            )

            # Filtering
            grade = request.query_params.get('grade')
            is_active = request.query_params.get('is_active')

            if grade:
                queryset = queryset.filter(grade=grade)

            if is_active is not None:
                is_active_bool = is_active.lower() == 'true'
                queryset = queryset.filter(is_active=is_active_bool)

            # Search
            search = request.query_params.get('search')
            if search:
                queryset = queryset.filter(
                    Q(name__icontains=search) |
                    Q(guardian__name__icontains=search) |
                    Q(guardian__phone_number__icontains=search) |
                    Q(guardian__cnic__icontains=search)
                )

            # Sorting - only apply custom ordering if explicitly requested
            ordering = request.query_params.get('ordering')
            if ordering:
                allowed_orderings = [
                    'name', '-name', 'grade', '-grade',
                    'date_joined', '-date_joined'
                ]
                if ordering in allowed_orderings:
                    queryset = queryset.order_by(ordering)
            else:
                queryset = queryset.annotate(
                    pending_priority=Case(
                        When(latest_status='pending', then=0),
                        When(latest_status='paid', then=1),
                        default=2,
                        output_field=IntegerField(),
                    )
                ).order_by('pending_priority', '-id')

            # Pagination
            paginator = StudentPagination()
            paginated_students = paginator.paginate_queryset(
                queryset, request
            )

            serializer = StudentListSerializer(paginated_students, many=True)
            summary = {
                'total_students': queryset.count(),
                'active_students': queryset.filter(is_active=True).count(),
                'total_pending_fees': FeePayment.objects.filter(
                    student__in=queryset,
                    status='pending'
                ).aggregate(total=Sum('amount'))['total'] or 0,
                'pending_fee_count': FeePayment.objects.filter(
                    student__in=queryset,
                    status='pending'
                ).count(),
                'total_fees_paid': FeePayment.objects.filter(
                    student__in=queryset,
                    status='paid'
                ).aggregate(total=Sum('amount'))['total'] or 0,
                'paid_fee_count': FeePayment.objects.filter(
                    student__in=queryset,
                    status='paid'
                ).count(),
            }
            response = paginator.get_paginated_response(serializer.data)
            response.data['summary'] = summary
            return response

        except Exception as e:
            traceback.print_exc()
            print("ERROR WHILE GETTING STUDENTS ====", str(e))
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        summary="Create Student",
        description=(
            "Create a new student with guardian information and "
            "optional initial fee payment. "
            "This endpoint creates the student, guardian, and fee payment "
            "in a single transaction."
        ),
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'name': {
                        'type': 'string',
                        'description': 'Student full name'
                    },
                    'age': {
                        'type': 'integer',
                        'description': 'Student age'
                    },
                    'grade': {
                        'type': 'string',
                        'description': 'Student grade/class',
                        'enum': [
                            'Nursery', 'Prep', '1', '2', '3', '4',
                            '5', '6', '7', '8', '9', '10', '11', '12'
                        ]
                    },
                    'date_joined': {
                        'type': 'string',
                        'format': 'date',
                        'description': 'Date student joined (YYYY-MM-DD)'
                    },
                    'guardian': {
                        'type': 'object',
                        'properties': {
                            'name': {
                                'type': 'string',
                                'description': 'Guardian full name'
                            },
                            'cnic': {
                                'type': 'string',
                                'description': 'Guardian CNIC number'
                            },
                            'phone_number': {
                                'type': 'string',
                                'description': 'Guardian phone number'
                            },
                            'address': {
                                'type': 'string',
                                'description': 'Guardian address'
                            }
                        },
                        'required': ['cnic', 'phone_number']
                    },
                    'initial_fee': {
                        'type': 'object',
                        'properties': {
                            'amount': {
                                'type': 'number',
                                'description': 'Fee amount'
                            },
                            'month_paid_for': {
                                'type': 'string',
                                'format': 'date',
                                'description': 'Month fee is for (YYYY-MM-DD)'
                            },
                            'status': {
                                'type': 'string',
                                'enum': ['pending', 'paid', 'late'],
                                'description': 'Payment status'
                            }
                        }
                    }
                },
                'required': ['guardian'],
                'example': {
                    'name': 'Ali Khan',
                    'age': 15,
                    'grade': '10',
                    'date_joined': '2024-01-15',
                    'guardian': {
                        'name': 'Ahmed Khan',
                        'cnic': '12345-1234567-1',
                        'phone_number': '0300-1234567',
                        'address': '123 Main Street, Karachi'
                    },
                    'initial_fee': {
                        'amount': 5000.00,
                        'month_paid_for': '2024-01-01',
                        'status': 'paid'
                    }
                }
            }
        },
        responses={
            200: {
                'description': 'Student created successfully',
                'content': {
                    'application/json': {
                        'example': {
                            'message': 'Student created successfully',
                            'data': {
                                'id': 1,
                                'name': 'Ali Khan',
                                'age': 15,
                                'grade': '10',
                                'date_joined': '2024-01-15',
                                'is_active': True,
                                'guardian': {
                                    'name': 'Ahmed Khan',
                                    'cnic': '12345-1234567-1',
                                    'phone_number': '0300-1234567',
                                    'address': '123 Main Street, Karachi'
                                }
                            }
                        }
                    }
                }
            },
            400: {
                'description': 'Invalid data',
                'content': {
                    'application/json': {
                        'example': {
                            'message': 'Invalid data',
                            'errors': {
                                'guardian': {
                                    'cnic': ['This field is required.']
                                }
                            }
                        }
                    }
                }
            },
            500: {
                'description': 'Internal server error',
                'content': {
                    'application/json': {
                        'example': {'error': 'Internal server error'}
                    }
                }
            }
        },
        tags=['Students']
    )
    def post(self, request):
        try:
            serializer = CreateStudentSerializer(data=request.data)
            if serializer.is_valid():
                custom_response = serializer.save()
                return Response({
                    "message": "Student created successfully",
                    "data": CustomStudentSerializer(custom_response).data
                })
            return Response({
                "message": "Invalid data",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            traceback.print_exc()
            print("ERROR WHILE CREATING STUDENT ==", str(e))
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


def decode_base64_image(data):
    if not isinstance(data, str):
        return data

    if data.startswith('data:image'):
        try:
            format, imgstr = data.split(';base64,')
            ext = format.split('/')[-1]
            return ContentFile(
                base64.b64decode(imgstr),
                name=f"student_{uuid.uuid4()}.{ext}"
            )
        except Exception:
            return None

    if len(data) > 255:
        return None

    return data


class BulkEnrollStudentAPIView(APIView):
    parser_classes = (JSONParser,)

    @extend_schema(
        summary="Bulk Enroll Students",
        description=(
            "Enroll multiple students (siblings) under the same guardian "
            "in a single transaction. If the guardian already exists "
            "(matched by CNIC), the existing guardian will be used."
        ),
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'guardian': {
                        'type': 'object',
                        'properties': {
                            'name': {
                                'type': 'string',
                                'description': 'Guardian full name'
                            },
                            'cnic': {
                                'type': 'string',
                                'description': (
                                    'Guardian CNIC (unique identifier)'
                                )
                            },
                            'phone_number': {
                                'type': 'string',
                                'description': 'Guardian phone number'
                            },
                            'address': {
                                'type': 'string',
                                'description': 'Guardian address'
                            }
                        },
                        'required': ['cnic', 'phone_number']
                    },
                    'students': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'name': {
                                    'type': 'string',
                                    'description': 'Student full name'
                                },
                                'age': {
                                    'type': 'integer',
                                    'description': 'Student age'
                                },
                                'grade': {
                                    'type': 'string',
                                    'description': 'Student grade/class'
                                },
                                'date_joined': {
                                    'type': 'string',
                                    'format': 'date',
                                    'description': 'Date joined (YYYY-MM-DD)'
                                },
                                'initial_fee': {
                                    'type': 'object',
                                    'properties': {
                                        'amount': {
                                            'type': 'number',
                                            'description': 'Fee amount'
                                        },
                                        'month_paid_for': {
                                            'type': 'string',
                                            'format': 'date',
                                            'description': 'Month (YYYY-MM-DD)'
                                        },
                                        'status': {
                                            'type': 'string',
                                            'enum': ['pending', 'paid', 'late']
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                'required': ['guardian', 'students'],
                'example': {
                    'guardian': {
                        'name': 'Ahmed Khan',
                        'cnic': '31202-1234567-1',
                        'phone_number': '0300-1234567',
                        'address': 'Model Town, Bahawalpur'
                    },
                    'students': [
                        {
                            'name': 'Ali Khan',
                            'age': 15,
                            'grade': '10',
                            'date_joined': '2024-01-15',
                            'initial_fee': {
                                'amount': 5000.00,
                                'month_paid_for': '2024-01-01',
                                'status': 'paid'
                            }
                        },
                        {
                            'name': 'Sara Khan',
                            'age': 13,
                            'grade': '8',
                            'date_joined': '2024-01-15',
                            'initial_fee': {
                                'amount': 5000.00,
                                'month_paid_for': '2024-01-01',
                                'status': 'paid'
                            }
                        }
                    ]
                }
            }
        },
        responses={
            200: {
                'description': 'Students enrolled successfully',
                'content': {
                    'application/json': {
                        'example': {
                            'status': 'success',
                            'total_enrolled': 2,
                            'students': [
                                {'id': 1, 'name': 'Ali Khan'},
                                {'id': 2, 'name': 'Sara Khan'}
                            ]
                        }
                    }
                }
            },
            400: {
                'description': 'Invalid data',
                'content': {
                    'application/json': {
                        'example': {
                            'error': 'Guardian data is required'
                        }
                    }
                }
            },
            500: {
                'description': 'Internal server error',
                'content': {
                    'application/json': {
                        'example': {'error': 'Internal server error'}
                    }
                }
            }
        },
        tags=['Students']
    )
    def post(self, request):
        data = request.data
        guardian_data = data.get('guardian')
        students_list = data.get('students')

        with transaction.atomic():
            guardian, created = Guardian.objects.get_or_create(
                cnic=guardian_data['cnic'],
                defaults=guardian_data
            )

            if not created:
                guardian.phone_number = guardian_data.get(
                    'phone_number', guardian.phone_number
                )
                guardian.address = guardian_data.get(
                    'address', guardian.address
                )
                guardian.save()

            created_students = []
            for student_data in students_list:
                fee_data = student_data.pop('initial_fee', None)
                image_data = student_data.pop('student_image', None)

                # Fix for age field error if it's passed as empty string
                if student_data.get('age') == "":
                    student_data['age'] = None

                if image_data:
                    student_data['student_image'] = decode_base64_image(
                        image_data
                    )

                student = Student.objects.create(
                    guardian=guardian, **student_data
                )
                if fee_data:
                    FeePayment.objects.create(student=student, **fee_data)

                created_students.append({
                    "id": student.id,
                    "name": student.name
                })

        return Response({
            "status": "success",
            "total_enrolled": len(created_students),
            "students": created_students
        })


class StudentDetailAPIView(APIView):
    @extend_schema(
        summary="Retrieve Student Details",
        description="Get detailed information about a specific student by ID.",
        responses={
            200: {
                'description': 'Student details retrieved successfully',
                'content': {
                    'application/json': {
                        'example': {
                            'id': 7,
                            'name': 'Ayaz Khan',
                            'age': 19,
                            'grade': '12',
                            'guardian_name': 'Kamran Khan',
                            'guardian_phone': '0300-1234567',
                            'is_active': True,
                            'date_joined': '2024-01-15',
                            'latest_fee_status': 'paid'
                        }
                    }
                }
            },
            404: {
                'description': 'Student not found',
                'content': {
                    'application/json': {
                        'example': {'error': 'Student not found'}
                    }
                }
            }
        },
        tags=['Students']
    )
    def get(self, request, student_id):
        try:
            student = Student.objects.select_related(
                'guardian'
            ).prefetch_related('payments').get(id=student_id)
            serializer = StudentDetailSerializer(student)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        summary="Partial Update Student",
        description=(
            "Update specific fields of a student record. "
            "You can update student details like grade, active status, etc."
        ),
        request={
            'application/json': {
                'example': {
                    'grade': '12',
                    'is_active': False
                }
            }
        },
        responses={
            200: {
                'description': 'Student updated successfully',
                'content': {
                    'application/json': {
                        'example': {
                            'message': 'Student updated successfully',
                            'student': {
                                'id': 7,
                                'name': 'Ayaz Khan',
                                'grade': '12',
                                'is_active': False
                            }
                        }
                    }
                }
            },
            404: {
                'description': 'Student not found',
                'content': {
                    'application/json': {
                        'example': {'error': 'Student not found'}
                    }
                }
            },
            400: {
                'description': 'Invalid data',
                'content': {
                    'application/json': {
                        'example': {'error': 'Invalid grade value'}
                    }
                }
            }
        },
        tags=['Students']
    )
    def patch(self, request, student_id):
        try:
            student = Student.objects.get(id=student_id)

            allowed_fields = [
                'name', 'age', 'grade', 'is_active',
                'date_joined', 'student_image'
            ]
            for field in allowed_fields:
                if field in request.data:
                    value = request.data[field]

                    # Fix for the Age integer field error
                    if field == 'age' and value == "":
                        value = None

                    # Fix for student_image truncation and URL issues
                    if field == 'student_image':
                        is_b64 = (
                            value and isinstance(value, str) and
                            value.startswith('data:image')
                        )
                        if is_b64:
                            value = decode_base64_image(value)
                        elif value and isinstance(value, str) and \
                                value.startswith('http'):
                            # It's an existing URL, don't update the field
                            continue
                        elif not value:
                            value = None

                    setattr(student, field, value)

            student.save()

            serializer = StudentListSerializer(student)
            return Response({
                'message': 'Student updated successfully',
                'student': serializer.data
            }, status=status.HTTP_200_OK)

        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        summary="Delete Student",
        description=(
            "Delete a student record permanently. "
            "⚠️ WARNING: This will also delete all associated fee payment "
            "records due to CASCADE delete."
        ),
        responses={
            200: {
                'description': 'Student deleted successfully',
                'content': {
                    'application/json': {
                        'example': {
                            'message': 'Student deleted successfully',
                            'deleted_student_id': 7
                        }
                    }
                }
            },
            404: {
                'description': 'Student not found',
                'content': {
                    'application/json': {
                        'example': {'error': 'Student not found'}
                    }
                }
            }
        },
        tags=['Students']
    )
    def delete(self, request, student_id):
        try:
            student = Student.objects.get(id=student_id)
            student_name = student.name
            student.delete()

            return Response({
                'message': 'Student deleted successfully',
                'deleted_student_id': student_id,
                'deleted_student_name': student_name
            }, status=status.HTTP_200_OK)

        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ListGuardianAPIView(APIView):
    @extend_schema(
        summary="List Guardians",
        description=(
            "Get paginated list of guardians with search and sorting. "
            "Returns 10 guardians per page by default. "
            "Search by CNIC or name."
        ),
        parameters=[
            OpenApiParameter(
                name='page',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Page number'
            ),
            OpenApiParameter(
                name='search',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Search by CNIC or name (partial match)'
            ),
            OpenApiParameter(
                name='ordering',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description=(
                    'Sort by field. Options: name, cnic, created_at. '
                    'Prefix with - for descending (e.g., -name)'
                )
            ),
        ],
        responses={
            200: {
                'description': 'Paginated guardian list',
                'content': {
                    'application/json': {
                        'example': {
                            'count': 50,
                            'next': 'http://example.com/api/guardian/?page=2',
                            'previous': None,
                            'results': [
                                {
                                    'name': 'Ahmed Khan',
                                    'cnic': '31202-1234567-1',
                                    'phone_number': '0300-1234567',
                                    'address': 'Model Town, Bahawalpur'
                                }
                            ]
                        }
                    }
                }
            }
        },
        tags=['Guardians']
    )
    def get(self, request):
        try:
            # Base queryset
            queryset = Guardian.objects.all()

            # Search by CNIC or name
            search = request.query_params.get('search')
            if search:
                from django.db.models import Q
                queryset = queryset.filter(
                    Q(cnic__icontains=search) | Q(name__icontains=search)
                )

            # Sorting
            ordering = request.query_params.get('ordering', '-created_at')
            allowed_orderings = [
                'name', '-name', 'cnic', '-cnic',
                'created_at', '-created_at'
            ]
            if ordering in allowed_orderings:
                queryset = queryset.order_by(ordering)

            # Pagination
            paginator = StudentPagination()
            paginated_guardians = paginator.paginate_queryset(
                queryset, request
            )

            serializer = CreateGuardianSerializer(
                paginated_guardians, many=True
            )
            return paginator.get_paginated_response(serializer.data)

        except Exception as e:
            traceback.print_exc()
            print("ERROR WHILE FETCHING GUARDIANS ==", str(e))
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        summary="Create Guardian",
        description=(
            "Create a new guardian. CNIC and phone_number must be unique."
        ),
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'name': {
                        'type': 'string',
                        'description': 'Guardian full name'
                    },
                    'cnic': {
                        'type': 'string',
                        'description': 'Guardian CNIC (must be unique)'
                    },
                    'phone_number': {
                        'type': 'string',
                        'description': 'Guardian phone number (must be unique)'
                    },
                    'address': {
                        'type': 'string',
                        'description': 'Guardian address'
                    }
                },
                'required': ['name', 'cnic', 'phone_number'],
                'example': {
                    'name': 'Ahmed Khan',
                    'cnic': '31202-1234567-1',
                    'phone_number': '0300-1234567',
                    'address': 'Model Town, Bahawalpur'
                }
            }
        },
        responses={
            201: {
                'description': 'Guardian created successfully',
                'content': {
                    'application/json': {
                        'example': {
                            'message': 'Guardian created successfully',
                            'data': {
                                'name': 'Ahmed Khan',
                                'cnic': '31202-1234567-1',
                                'phone_number': '0300-1234567',
                                'address': 'Model Town, Bahawalpur'
                            }
                        }
                    }
                }
            },
            400: {
                'description': 'Invalid data or duplicate CNIC/phone',
                'content': {
                    'application/json': {
                        'example': {
                            'message': 'Invalid data',
                            'errors': {
                                'cnic': [
                                    'guardian with this cnic already exists.'
                                ]
                            }
                        }
                    }
                }
            },
            500: {
                'description': 'Internal server error',
                'content': {
                    'application/json': {
                        'example': {'error': 'Internal server error'}
                    }
                }
            }
        },
        tags=['Guardians']
    )
    def post(self, request):
        try:
            serializer = CreateGuardianSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "message": "Guardian created successfully",
                    "data": serializer.data
                }, status=status.HTTP_201_CREATED)
            return Response({
                "message": "Invalid data",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            traceback.print_exc()
            print("ERROR WHILE CREATING GUARDIAN ==", str(e))
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GuardianDetailAPIView(APIView):
    @extend_schema(
        summary="Retrieve Guardian",
        description="Get details of a specific guardian by ID.",
        responses={
            200: {
                'description': 'Guardian details',
                'content': {
                    'application/json': {
                        'example': {
                            'name': 'Ahmed Khan',
                            'cnic': '31202-1234567-1',
                            'phone_number': '0300-1234567',
                            'address': 'Model Town, Bahawalpur'
                        }
                    }
                }
            },
            404: {
                'description': 'Guardian not found',
                'content': {
                    'application/json': {
                        'example': {'error': 'Guardian not found'}
                    }
                }
            }
        },
        tags=['Guardians']
    )
    def get(self, request, pk):
        try:
            guardian = Guardian.objects.get(pk=pk)
            serializer = GuardianDetailSerializer(guardian)
            return Response(serializer.data)
        except Guardian.DoesNotExist:
            return Response(
                {'error': 'Guardian not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        summary="Update Guardian (Full)",
        description=(
            "Fully update a guardian. All fields must be provided."
        ),
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'name': {'type': 'string'},
                    'cnic': {'type': 'string'},
                    'phone_number': {'type': 'string'},
                    'address': {'type': 'string'}
                },
                'required': ['name', 'cnic', 'phone_number'],
                'example': {
                    'name': 'Ahmed Khan Updated',
                    'cnic': '31202-1234567-1',
                    'phone_number': '0300-1234567',
                    'address': 'New Address, Bahawalpur'
                }
            }
        },
        responses={
            200: {
                'description': 'Guardian updated successfully',
                'content': {
                    'application/json': {
                        'example': {
                            'message': 'Guardian updated successfully',
                            'data': {
                                'name': 'Ahmed Khan Updated',
                                'cnic': '31202-1234567-1',
                                'phone_number': '0300-1234567',
                                'address': 'New Address, Bahawalpur'
                            }
                        }
                    }
                }
            },
            404: {'description': 'Guardian not found'},
            400: {'description': 'Invalid data'}
        },
        tags=['Guardians']
    )
    def put(self, request, pk):
        try:
            guardian = Guardian.objects.get(pk=pk)
            serializer = CreateGuardianSerializer(
                guardian, data=request.data
            )
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "message": "Guardian updated successfully",
                    "data": serializer.data
                })
            return Response({
                "message": "Invalid data",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except Guardian.DoesNotExist:
            return Response(
                {'error': 'Guardian not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        summary="Update Guardian (Partial)",
        description=(
            "Partially update a guardian. "
            "Only provided fields will be updated."
        ),
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'name': {'type': 'string'},
                    'cnic': {'type': 'string'},
                    'phone_number': {'type': 'string'},
                    'address': {'type': 'string'}
                },
                'example': {
                    'phone_number': '0321-9999999'
                }
            }
        },
        responses={
            200: {
                'description': 'Guardian updated successfully',
                'content': {
                    'application/json': {
                        'example': {
                            'message': 'Guardian updated successfully',
                            'data': {
                                'name': 'Ahmed Khan',
                                'cnic': '31202-1234567-1',
                                'phone_number': '0321-9999999',
                                'address': 'Model Town, Bahawalpur'
                            }
                        }
                    }
                }
            },
            404: {'description': 'Guardian not found'},
            400: {'description': 'Invalid data'}
        },
        tags=['Guardians']
    )
    def patch(self, request, pk):
        try:
            guardian = Guardian.objects.get(pk=pk)
            serializer = CreateGuardianSerializer(
                guardian, data=request.data, partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "message": "Guardian updated successfully",
                    "data": serializer.data
                })
            return Response({
                "message": "Invalid data",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except Guardian.DoesNotExist:
            return Response(
                {'error': 'Guardian not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        summary="Delete Guardian",
        description=(
            "Delete a guardian. WARNING: This will also delete "
            "all associated students due to CASCADE."
        ),
        responses={
            200: {
                'description': 'Guardian deleted successfully',
                'content': {
                    'application/json': {
                        'example': {
                            'message': 'Guardian deleted successfully'
                        }
                    }
                }
            },
            404: {'description': 'Guardian not found'}
        },
        tags=['Guardians']
    )
    def delete(self, request, pk):
        try:
            guardian = Guardian.objects.get(pk=pk)
            guardian.delete()
            return Response({
                "message": "Guardian deleted successfully"
            })
        except Guardian.DoesNotExist:
            return Response(
                {'error': 'Guardian not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ListCreatePaymentAPIView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    @extend_schema(
        summary="Create or Update Payment Record",
        description="""
        Create a new fee payment record or update an existing one
        for a student.

        **Logic:**
        - If a payment record exists for the given month, it will be updated
        - If no record exists for that month, a new one will be created
        - The student's latest_fee_status will be automatically synced

        **Required Fields:**
        - student: Student ID
        - amount: Payment amount in rupees
        - month_paid_for: Date in YYYY-MM-DD format
          (e.g., 2026-02-01)
        - status: Payment status (paid/pending/late)

        **Optional Fields:**
        - screenshot: Payment proof image (JPG/PNG)
        """,
        request=FeePaymentSerializer,
        responses={
            200: {
                'description': 'Payment updated successfully',
                'content': {
                    'application/json': {
                        'example': {
                            'message': (
                                'Payment updated successfully for '
                                'February 2026'
                            ),
                            'data': {
                                'id': 1,
                                'student': 5,
                                'amount': 5000,
                                'date_paid': '2026-02-17',
                                'month_paid_for': '2026-02-01',
                                'status': 'paid',
                                'screenshot': '/media/payments/receipt.jpg'
                            }
                        }
                    }
                }
            },
            201: {
                'description': 'Payment created successfully',
                'content': {
                    'application/json': {
                        'example': {
                            'message': (
                                'Payment created successfully for '
                                'February 2026'
                            ),
                            'data': {
                                'id': 2,
                                'student': 5,
                                'amount': 5000,
                                'date_paid': '2026-02-17',
                                'month_paid_for': '2026-02-01',
                                'status': 'paid'
                            }
                        }
                    }
                }
            },
            400: {
                'description': 'Invalid data',
                'content': {
                    'application/json': {
                        'example': {
                            'error': (
                                'Student ID and Month (YYYY-MM-DD) '
                                'are required.'
                            )
                        }
                    }
                }
            },
            404: {
                'description': 'Student not found',
                'content': {
                    'application/json': {
                        'example': {'error': 'Student not found'}
                    }
                }
            }
        },
        tags=['Payments']
    )
    def post(self, request, *args, **kwargs):
        data = request.data
        student_id = data.get('student')
        date_str = data.get('month_paid_for')

        if not student_id or not date_str:
            return Response(
                {"error": "Student ID and Month (YYYY-MM-DD) are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            payment_date = parse_date(date_str)
            if not payment_date:
                raise ValueError
        except ValueError:
            return Response({
                "error": "Invalid date format"
            }, status=status.HTTP_400_BAD_REQUEST)

        existing_payment = FeePayment.objects.filter(
            student_id=student_id,
            month_paid_for__year=payment_date.year,
            month_paid_for__month=payment_date.month
        ).first()

        if existing_payment:
            serializer = FeePaymentSerializer(
                existing_payment, data=data, partial=True
            )
            action = "updated"
            http_status = status.HTTP_200_OK
        else:
            serializer = FeePaymentSerializer(data=data)
            action = "created"
            http_status = status.HTTP_201_CREATED

        if serializer.is_valid():
            serializer.save()
            try:
                Student.objects.get(id=student_id)
            except Student.DoesNotExist:
                return Response({
                    "error": "Student not found"
                }, status=status.HTTP_404_NOT_FOUND)

            return Response({
                "message": (
                    f"Payment {action} successfully for "
                    f"{payment_date.strftime('%B %Y')}"
                ),
                "data": serializer.data
            }, status=http_status)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="List All Payments",
        description="""
        Retrieve a paginated list of all fee payments with filtering
        and sorting.

        **Filtering Options:**
        - student: Filter by student ID (e.g., ?student=5)
        - status: Filter by payment status (e.g., ?status=paid)
        - month: Filter by month (YYYY-MM format, e.g., ?month=2026-02)

        **Sorting Options:**
        - ordering: Sort by field (e.g., ?ordering=-date_paid)
          - Available fields: date_paid, amount, month_paid_for
          - Prefix with '-' for descending order

        **Pagination:**
        - page: Page number (e.g., ?page=2)
        - page_size: Items per page (default: 10, max: 100)
        """,
        parameters=[
            OpenApiParameter(
                name='student',
                type=int,
                location=OpenApiParameter.QUERY,
                description='Filter by student ID'
            ),
            OpenApiParameter(
                name='status',
                type=str,
                location=OpenApiParameter.QUERY,
                description=(
                    'Filter by payment status (paid/pending/late)'
                ),
                enum=['paid', 'pending', 'late']
            ),
            OpenApiParameter(
                name='month',
                type=str,
                location=OpenApiParameter.QUERY,
                description='Filter by month (YYYY-MM format)'
            ),
            OpenApiParameter(
                name='ordering',
                type=str,
                location=OpenApiParameter.QUERY,
                description='Sort by field (prefix with - for descending)',
                enum=['date_paid', '-date_paid', 'amount', '-amount',
                      'month_paid_for', '-month_paid_for']
            ),
            OpenApiParameter(
                name='page',
                type=int,
                location=OpenApiParameter.QUERY,
                description='Page number'
            ),
            OpenApiParameter(
                name='page_size',
                type=int,
                location=OpenApiParameter.QUERY,
                description='Number of results per page (max: 100)'
            ),
        ],
        responses={
            200: {
                'description': 'Paginated list of payments',
                'content': {
                    'application/json': {
                        'example': {
                            'count': 50,
                            'next': (
                                'http://127.0.0.1:8000/api/'
                                'payments/?page=2'
                            ),
                            'previous': None,
                            'results': [
                                {
                                    'id': 1,
                                    'student': 5,
                                    'amount': 5000,
                                    'date_paid': '2026-02-17',
                                    'month_paid_for': '2026-02-01',
                                    'status': 'paid',
                                    'screenshot': '/media/payments/receipt.jpg'
                                }
                            ]
                        }
                    }
                }
            }
        },
        tags=['Payments']
    )
    def get(self, request):
        # Start with all payments
        queryset = FeePayment.objects.all()

        # Filtering
        student_id = request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        payment_status = request.query_params.get('status')
        if payment_status:
            queryset = queryset.filter(status=payment_status)

        month_filter = request.query_params.get('month')
        if month_filter:
            try:
                year, month = month_filter.split('-')
                queryset = queryset.filter(
                    month_paid_for__year=int(year),
                    month_paid_for__month=int(month)
                )
            except (ValueError, AttributeError):
                pass

        # Sorting
        ordering = request.query_params.get('ordering', '-date_paid')
        allowed_orderings = [
            'date_paid', '-date_paid',
            'amount', '-amount',
            'month_paid_for', '-month_paid_for'
        ]
        if ordering in allowed_orderings:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by('-date_paid')

        # Pagination
        paginator = StudentPagination()
        paginated_queryset = paginator.paginate_queryset(
            queryset, request
        )

        serializer = FeePaymentSerializer(paginated_queryset, many=True)
        return paginator.get_paginated_response(serializer.data)


class DashboardStatsAPIView(APIView):
    def get(self, request):
        try:
            students = Student.objects.filter(
                is_active=True
            ).order_by('-created_at')[:5]
            serializer = DashboardStatsSerializer(students, many=True)
            stats = {
                'total_students': Student.objects.count(),
                'total_active_students': Student.objects.filter(
                    is_active=True
                ).count(),
                "pending_fees_amount": FeePayment.objects.filter(
                    status='pending'
                ).aggregate(total=models.Sum('amount'))['total'] or 0,
                "paid_fees_amount": FeePayment.objects.filter(
                    status='paid'
                ).aggregate(total=models.Sum('amount'))['total'] or 0,
                "total_revenue": FeePayment.objects.aggregate(
                    total=models.Sum('amount')
                )['total'] or 0,
            }
            return Response({
                "message": "Recent students fetched successfully",
                "students": serializer.data,
                "stats": stats
            }, status=status.HTTP_200_OK)
        except Exception as e:
            print(traceback.format_exc())
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SendMessageAPIView(APIView):
    @extend_schema(
        summary="Send Message to Selected Students",
        description=(
            "This endpoint sends a message to multiple active students "
            "in the background using Celery. "
            "Only students with is_active=True will receive the message."
        ),
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "student_ids": {
                        "type": "array",
                        "items": {"type": "integer"},
                        "example": [1, 2, 3]
                    },
                    "message": {
                        "type": "string",
                        "example": "Dear parents, tomorrow is a holiday."
                    },
                },
                "required": ["student_ids", "message"],
            }
        },
        responses={
            200: OpenApiResponse(
                response=OpenApiTypes.OBJECT,
                description="Messages are being sent in background"
            ),
            400: OpenApiResponse(
                description="Invalid request data"
            ),
            500: OpenApiResponse(
                description="Internal server error"
            ),
        },
        examples=[
            OpenApiExample(
                "Send message example",
                value={
                    "student_ids": [1, 2, 3],
                    "message": "Dear parents, tomorrow is a holiday."
                },
                request_only=True,
            )
        ]
    )
    def post(self, request):
        try:
            data = request.data
            student_ids = data.get("student_ids", [])
            message = data.get("message", "")

            if student_ids:
                students = Student.objects.filter(
                    is_active=True,
                    id__in=student_ids
                ).select_related('guardian').distinct("guardian")
            else:
                students = Student.objects.filter(
                    is_active=True
                ).select_related('guardian').distinct("guardian")

            for student in students:
                if student.guardian and student.guardian.phone_number:
                    phone_number = str(student.guardian.phone_number)
                    guardian_id = student.guardian.id
                    send_message.delay(phone_number, message, guardian_id)

            return Response(
                {
                    "message": (
                        f"Queued {students.count()} SMS messages to be sent "
                    )
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ListCreateExpenseAPIView(APIView):
    @extend_schema(
        summary="List expenses",
        description=(
            "Retrieve expenses with optional search, filtering, "
            "sorting, and pagination."
        ),
        parameters=[
            OpenApiParameter(
                name="search",
                type=OpenApiTypes.STR,
                required=False,
                description=(
                    "Search by title, description, "
                    "expense_date, or category."
                ),
            ),
            OpenApiParameter(
                name="category",
                type=OpenApiTypes.STR,
                required=False,
                enum=["salary", "rent", "utilities", "other"],
                description="Filter by expense category.",
            ),
            OpenApiParameter(
                name="status",
                type=OpenApiTypes.STR,
                required=False,
                enum=["pending", "paid"],
                description="Filter by expense status.",
            ),
            OpenApiParameter(
                name="sort",
                type=OpenApiTypes.STR,
                required=False,
                description=(
                    "Sort by: title, amount, expense_date, "
                    "category, status, created_at. "
                    "Use '-' prefix for descending."
                ),
            ),
        ],
        responses={200: ReadExpenseSerializer},
    )
    def get(self, request):
        try:
            expenses = Expense.objects.all()
            print(expenses)
            # Search
            search_query = request.query_params.get('search', '')
            if search_query:
                expenses = expenses.filter(
                    Q(title__icontains=search_query) |
                    Q(description__icontains=search_query) |
                    Q(expense_date__icontains=search_query) |
                    Q(category__icontains=search_query)
                )

            # Filter
            category = request.query_params.get('category', None)
            if category:
                expenses = expenses.filter(category=category)

            status = request.query_params.get('status', None)
            if status:
                expenses = expenses.filter(status=status)

            # Sort
            sort = request.query_params.get('sort')
            allowed_sort_fields = [
                "title",
                "amount",
                "expense_date",
                "category",
                "status",
                "created_at",
            ]

            if sort:
                sort_field = sort.lstrip('-')
                if sort_field in allowed_sort_fields:
                    expenses = expenses.order_by(sort)

            # Pagination
            paginator = StudentPagination()
            paginated_queryset = paginator.paginate_queryset(
                expenses, request
            )

            serializer = ReadExpenseSerializer(paginated_queryset, many=True)
            return paginator.get_paginated_response(serializer.data)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(
        summary="Create expense",
        description="Create a new expense record.",
        request=CreateExpenseSerializer,
        responses={
            201: ReadExpenseSerializer,
            400: OpenApiTypes.OBJECT,
        },
    )
    def post(self, request):
        serializer = CreateExpenseSerializer(data=request.data)

        if serializer.is_valid():
            expense = serializer.save()
            response_serializer = ReadExpenseSerializer(expense)
            return Response(
                {
                    "message": "Expense created successfully",
                    "expense": response_serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(
            {"error": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )


class ExpenseDetailAPIView(APIView):
    @extend_schema(
        summary="Retrieve expense",
        description="Get a single expense by ID.",
        responses={200: ReadExpenseSerializer},
    )
    def get(self, request, pk):
        expense = get_object_or_404(Expense, pk=pk)
        serializer = ReadExpenseSerializer(expense)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Partially update expense",
        description="Update one or more fields of an expense.",
        request=CreateExpenseSerializer,
        responses={
            200: ReadExpenseSerializer,
            400: OpenApiTypes.OBJECT,
        },
    )
    def patch(self, request, pk):
        expense = get_object_or_404(Expense, pk=pk)

        serializer = CreateExpenseSerializer(
            expense,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            updated_expense = serializer.save()
            response_serializer = ReadExpenseSerializer(
                updated_expense
            )
            return Response(
                response_serializer.data,
                status=status.HTTP_200_OK,
            )

        return Response(
            {"error": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    @extend_schema(
        summary="Delete expense",
        description="Delete an expense by ID.",
        responses={204: None},
    )
    def delete(self, request, pk):
        expense = get_object_or_404(Expense, pk=pk)
        expense.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MonthlyFinanceSummaryAPIView(APIView):
    @extend_schema(
        summary="Get monthly finance summary",
        description=(
            "Returns total revenue, total expenses, net profit, and "
            "expenses grouped by category for the current month."
        ),
        responses={
            200: {
                "type": "object",
                "properties": {
                    "message": {"type": "string"},
                    "month_name": {"type": "string", "example": "Feb-2026"},
                    "total_revenue": {"type": "number", "example": 5000},
                    "total_expenses": {"type": "number", "example": 3000},
                    "net_profit": {"type": "number", "example": 2000},
                    "expense_by_category": {
                        "type": "object",
                        "properties": {
                            "salary": {"type": "number", "example": 1000},
                            "rent": {"type": "number", "example": 1000},
                            "utilities": {"type": "number", "example": 500},
                            "other": {"type": "number", "example": 500},
                        },
                    },
                },
            },
            500: {
                "type": "object",
                "properties": {
                    "error": {
                        "type": "string",
                        "example": "Internal server error"
                    },
                },
            },
        },
    )
    def get(self, request):
        try:
            now = timezone.now()
            current_month_name = f"{now.strftime('%b')}-{now.year}"

            # Total revenue for this month
            total_revenue = FeePayment.objects.filter(
                month_paid_for__month=now.month,
                month_paid_for__year=now.year,
            ).aggregate(Sum('amount'))['amount__sum'] or 0

            # Total expenses for this month
            total_expenses = Expense.objects.filter(
                expense_date__month=now.month,
                expense_date__year=now.year,
            ).aggregate(Sum('amount'))['amount__sum'] or 0

            # Expenses by category
            categories = ["salary", "rent", "utilities", "other"]
            expense_by_category = {}
            for category in categories:
                expense_by_category[category] = Expense.objects.filter(
                    expense_date__month=now.month,
                    expense_date__year=now.year,
                    category=category,
                ).aggregate(Sum('amount'))['amount__sum'] or 0

            return Response({
                "message": "Monthly finance summary",
                "month_name": current_month_name,
                "total_revenue": total_revenue,
                "total_expenses": total_expenses,
                "net_profit": total_revenue - total_expenses,
                "expense_by_category": expense_by_category,
            })

        except Exception as e:
            traceback.print_exc()
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BulkTestRecordsAPIView(APIView):
    @extend_schema(
        request=BulkTestRecordsSerializer,
        responses={200: None},
        summary="Create multiple test records for a student in bulk"
    )
    def post(self, request, student_id):
        student = get_object_or_404(Student, id=student_id)

        serializer = BulkTestRecordsSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        records_data = serializer.validated_data['records']
        bulk_to_create = []
        for record in records_data:
            obtained_marks = record.get('obtained_marks')
            total_marks = record.get('total_marks')

            if obtained_marks and total_marks:
                percentage = (obtained_marks / total_marks) * 100
                record['percentage'] = percentage

            bulk_to_create.append(
                StudentTestRecords(
                    student=student,
                    **record
                )
            )

        created_records = StudentTestRecords.objects.bulk_create(
            bulk_to_create
        )

        current_total = student.total_tests_conducted or 0
        student.total_tests_conducted = current_total + len(created_records)
        student.save()

        return Response({
            "message": "Test records created successfully",
            "student": student.id,
            "count": len(created_records)
        }, status=status.HTTP_200_OK)


class StudentAcademicSummaryAPIView(APIView):
    def get(self, request, student_id):
        try:
            student = Student.objects.get(id=student_id)

            test_records = StudentTestRecords.objects.filter(
                student_id=student_id
            )
            serializer = ReadTestRecordsSerializer(test_records, many=True)

            ranked_students = Student.objects.filter(
                grade=student.grade
            ).annotate(
                total_obtained=Sum('test_records__obtained_marks')
            ).annotate(
                position=Window(
                    expression=DenseRank(),
                    order_by=F('total_obtained').desc(nulls_last=True)
                )
            )
            my_position = None
            for s in ranked_students:
                if s.id == student.id:
                    my_position = s.position
                    break

            summary = {
                'student_id': student_id,
                'student_name': student.name,
                'total_students_in_class': Student.objects.filter(
                    grade=student.grade
                ).count(),
                'total_obtained_marks': test_records.aggregate(
                    Sum('obtained_marks')
                )['obtained_marks__sum'] or 0,
                'total_marks': test_records.aggregate(
                    Sum('total_marks')
                )['total_marks__sum'] or 0,
                'average_percentage': test_records.aggregate(
                    Avg('percentage')
                )['percentage__avg'] or 0,
                'total_tests_conducted': Student.objects.get(
                    id=student_id
                ).total_tests_conducted,
                "class_position": my_position,
            }
            return Response({
                'message': 'Test records fetched successfully',
                'test_records': serializer.data,
                'summary': summary
            })

        except Exception as e:
            traceback.print_exc()
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
