# Deployment Guide — LESA Academy Portal

## Architecture

| Component | Host | Notes |
|-----------|------|-------|
| **React frontend** | Vercel | Root Directory = `frontend` |
| **Django API** | Render | Web service (Docker) |
| **PostgreSQL** | Render | Fresh production database |
| **Redis + Celery** | Render | Background worker for SMS/tasks |

Local development continues to use `docker compose up` with `.env`.

---

## Part 1 — Deploy backend on Render

### 1. Connect GitHub

1. Go to [render.com](https://render.com) → **New** → **Blueprint**
2. Connect repo `lesa-academy-portal`
3. Render reads `render.yaml` and creates:
   - Postgres (`lesa-db`)
   - Redis (`lesa-redis`)
   - Web service (`lesa-api`)
   - Celery worker (`lesa-celery`)

### 2. Set required env vars on `lesa-api`

After blueprint sync, open **lesa-api** → **Environment**:

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | From **Render PostgreSQL** (Internal Database URL) |
| `CORS_ALLOWED_ORIGINS` | `https://lesa-academy-portal.vercel.app` |
| `DJANGO_SUPERUSER_EMAIL` | `admin@lesa.com` |
| `DJANGO_SUPERUSER_USERNAME` | `admin` |
| `DJANGO_SUPERUSER_PASSWORD` | strong password |

> **Critical:** Do **not** upload your local `.env` as a Secret File on Render.  
> It sets `DB_HOST=db` and `redis://redis` — those only work in Docker locally.  
> On Render you must use `DATABASE_URL` from Render Postgres.

`SECRET_KEY` and Redis URLs are wired by `render.yaml` if using Blueprint.

### 3. Initialize production database

Migrations and superuser run automatically via `start.sh` on each deploy (no Shell needed on free plan).

### 4. Verify API

Open:

```
https://<your-service>.onrender.com/api/health-check/
```

You should get a success response.

---

## Part 2 — Connect frontend on Vercel

### Vercel project settings

| Setting | Value |
|---------|-------|
| Root Directory | `frontend` |
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### Environment variable (required)

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `https://<your-service>.onrender.com` |

**Redeploy Vercel** after setting this — Vite bakes env vars at build time.

SPA routing is handled by `frontend/vercel.json`.

---

## Part 3 — Local development

```bash
cp .env.example .env
docker compose up
```

- Frontend: `http://localhost:5173`
- Backend: `http://127.0.0.1:8000`
- Frontend defaults to local API when `VITE_API_BASE_URL` is unset

### After changing `requirements.txt`

Rebuild backend images so new packages (e.g. `dj-database-url`, `gunicorn`) are installed:

```bash
docker compose build backend celery_worker flower
docker compose up -d
docker compose exec backend python manage.py check
```

---

## Production checklist

- [ ] Render blueprint deployed (`lesa-api`, `lesa-celery`, Postgres, Redis)
- [ ] `CORS_ALLOWED_ORIGINS` includes Vercel URL
- [ ] `ALLOWED_HOSTS` includes Render hostname
- [ ] `createsuperuser` run on Render Shell
- [ ] `VITE_API_BASE_URL` set on Vercel and redeployed
- [ ] Login works from Vercel URL on another device (not just your PC)

---

## Celery worker (free tier)

Use **low concurrency** or the worker OOMs on 512 MB:

```
celery -A config.celery_app worker --loglevel=info --concurrency=1
```

## SMS gateway (important)

Local SMS Gateway apps (`192.168.x.x:8080`) only work on your **home/office network**.
Render (cloud) **cannot reach** them.

| Environment | SMS works? |
|-------------|------------|
| Local Docker | Yes (if gateway app running on PC) |
| Render production | No — unless gateway has a **public URL** (ngrok for testing, Twilio/etc. for prod) |

Set `MOBILE_GATEWAY_URL` on **both** Django web service and Celery worker.

---

## Media files note

Uploaded images (student photos, receipts) are stored on Render disk for now.
Files persist across restarts but consider **S3/Cloudinary** before heavy production use.

---

## Files in this repo for deployment

| File | Purpose |
|------|---------|
| `render.yaml` | Render Blueprint (API + worker + DB + Redis) |
| `Dockerfile` | Production Gunicorn image |
| `config/settings.py` | Env-based DEBUG, SECRET_KEY, DATABASE_URL |
| `frontend/vercel.json` | Vercel SPA rewrites |
| `frontend/src/config/api.js` | API base URL from env |
| `.env.example` | Local env template |
