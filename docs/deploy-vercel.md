# Deploying UM MailSense to Vercel (free)

The whole app runs as **one Vercel project**: the React frontend is served as static files and
the FastAPI backend runs as one Python serverless function (`api/index.py`). The database is
**Neon** (free PostgreSQL). The AI is **Llama 4 Scout on Groq**.

```
Browser ──► https://<your-project>.vercel.app
              ├─ /            React app (frontend/dist)
              └─ /api/...     FastAPI (api/index.py ──► backend/app + ai/mailsense_ai)
                                  ├─► Neon PostgreSQL
                                  ├─► Microsoft Graph / Gmail API (read-only)
                                  └─► Groq (Llama 4 Scout)
```

**How mail stays up to date on Vercel:** there is no always-on server, so instead of a
10-minute timer:
- when a student opens the inbox, MailSense fetches new mail if the last fetch was more than
  10 minutes ago, then sorts it with the AI in small batches while the page is open;
- the **Refresh** button fetches immediately;
- a **daily cron job** (6:00 am Malaysia time) catches up every account.

Time needed: about 45 minutes the first time.

---

## 0. What you need

| Account | Why | Link |
|---|---|---|
| GitHub | Vercel deploys from the repo | already done |
| Vercel (Hobby, free) | hosting | https://vercel.com — sign up **with GitHub** |
| Neon (free) | database | https://neon.tech — sign up with GitHub |
| Groq | AI (Llama 4 Scout) | https://console.groq.com |
| Microsoft Entra app | "Sign in with Siswamail" | see Milestone 1 notes / step 6 |
| Google Cloud OAuth app | "Sign in with Google" (optional) | see step 6 |

On your computer you need the project as it is now (Python virtual environment in
`backend\.venv`).

---

## 1. Put the code on the production branch

Vercel publishes the repo's **production branch** (normally `main`). The finished code is on
`develop`. Either merge `develop` into `main` (the PM merge), or in Vercel later choose
*Settings → Git → Production Branch → `develop`*.

---

## 2. Create the database (Neon)

1. In Neon: **New project** → name `mailsense` → region **AWS Asia Pacific (Singapore)** (the Vercel function also runs in Singapore, `sin1` in vercel.json)
   (closest to Malaysia) → Create.
2. On the project dashboard, click **Connect**, tick **Connection pooling**, and copy the
   connection string. It looks like:
   `postgresql://neondb_owner:xxxx@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
3. Create the tables from your computer (PowerShell, in the project folder):

   ```powershell
   cd E:\project\mailsense\backend
   $env:DATABASE_URL = "postgresql://...your Neon string..."
   .venv\Scripts\alembic upgrade head
   Remove-Item Env:DATABASE_URL
   ```

   You should see `Running upgrade ... -> 0854290c132f, notification settings`.
   Run this again whenever a new migration is added to `backend/migrations/versions/`.

---

## 3. Generate the secrets

Run each line in PowerShell and keep the output somewhere safe (a password manager):

```powershell
cd E:\project\mailsense\backend
.venv\Scripts\python -c "import secrets; print(secrets.token_urlsafe(48))"          # SECRET_KEY
.venv\Scripts\python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"  # ENCRYPTION_KEY
.venv\Scripts\python -c "import secrets; print(secrets.token_urlsafe(32))"          # CRON_SECRET
```

> ⚠️ **Never change `ENCRYPTION_KEY` after launch.** Login tokens and email bodies are
> encrypted with it; a new key makes existing data unreadable (students would have to sign in
> again and mail would be fetched again).

---

## 4. Create the Vercel project

1. Vercel dashboard → **Add New… → Project** → import `um-mailsense` from GitHub.
2. **Framework Preset:** `Other`. **Root Directory:** leave as the repo root (`./`).
   Build settings come from `vercel.json` — do not override them.
3. Open **Environment Variables** and add the variables from step 5 *before* the first deploy
   (you can also add them later and redeploy).
4. Click **Deploy**. Note your address, e.g. `https://um-mailsense.vercel.app`.

---

## 5. Environment variables (Vercel → Settings → Environment Variables)

