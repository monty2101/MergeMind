# MergeMind — Complete Setup & Run Instructions

> Run every command exactly as written. Each section builds on the previous one.
> If a command fails, do not skip it — fix it before moving on.

---

## Prerequisites

Before starting, you need these installed on your Mac:

| Tool | Check if installed | Install command |
|---|---|---|
| Bun | `bun --version` | `curl -fsSL https://bun.sh/install \| bash` |
| Git | `git --version` | Pre-installed on macOS |
| Docker Desktop | `docker --version` | Download from docker.com/products/docker-desktop |

After installing Bun, **close and reopen your terminal** before continuing.

---

## Required Accounts & Keys

Sign up for these (all free) and keep the keys handy:

| Service | URL | What you need |
|---|---|---|
| Neon | neon.tech | `DATABASE_URL` (connection string) |
| Upstash | upstash.com | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` |
| Resend | resend.com | `RESEND_API_KEY` |
| Google Cloud | console.cloud.google.com | `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` |
| Gemini | aistudio.google.com | `GEMINI_API_KEY` |
| Anthropic | console.anthropic.com | `ANTHROPIC_API_KEY` |
| GitHub | github.com | Create a GitHub App (see GitHub App Setup section) |

---

## Part 1 — First Time Setup

### 1.1 Clone / enter the project

```bash
cd /Users/vinit/MergeMind
```

### 1.2 Install all dependencies

```bash
bun install
```

Expected output: `X packages installed`

### 1.3 Start Docker Desktop

Open Docker Desktop from your Applications folder. Wait for the whale icon in the menu bar to stop animating (means Docker is ready).

### 1.4 Start local database and Redis

```bash
docker-compose up -d
```

Expected output:
```
✔ Container mergemind-postgres-1    Started
✔ Container mergemind-redis-1       Started
```

### 1.5 Verify containers are running

```bash
docker ps
```

You must see both `mergemind-postgres-1` and `mergemind-redis-1` with status `Up`.

### 1.6 Verify Postgres is reachable

```bash
docker exec -it $(docker ps -qf "name=postgres") psql -U codereview -c "\l"
```

Expected: list of databases including `codereview`.

### 1.7 Verify Redis is reachable

```bash
docker exec -it $(docker ps -qf "name=redis") redis-cli ping
```

Expected: `PONG`

---

## Part 2 — Environment Variables

### 2.1 Create your .env file

```bash
cp .env.example .env
```

### 2.2 Open and fill in the values

```bash
open -e .env
```

Fill in every value. Here is what each one is:

```env
# ── Database ──────────────────────────────────────────────────────
# Local dev (Docker) — leave exactly as is
DATABASE_URL=postgresql://codereview:codereview@localhost:5432/codereview

# ── Redis ─────────────────────────────────────────────────────────
# Local dev (Docker) — leave exactly as is
REDIS_URL=redis://localhost:6379

# Production only — from Upstash dashboard
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# ── Auth ──────────────────────────────────────────────────────────
# Generate a random string: openssl rand -base64 32
JWT_SECRET=
JWT_EXPIRES_IN=7d

# ── Google OAuth ──────────────────────────────────────────────────
# From Google Cloud Console → APIs & Services → Credentials
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# ── AI Providers ──────────────────────────────────────────────────
GEMINI_API_KEY=
ANTHROPIC_API_KEY=

# ── Email ─────────────────────────────────────────────────────────
RESEND_API_KEY=
RESEND_FROM_EMAIL=onboarding@resend.dev

# ── GitHub App ────────────────────────────────────────────────────
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# ── App ───────────────────────────────────────────────────────────
API_PORT=3000
WEB_URL=http://localhost:5173
API_URL=http://localhost:3000
NODE_ENV=development
```

Generate a JWT secret:

```bash
openssl rand -base64 32
```

Copy the output into `JWT_SECRET=` in your `.env` file.

---

## Part 3 — Database Setup

> Only run this once. Skip if tables already exist.

### 3.1 Apply the database schema

```bash
cd packages/db

export DATABASE_URL="postgresql://codereview:codereview@localhost:5432/codereview"

docker exec -i $(docker ps -qf "name=postgres") \
  psql -U codereview -d codereview \
  < src/migrations/0000_elite_hydra.sql
```

### 3.2 Verify all 10 tables were created

```bash
docker exec -it $(docker ps -qf "name=postgres") \
  psql -U codereview -d codereview -c "\dt"
