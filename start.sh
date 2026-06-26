#!/usr/bin/env bash
set -e

if [ -n "$RENDER" ] && [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set on Render."
  echo "Create a Render PostgreSQL database and add DATABASE_URL."
  echo "Remove any uploaded local .env secret file (DB_HOST=db is Docker-only)."
  exit 1
fi

echo "==> Running migrations..."
python manage.py migrate --noinput

echo "==> Collecting static files..."
python manage.py collectstatic --noinput

echo "==> Creating superuser (if not exists)..."
python manage.py ensure_superuser

echo "==> Starting Gunicorn..."
exec gunicorn config.wsgi:application --bind "0.0.0.0:${PORT:-8000}" --workers 2
