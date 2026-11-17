# Deploying UM MailSense to Vercel (free)

The whole app runs as **one Vercel project**: the React frontend is served as static files and
the FastAPI backend runs as one Python serverless function (`api/index.py`). The database is
**Neon** (free PostgreSQL). The AI is **Llama 4 Scout on OpenRouter**.

```
Browser ──► https://<your-project>.vercel.app
              ├─ /            React app (frontend/dist)
              └─ /api/...     FastAPI (api/index.py ──► backend/app + ai/mailsense_ai)
                                  ├─► Neon PostgreSQL
                                  ├─► Gmail API (read-only)
                                  └─► OpenRouter (Llama 4 Scout)
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
| OpenRouter (prepaid credit) | AI (Llama 4 Scout) | https://openrouter.ai |
| Google Cloud OAuth app | "Sign in with Siswamail" (Google) | see step 6 |

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
| `LLM_PROVIDER` | `openrouter` |
| `LLM_API_KEY` | your OpenRouter API key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (step 6) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret (step 6) |
| `ADMIN_EMAILS` | your email(s), comma separated, e.g. `24221395@siswa.um.edu.my` |
| `ALLOWED_EMAIL_DOMAINS` | leave **empty** to allow Gmail too; `siswa.um.edu.my,siswa365.um.edu.my` for UM accounts only |
| `DEMO_MODE` | `false` (the app refuses to start in production otherwise) |

`VERCEL` is set by Vercel itself, which switches the app into serverless mode automatically.
After changing variables, use **Deployments → ⋯ → Redeploy**.

---

## 6. Google sign-in ("Sign in with Siswamail")

Siswamail (`@siswa.um.edu.my`) is a **Google Workspace** account, so MailSense signs students
in with Google and reads mail through the Gmail API (read-only).

1. https://console.cloud.google.com → sign in with your Siswamail → create a project
   `UM MailSense`.
2. **APIs & Services → Library →** enable **Gmail API**.
3. **Google Auth Platform / OAuth consent screen:**
   - User type **Internal** if it is offered (only UM accounts; no Google review needed).
     Otherwise **External**, and add each tester's address under **Audience → Test users**
     (max 100 while the app is in *Testing*).
   - App name `UM MailSense`, support email, developer contact.
   - **Data access / Scopes:** add `openid`, `.../auth/userinfo.email`,
     `.../auth/userinfo.profile` and `.../auth/gmail.readonly`.
4. **Clients → Create client → Web application**, name `MailSense web`.
   **Authorised redirect URIs:**
   - `https://<your-project>.vercel.app/api/v1/auth/google/callback`
   - `http://localhost:8000/api/v1/auth/google/callback` (local development)
5. Copy the **Client ID** and **Client secret** into Vercel as `GOOGLE_CLIENT_ID` and
   `GOOGLE_CLIENT_SECRET`, then redeploy.
6. **UM IT:** if UM's Google Workspace blocks unknown apps, a Workspace admin trusts the app in
   *Admin console → Security → Access and data control → API controls → Manage third-party
   app access → Add app → OAuth App Name Or Client ID* (paste the Client ID) → **Trusted**.

Microsoft sign-in (`MS_*` variables) is supported by the code but not used for UM.

---

## 7. Check the live site

1. `https://<your-project>.vercel.app/api/v1/health` shows `{"status":"ok"}`.
2. The landing page loads and **Sign in with Siswamail** opens Google's sign-in page.
3. Sign in → inbox shows "Checking for new mail…" then your emails, then "Sorting N emails
   with AI…" until each email has a segment.
4. Upload a CV on **My CV** → the **For You** list fills in.
5. As an admin (your email in `ADMIN_EMAILS`), the **Admin** page shows today's AI usage.
6. Vercel → Settings → **Cron Jobs** lists `/api/v1/cron/sync` daily.

If something fails, open Vercel → your deployment → **Logs** (Functions).
Common problems:

| Symptom | Fix |
|---|---|
| Google says *Access blocked* / *admin policy* | UM IT must trust the app's Client ID (step 6.6) |
| Google error *redirect_uri_mismatch* | the redirect URI in Google Cloud must match `BACKEND_URL` exactly |
| Google says the app is *not verified* / access denied | add the address under Test users, or use an Internal consent screen |
| Signed in but immediately signed out | `BACKEND_URL`/`FRONTEND_URL` must be the same `https://...vercel.app` address |
| Emails stay "Sorting…" and a yellow notice appears | `LLM_API_KEY` missing or OpenRouter credit used up |
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
- OpenRouter is pay-as-you-go (about $0.17 per 1,000 emails with Llama 4 Scout); MailSense
  retries automatically and keeps unsorted emails for later. The Admin page shows the daily
  token usage, and `LLM_DAILY_TOKEN_LIMIT` caps spending.
- To move the backend to an always-on server later, nothing in the code needs to change:
  set `SERVERLESS=false` there and the 10-minute background sync turns back on.