| Name | Value |
|---|---|
| `ENVIRONMENT` | `production` |
| `DATABASE_URL` | the Neon connection string from step 2 |
| `SECRET_KEY` | from step 3 |
| `ENCRYPTION_KEY` | from step 3 |
| `CRON_SECRET` | from step 3 |
| `BACKEND_URL` | `https://<your-project>.vercel.app` (no slash at the end) |
| `FRONTEND_URL` | the same address |
| `LLM_PROVIDER` | `groq` |
| `LLM_API_KEY` | your Groq API key |
| `MS_CLIENT_ID` | Microsoft app (client) ID |
| `MS_CLIENT_SECRET` | Microsoft client secret **value** |
| `MS_TENANT` | `common` (or UM's tenant ID if UM IT registers the app) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (optional) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret (optional) |
| `ADMIN_EMAILS` | your email(s), comma separated, e.g. `24221395@siswa.um.edu.my` |
| `ALLOWED_EMAIL_DOMAINS` | leave **empty** to allow Gmail too; `siswa.um.edu.my,siswa365.um.edu.my` for UM accounts only |
| `DEMO_MODE` | `false` (the app refuses to start in production otherwise) |

`VERCEL` is set by Vercel itself, which switches the app into serverless mode automatically.
After changing variables, use **Deployments → ⋯ → Redeploy**.

---

## 6. Point Microsoft and Google at the live site

**Microsoft (Siswamail)** — portal.azure.com → Microsoft Entra ID → App registrations → your app:
- **Authentication → Add a platform / Web → Redirect URI:**
  `https://<your-project>.vercel.app/api/v1/auth/microsoft/callback`
  (keep the `http://localhost:8000/...` one for local development)
- **API permissions:** Microsoft Graph → Delegated → `User.Read`, `Mail.Read`
- **Admin consent by UM IT:** send UM IT this link (fill in both values):
  `https://login.microsoftonline.com/<UM-tenant-id>/adminconsent?client_id=<MS_CLIENT_ID>&redirect_uri=https://<your-project>.vercel.app/api/v1/auth/microsoft/callback`
  The UM tenant ID is the long ID inside `issuer` at
  `https://login.microsoftonline.com/siswa.um.edu.my/v2.0/.well-known/openid-configuration`.

**Google (optional)** — console.cloud.google.com → APIs & Services → Credentials → your
OAuth client → **Authorised redirect URIs:**
`https://<your-project>.vercel.app/api/v1/auth/google/callback`.
While the app is in *Testing*, only the Gmail addresses listed under **OAuth consent screen →
Test users** (max 100) can sign in.

---

## 7. Check the live site

1. `https://<your-project>.vercel.app/api/v1/health` shows `{"status":"ok"}`.
2. The landing page loads and **Sign in with Siswamail** is not greyed out.
3. Sign in → inbox shows "Checking for new mail…" then your emails, then "Sorting N emails
   with AI…" until each email has a segment.
4. Upload a CV on **My CV** → the **For You** list fills in.
5. As an admin (your email in `ADMIN_EMAILS`), the **Admin** page shows today's AI usage.
6. Vercel → Settings → **Cron Jobs** lists `/api/v1/cron/sync` daily.

If something fails, open Vercel → your deployment → **Logs** (Functions).
Common problems:

| Symptom | Fix |
|---|---|
| Page says sign-in failed with `admin_approval_required` | UM IT has not granted admin consent yet (step 6) |
| Microsoft error *redirect URI mismatch* | the redirect URI in Entra must match `BACKEND_URL` exactly |
| Signed in but immediately signed out | `BACKEND_URL`/`FRONTEND_URL` must be the same `https://...vercel.app` address |
| Emails stay "Sorting…" and a yellow notice appears | `LLM_API_KEY` missing or Groq limit reached |
| 500 errors mentioning the database | `DATABASE_URL` wrong, or step 2.3 (create tables) not run |

---

## 8. Updating the site

- Push/merge to the production branch → Vercel builds and deploys automatically.
- If the change added a database migration, run step 2.3 again **before** merging.

## Free-plan limits to know

- Vercel Hobby is for personal / non-commercial projects; each request may run at most
  300 seconds (the AI works in small batches to stay far below this); the cron runs once a day.
- Neon free has limited storage and compute; the database sleeps when idle and wakes in about
  a second on the next request.
- Groq's free tier has rate limits; MailSense retries automatically and keeps unsorted emails
  for later. The Admin page shows the daily token usage.
- To move the backend to an always-on server later, nothing in the code needs to change:
  set `SERVERLESS=false` there and the 10-minute background sync turns back on.
