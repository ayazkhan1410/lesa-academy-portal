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
| `CORS_ALLOWED_ORIGINS` | `https://lesa-academy-portal.vercel.app` |
| `ALLOWED_HOSTS` | `lesa-api.onrender.com,.onrender.com` |
| `MOBILE_GATEWAY_URL` | Public SMS gateway URL (not `192.168.x.x`) |

`DATABASE_URL`, `SECRET_KEY`, Redis URLs are wired by `render.yaml`.

### 3. Initialize production database

Render → **lesa-api** → **Shell**:

```bash
python manage.py createsuperuser
```

Migrations run automatically via `releaseCommand` on each deploy.

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
