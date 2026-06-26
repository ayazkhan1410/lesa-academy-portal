import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = 'Create a superuser from env vars if one does not already exist.'

    def handle(self, *args, **options):
        User = get_user_model()

        email = os.getenv('DJANGO_SUPERUSER_EMAIL')
        username = os.getenv('DJANGO_SUPERUSER_USERNAME')
        password = os.getenv('DJANGO_SUPERUSER_PASSWORD')

        if not all([email, username, password]):
            self.stdout.write(
                'Skipping superuser creation: '
                'DJANGO_SUPERUSER_EMAIL, DJANGO_SUPERUSER_USERNAME, '
                'and DJANGO_SUPERUSER_PASSWORD env vars are required.'
            )
            return

        if User.objects.filter(email=email).exists():
            self.stdout.write(f'Superuser already exists: {email}')
            return

        User.objects.create_superuser(
            email=email,
            username=username,
            password=password,
        )
        self.stdout.write(
            self.style.SUCCESS(f'Superuser created: {email}')
        )
