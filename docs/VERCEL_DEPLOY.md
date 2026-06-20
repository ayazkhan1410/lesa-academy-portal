# Vercel Deployment Guide — LESA Academy Portal

## Architecture

| Component | Host | Notes |
|-----------|------|-------|
| **React frontend** | **Vercel** | This guide |
| **Django API** | Render / Railway / VPS | Postgres + Redis + Celery required |
| **Database** | Managed Postgres | Not on Vercel |
| **Celery / Redis** | Same as backend host | SMS & background tasks |

> Vercel is ideal for the static React app. Django + Celery + Postgres cannot run fully on Vercel serverless.

---

## 1. Deploy frontend to Vercel

> **Important:** `lesa-academy-portal.vercel.app` must serve the **React app**, not Django.  
> If you see JSON like `"error": "Page Not Found"` at `/`, Vercel is running the Django backend instead of the frontend.

1. Push branch to GitHub.
2. In [Vercel](https://vercel.com) → **Add New Project** → import repo.
3. **Do NOT use Python/Django preset.** Use **Vite** or Other.
4. Either:
   - **Option A (recommended):** Set **Root Directory** to `frontend`, **OR**
   - **Option B:** Keep repo root — root `vercel.json` builds `frontend/` automatically.
5. Build command: `npm run build` (if root dir is `frontend`)
6. Output directory: `dist` (if root dir is `frontend`)

### Environment variables (Vercel → Settings → Environment Variables)

| Variable | Example | Required |
|----------|---------|----------|
| `VITE_API_BASE_URL` | `https://api.your-academy.com` | Yes |

7. Deploy.

`frontend/vercel.json` handles SPA routing (React Router).

---

## 2. Deploy backend (separate host)

Deploy Django using Docker (`docker-compose.yml`) or your host's Python build.

### Backend environment variables

```env
ALLOWED_HOSTS=api.your-academy.com
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
DB_HOST=...
DB_PORT=5432
CELERY_BROKER_URL=redis://...
CELERY_RESULT_BACKEND=redis://...
```

After backend is live, set `VITE_API_BASE_URL` on Vercel to that API URL and redeploy.

---

## 3. Local development (unchanged)

```bash
docker compose up
```

Frontend defaults to `http://127.0.0.1:8000` when `VITE_API_BASE_URL` is not set.

Optional: copy `frontend/.env.example` → `frontend/.env.local`

---

## 4. Verify

- [ ] Login works on Vercel URL
- [ ] Dashboard loads stats
- [ ] Images/media load (backend must serve `/media/`)
- [ ] CORS: no browser blocked requests

---

## Files changed for Vercel readiness

- `frontend/src/config/api.js` — central API base URL
- `frontend/src/main.jsx` — axios default base URL
- `frontend/vercel.json` — SPA rewrites
- `frontend/.env.example` — env template
- `config/settings.py` — `CORS_ALLOWED_ORIGINS` from env