```

Expected output — you must see all 10 tables:

```
 Schema |      Name       | Type  |   Owner
--------+-----------------+-------+------------
 public | doc_entities    | table | codereview
 public | findings        | table | codereview
 public | otp_codes       | table | codereview
 public | project_members | table | codereview
 public | projects        | table | codereview
 public | pull_requests   | table | codereview
 public | qa_cases        | table | codereview
 public | repos           | table | codereview
 public | review_runs     | table | codereview
 public | users           | table | codereview
```

### 3.3 Go back to root

```bash
cd /Users/vinit/MergeMind
```

---

## Part 4 — Running the Project

You need **3 terminal tabs** open simultaneously. Open them now.

---

### Terminal Tab 1 — API Server

```bash
cd /Users/vinit/MergeMind/apps/api
bun run --hot src/index.ts
```

Expected output:
```
🚀 MergeMind API running on http://localhost:3000
```

The `--hot` flag means the server auto-restarts when you save files.

---

### Terminal Tab 2 — Background Worker

```bash
cd /Users/vinit/MergeMind/apps/worker
bun run --hot src/index.ts
```

Expected output:
```
⚙️  MergeMind workers started
✔ review-worker listening
✔ docs-worker listening
✔ qa-worker listening
```

The worker must always be running for PR reviews to work. It processes jobs from the queue.

---

### Terminal Tab 3 — React Frontend

```bash
cd /Users/vinit/MergeMind/apps/web
bun run dev
```

Expected output:
```
  VITE v5.x.x  ready in Xms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open http://localhost:5173 in your browser.

---

## Part 5 — Verify Everything Works

Run these in a new terminal tab (Tab 4) to confirm the API is healthy:

### 5.1 Health check

```bash
curl http://localhost:3000/health
```

Expected:
```json
{"status":"ok","timestamp":"2026-xx-xxTxx:xx:xx.xxxZ"}
```

### 5.2 Test OTP send

```bash
curl -X POST http://localhost:3000/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

Expected:
```json
{"message":"OTP sent successfully"}
```

Check Terminal Tab 1 (API server) — you will see:

```
📧 OTP for test@example.com: 123456
```

### 5.3 Test OTP verify (use the code from Tab 1)

```bash
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "code": "123456"}'
```

Expected:
```json
{
  "user": { "id": "...", "email": "test@example.com", "name": null },
  "token": "eyJ..."
}
```

If you see this, the full auth flow is working end to end.

---

## Part 6 — Daily Development Workflow

Every day when you sit down to work:

```bash
# Step 1 — Make sure Docker is running (open Docker Desktop app)

# Step 2 — Start containers if not already running
docker-compose up -d

# Step 3 — Open 3 terminal tabs and run:
# Tab 1: cd apps/api    && bun run --hot src/index.ts
# Tab 2: cd apps/worker && bun run --hot src/index.ts
# Tab 3: cd apps/web    && bun run dev
```

That's it. All three must be running simultaneously.

---

## Part 7 — Stopping Everything

```bash
# Stop Docker containers (keeps your data)
docker-compose stop

# Stop Docker containers AND delete all data (full reset)
docker-compose down -v
```

To stop the API, worker, or web servers: press `Ctrl+C` in each terminal tab.

---

## Part 8 — Database Management

### Open Drizzle Studio (visual DB browser)

```bash
cd /Users/vinit/MergeMind/packages/db
export DATABASE_URL="postgresql://codereview:codereview@localhost:5432/codereview"
bunx drizzle-kit studio
```

Opens a browser UI at https://local.drizzle.studio where you can view and edit data.

### Generate a new migration (after changing schema files)

```bash
cd /Users/vinit/MergeMind/packages/db
export DATABASE_URL="postgresql://codereview:codereview@localhost:5432/codereview"
bunx drizzle-kit generate
```

Then apply it:

```bash
docker exec -i $(docker ps -qf "name=postgres") \
  psql -U codereview -d codereview \
  < src/migrations/YOUR_NEW_MIGRATION_FILE.sql
```

### Reset database completely (wipe all data and recreate)

```bash
docker-compose down -v
docker-compose up -d

docker exec -i $(docker ps -qf "name=postgres") \
  psql -U codereview -d codereview \
  < /Users/vinit/MergeMind/packages/db/src/migrations/0000_elite_hydra.sql
```

---

## Part 9 — Google OAuth Setup

### 9.1 Create Google OAuth credentials

1. Go to https://console.cloud.google.com
2. Create a new project called `MergeMind`
3. Go to **APIs & Services → OAuth consent screen**
   - User type: External
   - App name: MergeMind
   - Add your email as test user
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth Client ID**
   - Application type: Web application
   - Authorised redirect URIs: `http://localhost:3000/auth/google/callback`
5. Copy `Client ID` → paste into `GOOGLE_CLIENT_ID` in `.env`
6. Copy `Client Secret` → paste into `GOOGLE_CLIENT_SECRET` in `.env`

### 9.2 Restart the API server after updating .env

Press `Ctrl+C` in Tab 1, then:

```bash
bun run --hot src/index.ts
```

---

## Part 10 — GitHub App Setup

### 10.1 Create the GitHub App

1. Go to https://github.com/settings/apps/new
2. Fill in:
   - **GitHub App name**: MergeMind Dev
   - **Homepage URL**: http://localhost:5173
   - **Webhook URL**: (leave blank for now — fill in after deployment)
   - **Webhook secret**: run `openssl rand -base64 32` and save it
3. Permissions needed:
   - Repository: **Pull requests** → Read & Write
   - Repository: **Contents** → Read
   - Repository: **Checks** → Read & Write
4. Subscribe to events: **Pull request**
5. Click **Create GitHub App**
6. On the next page:
   - Copy **App ID** → paste into `GITHUB_APP_ID`
   - Click **Generate a private key** → download the `.pem` file
   - Open the `.pem` file, copy entire contents → paste into `GITHUB_APP_PRIVATE_KEY`
7. Go to **Install App** tab → install on your personal account or org

---

## Part 11 — Common Errors & Fixes

### "zsh: command not found: #"
You copy-pasted a comment line. Just ignore it — it does not affect anything.

### "Cannot connect to Docker daemon"
Docker Desktop is not running. Open it from Applications and wait for it to fully start.

### "bun: command not found"
Bun is not installed or your terminal needs restarting after install. Run:
```bash
curl -fsSL https://bun.sh/install | bash
# Then close and reopen terminal
```

### "DATABASE_URL is not set"
You forgot to export it. Run:
```bash
export DATABASE_URL="postgresql://codereview:codereview@localhost:5432/codereview"
```

### "Connection refused" on port 5432
Postgres container is not running. Run:
```bash
docker-compose up -d
```

### "relation does not exist" error from API
Tables were not created. Go back to Part 3 and run the migration SQL.

### Port 3000 already in use
Another process is using port 3000. Kill it:
```bash
lsof -ti:3000 | xargs kill -9
```

### Port 5173 already in use
```bash
lsof -ti:5173 | xargs kill -9
```

### Drizzle-kit shows neon warning and hangs
Do not use `drizzle-kit migrate` locally. Always apply migrations directly via psql:
```bash
docker exec -i $(docker ps -qf "name=postgres") \
  psql -U codereview -d codereview \
  < packages/db/src/migrations/0000_elite_hydra.sql
```

---

## Part 12 — Project Structure Quick Reference

```
MergeMind/
├── apps/
│   ├── api/          → Hono API server      → localhost:3000
│   ├── worker/       → BullMQ job workers   → background process
│   └── web/          → React frontend       → localhost:5173
├── packages/
│   ├── db/           → Drizzle schema + migrations
│   ├── queue/        → BullMQ queue definitions
│   ├── agents/       → LLM client wrappers
│   └── types/        → Shared TypeScript types
├── docker-compose.yml → Postgres + Redis
└── .env              → All environment variables (never commit this)
```

---

## Part 13 — Deployment (Production)

> Only do this when the app is ready to go live.

### Frontend → Vercel

```bash
# Install Vercel CLI
bun add -g vercel

cd apps/web
vercel deploy
```

Set environment variables in Vercel dashboard:
- `VITE_API_URL` = your Railway API URL

### API + Worker → Railway

1. Go to railway.app → New Project → Deploy from GitHub
2. Create two services from the same repo:
   - Service 1: Root directory = `apps/api`, start command = `bun run src/index.ts`
   - Service 2: Root directory = `apps/worker`, start command = `bun run src/index.ts`
3. Add all environment variables from `.env` to both services
4. For `DATABASE_URL`: use your Neon connection string (not localhost)
5. For `REDIS_URL`: use your Upstash connection string (not localhost)

---

*Last updated: April 2026 | MergeMind v0.1*
