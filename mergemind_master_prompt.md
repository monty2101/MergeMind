# MergeMind — Master Project Prompt

## What is MergeMind?

MergeMind is a web application that acts as an AI-powered engineering intelligence platform. A developer connects their GitHub repository to MergeMind, and from that point forward — without any additional setup — every pull request they open gets automatically reviewed by a team of specialised AI agents, their codebase stays documented, and their QA team gets a generated list of edge cases to test for every change.

The product is built in three sequential modules. Module 1 is the PR code review engine (the core). Module 2 is the living code documentation system. Module 3 is the QA edge case generator. All three share the same infrastructure, database, and web dashboard.

---

## The Problem It Solves

1. **PR review bottleneck** — developers wait hours for a first review. MergeMind posts a structured AI review within 3–5 minutes of opening a PR, before a human reviewer even looks at it.
2. **Documentation rot** — codebases go undocumented or docs go stale. MergeMind auto-generates and updates documentation on every merge.
3. **QA blind spots** — QA teams manually think of test cases. MergeMind generates structured edge cases from the actual code diff automatically.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Bun (package manager + runtime) |
| API server | Hono (Bun-native HTTP framework) |
| Frontend | React 18 + Vite + TypeScript |
| Styling | TailwindCSS + ShadCN UI |
| State management | Zustand + React Query (TanStack) |
| Database | PostgreSQL via Neon (serverless, prod) + Docker (local dev) |
| ORM | Drizzle ORM |
| Queue system | BullMQ + Redis (Upstash in prod, Docker locally) |
| AI providers | Multi-LLM: Google Gemini (primary) + Anthropic Claude + OpenAI (via abstraction layer) |
| Email | Resend API (OTP delivery) |
| VCS integration | GitHub API (GitHub App) — Bitbucket planned for v2 |
| Deployment | Railway (API + Workers) + Vercel (Web frontend) |
| Monorepo | Bun workspaces |

---

## Project Name

**MergeMind** — the name is used everywhere: repo name, branding, database names, package names.

---

## Repository Structure

```
mergemind/
├── apps/
│   ├── api/                  # Hono API server → deployed to Railway
│   │   └── src/
│   │       ├── index.ts      # App entry point, mounts all routes
│   │       ├── routes/       # auth.ts, webhooks.ts, projects.ts, repos.ts, reviews.ts, docs.ts, qa.ts
│   │       ├── middleware/   # auth.ts (JWT), rateLimit.ts, errorHandler.ts
│   │       └── services/     # auth.service.ts, github.service.ts, otp.service.ts, email.service.ts
│   ├── worker/               # BullMQ workers → deployed to Railway (separate service)
│   │   └── src/
│   │       ├── index.ts      # Starts all workers
│   │       ├── workers/      # review.worker.ts, docs.worker.ts, qa.worker.ts
│   │       ├── agents/       # security.agent.ts, quality.agent.ts, performance.agent.ts, coordinator.agent.ts, docs.agent.ts, qa.agent.ts
│   │       └── prompts/      # security.md, quality.md, coordinator.md, docs.md, qa.md (agent system prompts)
│   └── web/                  # React frontend → deployed to Vercel
│       └── src/
│           ├── main.tsx
│           ├── pages/        # LoginPage.tsx, ProjectsPage.tsx, ProjectPage.tsx, ReviewPage.tsx
│           ├── features/     # auth/, projects/, reviews/, docs/, qa/ (feature-based components)
│           └── lib/          # api.ts (typed API client), queryClient.ts, utils.ts
├── packages/
│   ├── db/                   # Drizzle schema + migrations + db client → imported as @repo/db
│   │   └── src/
│   │       ├── schema/       # enums.ts, users.ts, projects.ts, reviews.ts, docs.ts, qa.ts
│   │       ├── migrations/   # auto-generated SQL migrations
│   │       └── index.ts      # exports db client + all schema
│   ├── queue/                # BullMQ queue definitions + job types → imported as @repo/queue
│   │   └── src/
│   │       ├── queues.ts     # reviewQueue, docsQueue, qaQueue
│   │       ├── jobs.ts       # TypeScript types for all job payloads
│   │       └── redis.ts      # Redis connection
│   ├── agents/               # Claude/Gemini API client wrapper → imported as @repo/agents
│   │   └── src/
│   │       ├── llm.client.ts # Multi-LLM abstraction (Gemini, Claude, OpenAI)
│   │       └── prompt.loader.ts
│   ├── types/                # Shared TypeScript types + Zod schemas → imported as @repo/types
│   │   └── src/
│   │       ├── api.ts        # API response shapes
│   │       └── enums.ts      # RiskTier, Severity, ReviewStatus, MemberRole, QAStatus, VCSProvider
│   └── config/               # Shared ESLint + TypeScript base config
├── package.json              # Bun workspaces root
├── bunfig.toml
├── tsconfig.json             # Base TS config with @repo/* path aliases
├── docker-compose.yml        # Local Postgres + Redis
└── .env.example              # All required env vars documented
```

---

## Database Schema

Using PostgreSQL (Drizzle ORM). 11 tables across 5 schema files.

### Enums
- `member_role`: owner | viewer
- `vcs_provider`: github | bitbucket
- `risk_tier`: trivial | lite | full
- `review_status`: pending | processing | completed | failed
- `approval_decision`: approved | approved_with_comments | minor_issues | significant_concerns
- `severity`: critical | warning | suggestion
- `qa_status`: pending | tested | passed | failed
- `doc_author`: ai | human

### Tables

**users** — id (uuid PK), email (unique), name, avatar_url, google_id (unique), created_at, last_login_at

**otp_codes** — id, email, code (6 chars), expires_at, used (boolean), created_at

**projects** — id, owner_id (FK → users), name, description, created_at, updated_at

**project_members** — id, project_id (FK), user_id (FK), role (enum), invited_at, accepted_at

**repos** — id, project_id (FK), vcs_provider (enum), external_repo_id, full_name, default_branch, webhook_id, install_token_enc (encrypted), connected_at

**pull_requests** — id, repo_id (FK), external_pr_id, title, author, pr_number, status, risk_tier (enum), head_sha, opened_at, closed_at, created_at

**review_runs** — id, pr_id (FK), status (enum), approval_decision (enum), cost_usd_cents, duration_ms, commit_sha, error_message, started_at, completed_at, created_at

**findings** — id, review_run_id (FK), agent_name, severity (enum), category, message, file_path, line_number, suggestion, created_at. Indexes on (review_run_id) and (severity).

**doc_entities** — id, repo_id (FK), entity_type (function/class/module), file_path, entity_name, content_md, authored_by (enum), is_stale (boolean), generated_at, updated_at

**qa_cases** — id, pr_id (FK), category (happy_path/edge/error/security), priority, scenario_gherkin, status (enum), assignee_id, notes, created_at, updated_at

---

## Authentication

### Email OTP flow
1. User enters email → POST /auth/send-otp
2. Server generates 6-digit code → stores in Redis with 5-minute TTL (key: `otp:{email}`)
3. Sends email via Resend API
4. User enters code → POST /auth/verify-otp
5. Server checks Redis, marks used, upserts user in DB
6. Issues JWT (7-day expiry), sets httpOnly cookie

### Google OAuth flow
1. GET /auth/google → redirect to Google
2. Google redirects to GET /auth/google/callback with code
3. Exchange code for tokens → fetch Google profile
4. Upsert user in DB (match by google_id or email)
5. Issue JWT, set httpOnly cookie

### JWT middleware
All protected routes check Authorization header or cookie for valid JWT. Attaches `user` object to Hono context.

---

## How GitHub Integration Works

### GitHub App (not OAuth App)
We use a GitHub App (not a personal OAuth App) because:
- Can be installed at the org level
- Webhook events come through one App webhook
- Installation tokens (not user tokens) for API calls

### Webhook flow (critical path)
1. User connects repo → MergeMind registers webhook via GitHub API
2. Developer opens PR on GitHub
3. GitHub fires POST to `https://api.mergemind.app/webhooks/github`
4. Webhook handler validates HMAC-SHA256 signature using `GITHUB_WEBHOOK_SECRET`
5. Handler identifies event type + action
6. If `pull_request.opened` or `pull_request.synchronize` → push job to `review-queue`
7. If `pull_request.closed` + merged → push job to `docs-queue`
8. Returns HTTP 200 immediately (must be under 3 seconds — GitHub retries on timeout)
9. BullMQ worker picks up the job asynchronously

---

## Queue Architecture

Three BullMQ queues backed by Redis:

### review-queue
- Triggered by: PR opened or new commits pushed
- Concurrency: 3 jobs at once
- Timeout: 30 minutes per job
- Retries: 3 attempts with exponential backoff (5s, 25s, 125s)
- Worker: review.worker.ts
- On failure after all retries: moves to dead-letter queue

### docs-queue
- Triggered by: PR merged to default branch
- Concurrency: 2 jobs at once
- Timeout: 15 minutes per job
- Retries: 2 attempts
- Worker: docs.worker.ts

### qa-queue
- Triggered by: review job completion (chained automatically)
- Concurrency: 2 jobs at once
- Timeout: 10 minutes per job
- Retries: 2 attempts
- Worker: qa.worker.ts

All queues use a dead-letter queue for jobs that exhaust retries. Bull Board UI is available for admin inspection.

---

## AI Agent Architecture

### The LLM Abstraction Layer
MergeMind uses a multi-LLM strategy. A `LLMProvider` interface abstracts all model calls so agent code never imports Gemini or Claude directly.

```typescript
interface LLMProvider {
  call(params: {
    system: string
    user: string
    schema: ZodSchema      // for structured output
    model?: string
  }): Promise<unknown>
}
```

Implementations: `GeminiProvider`, `ClaudeProvider`, `OpenAIProvider`

Default routing:
- Coordinator agent → Gemini 1.5 Pro (highest reasoning)
- Security, Code Quality, Performance agents → Gemini 1.5 Flash (fast, capable)
- Docs, QA, lightweight agents → Gemini 1.5 Flash or Claude Haiku
- All assignments overridable at runtime

### Agent design principle
Each agent is a TypeScript function, not an external process. There is no OpenCode, no child process spawning. An agent is:

```typescript
async function securityAgent(diff: string, context: ReviewContext): Promise<SecurityFinding[]> {
  const systemPrompt = loadPrompt("security")   // reads security.md
  const response = await llm.call({ system: systemPrompt, user: diff, schema: FindingsSchema })
  return response as SecurityFinding[]
}
```

### The specialist agents

**Security agent** — finds exploitable vulnerabilities only. Injection (SQL, XSS, command), auth bypasses, hardcoded secrets, insecure crypto, missing input validation. Explicitly NOT: theoretical risks, defence-in-depth suggestions, issues in unchanged code.

**Code quality agent** — logic bugs, missing error handling, N+1 queries, anti-patterns, dead code, naming that hides intent. NOT: style preferences, minor naming nits.

**Performance agent** — unnecessary re-renders, sync ops in async context, memory leaks, inefficient algorithms. Only runs on full-tier reviews.

**Coordinator agent** — reads all sub-agent findings, deduplicates, re-categorises, filters false positives, makes final approval decision. Uses the most capable model. Outputs the final structured review.

**Docs agent** — generates markdown documentation for functions, classes, and modules extracted from changed files. Input: extracted AST entities. Output: DocEntity[] with descriptions, params, return values, examples.

**QA agent** — generates test scenarios from the diff. Categories: happy path, edge cases, error paths, security inputs. Output: QACase[] in Gherkin format (Given / When / Then) with priority and category.

### Risk tier classification
Every PR is classified before running any agents:

- **Trivial** (≤10 lines changed, ≤20 files): runs coordinator + 1 general reviewer. Coordinator uses cheaper model.
- **Lite** (≤100 lines, ≤20 files): runs coordinator + code quality + documentation agents.
- **Full** (>100 lines OR >50 files OR any security-sensitive file touched): runs all 6 specialists + coordinator.

Security-sensitive files (auth/, crypto/, anything matching security path patterns) always trigger full tier regardless of size.

### Coordinator approval rubric

| Condition | Decision | GitHub action |
|---|---|---|
| All good or trivial suggestions only | approved | POST /approve |
| Only suggestion-severity findings | approved_with_comments | POST /approve |
| Some warnings, no production risk | approved_with_comments | POST /approve |
| Multiple warnings suggesting a pattern | minor_issues | POST /unapprove |
| Any critical finding | significant_concerns | Request changes (blocks merge) |

Bias is explicitly toward approval. One warning in an otherwise clean PR = approved_with_comments.

### Diff filtering (noise removal)
Before agents see the diff, filter out:
- Lock files: bun.lock, package-lock.json, yarn.lock, Cargo.lock, go.sum, poetry.lock
- Minified assets: .min.js, .min.css, .bundle.js, .map files
- Generated files: files with `// @generated` or `/* eslint-disable */` headers
- Exception: DB migration files are never filtered even if they look generated

### Prompt injection prevention
MergeMind includes user-controlled content (PR title, description, comments) in agent prompts. Before insertion, strip XML boundary tags that could break out of the prompt structure:

Tags to strip: `mr_input`, `mr_body`, `mr_comments`, `mr_details`, `changed_files`, `existing_inline_findings`, `previous_review`, `custom_review_instructions`

---

## Module 1 — PR Code Review Engine

### Full flow for one PR review

1. GitHub webhook fires (PR opened/updated)
2. Webhook receiver validates signature → pushes `ReviewJobData` to review-queue → returns 200
3. Review worker picks up job
4. Fetch PR diff from GitHub API
5. Filter noise from diff
6. Classify risk tier
7. Load appropriate agent set based on tier
8. Run sub-agents concurrently (Promise.allSettled)
9. Each agent reads relevant diff sections + sends to LLM + returns structured findings
10. Coordinator agent receives all findings → deduplicates → categorises → filters false positives → makes approval decision
11. Format findings as structured GitHub Markdown
12. POST review comment to GitHub PR via Octokit
13. Update PR check run status (pass/fail)
14. Save review run + findings to PostgreSQL
15. Chain qa-queue job for QA case generation
16. Update review status in DB to completed

### Re-review (new commits pushed)
When `pull_request.synchronize` event fires (developer pushes more commits):
1. Fetch previous review run from DB
2. Include previous findings in coordinator's prompt (with resolution status)
3. Coordinator rules: fixed findings are omitted, unfixed findings are re-emitted, user-resolved threads are respected
4. Update existing GitHub comment (not create new one)

---

## Module 2 — Code Documentation System

### Trigger
Fires on PR merge (docs-queue job). Also runs on initial repo connection (full scan, capped at 500 files for v1).

### Flow
1. Parse merged diff → extract changed file paths
2. Run code entity extractor (ts-morph for TypeScript/JavaScript) on changed files
3. Extract: function signatures, class definitions, exported interfaces, API route handlers
4. Run docs generation agent on extracted entities
5. Run staleness check: identify existing docs that are now incorrect due to the change
6. Store/update doc_entities in PostgreSQL
7. Mark stale docs (is_stale = true) for UI to surface

### Documentation storage
Stored in PostgreSQL (not committed to repo). The web UI provides a browser, editor, and export-to-repo button that opens a PR with generated markdown files.

### Docs freshness agent
Detects when a PR makes existing documentation stale:
- High materiality: package manager changes, test framework changes, major directory restructures, new required env vars
- Medium materiality: major dependency bumps, new linting rules, API client changes
- Low materiality: bug fixes, feature additions using existing patterns, CSS changes

---

## Module 3 — QA Edge Case Generator

### Trigger
Chained from review job completion. Runs on lite and full tier reviews only (not trivial).

### Flow
1. Read PR diff from DB (already stored from review job)
2. Run QA agent against the diff
3. Agent generates scenarios in Gherkin format (Given / When / Then)
4. Each case gets: category (happy_path / edge / error / security / performance), priority (high / medium / low), scenario text
5. Save to qa_cases table
6. Include QA summary section in the GitHub review comment (count + link to full report)

### QA case format (Gherkin)
```
Scenario: User submits form with empty email field
  Given the user is on the registration page
  When they submit the form with an empty email field
  Then they should see a validation error message
  And the form should not be submitted
```

### Status tracking
QA engineers use the MergeMind web dashboard to mark each case as tested/passed/failed with notes. The UI shows a progress bar (X of Y cases tested) per PR.

---

## Web Application — User Journey

### Authentication pages
- `/login` — email input or "Continue with Google" button
- `/login/verify` — OTP entry (6 digits, 5-minute expiry, resend option)
- `/auth/callback` — Google OAuth callback handler

### After login — Projects list (`/projects`)
Shows all projects the user owns or is a member of. Empty state shows "Create your first project" CTA.

### Onboarding wizard (new project)
3-step flow shown when creating a project:
1. **Name & describe** — project name, optional description
2. **Connect repository** — GitHub OAuth, show list of user's repos, select one or more
3. **Invite members** — enter email addresses, assign Owner or Viewer role

### Project dashboard (`/projects/:id`)
Three tabs:
- **Reviews** — list of PRs with status badges (approved/blocked/pending), finding counts, cost, duration. Click to open PR detail.
- **Docs** — documentation browser with file tree sidebar, entity cards, coverage score, staleness warnings
- **QA** — QA cases grouped by PR, with status tracking, priority badges, Gherkin display

### PR detail page (`/projects/:id/reviews/:prId`)
- Review summary (approval decision, total findings)
- Findings list grouped by severity (critical → warning → suggestion)
- Each finding shows: agent name, message, file path + line number, suggestion
- Re-run review button (for manual re-trigger)
- Link to associated QA cases

### Member access
Invited viewers see the same dashboard with all features read-only. They cannot: create projects, connect repos, invite members, or trigger re-reviews.

### Settings (`/projects/:id/settings`)
- Toggle individual agents on/off
- Custom review instructions (free text, injected into coordinator prompt)
- Risk tier override (force full tier on all PRs)
- Notification preferences
- Danger zone: disconnect repo, delete project

---

## API Endpoints

### Auth
- POST `/auth/send-otp` — body: `{ email }`
- POST `/auth/verify-otp` — body: `{ email, code }`
- GET `/auth/google` — redirect to Google
- GET `/auth/google/callback` — OAuth callback
- POST `/auth/logout`

### Projects
- GET `/projects` — list user's projects
- POST `/projects` — create project
- GET `/projects/:id` — get project with repos + member count
- PATCH `/projects/:id` — update name/description
- DELETE `/projects/:id` — delete (owner only)

### Members
- GET `/projects/:id/members` — list members
- POST `/projects/:id/members` — invite by email
- PATCH `/projects/:id/members/:userId` — change role
- DELETE `/projects/:id/members/:userId` — remove

### Repos
- GET `/repos/github` — list user's GitHub repos (via GitHub API)
- POST `/repos` — connect a repo (registers webhook)
- DELETE `/repos/:id` — disconnect (removes webhook)

### Reviews
- GET `/reviews?repoId=&page=` — paginated PR list
- GET `/reviews/:id` — review detail with findings
- POST `/reviews/:id/rerun` — manually trigger re-review

### Docs
- GET `/docs/:repoId` — all doc entities for a repo
- GET `/docs/:repoId/coverage` — coverage stats
- PATCH `/docs/:entityId` — manual edit (saves as human-authored)

### QA
- GET `/qa/:prId` — all QA cases for a PR
- PATCH `/qa/:caseId` — update status/notes
- GET `/qa/:prId/export` — download as markdown

---

## Infrastructure & Deployment

### Local development
- Postgres: Docker container on port 5432 (database: `codereview`, user: `codereview`, password: `codereview`)
- Redis: Docker container on port 6379
- API: `bun run dev:api` → localhost:3000
- Worker: `bun run dev:worker` → background process
- Web: `bun run dev:web` → localhost:5173

### Production
- Postgres: Neon (serverless PostgreSQL, free tier: 0.5 GB storage, 100 CU-hours/month)
- Redis: Upstash (serverless Redis, free tier: 500K commands/month)
- API: Railway (always-on service)
- Worker: Railway (separate always-on service — must never sleep)
- Web: Vercel (serverless, free hobby plan)
- Email: Resend (free tier: 3,000 emails/month)

### Key environment variables
```
DATABASE_URL              # Neon connection string (prod) or Docker (local)
REDIS_URL                 # Redis connection string
UPSTASH_REDIS_REST_URL    # Upstash HTTP URL (prod only)
UPSTASH_REDIS_REST_TOKEN  # Upstash token (prod only)
JWT_SECRET                # 32+ char random string
GOOGLE_CLIENT_ID          # Google OAuth app
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL
GEMINI_API_KEY            # Primary LLM
ANTHROPIC_API_KEY         # Fallback LLM
RESEND_API_KEY            # Email sending
RESEND_FROM_EMAIL
GITHUB_APP_ID             # GitHub App
GITHUB_APP_PRIVATE_KEY
GITHUB_WEBHOOK_SECRET
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
API_PORT                  # Default 3000
WEB_URL                   # Frontend URL
API_URL                   # API URL
NODE_ENV
```

---

## Security Considerations

- GitHub webhook payloads are validated with HMAC-SHA256 before processing
- GitHub installation tokens stored AES-256 encrypted in database
- JWT stored in httpOnly cookie (not localStorage)
- OTP codes stored in Redis (never PostgreSQL) and deleted after single use
- User-controlled content sanitised before inclusion in LLM prompts (XML boundary tag stripping)
- Rate limiting on auth endpoints (5 OTP requests per email per 15 minutes)
- All DB queries use Drizzle ORM parameterised queries (no raw SQL with user input)

---

## Current Build Status

Infrastructure is set up. Docker containers running locally (Postgres + Redis both confirmed working). Bun monorepo scaffolded with all workspace packages. Drizzle schema files created for all 11 tables. Next step: run first migration, then build the Hono API server skeleton and auth endpoints.

---

## How to Use This Prompt

Paste this entire document at the start of any conversation with any AI assistant working on MergeMind. This gives the assistant full context on:
- What the product does and why
- Every technology choice and why it was made
- The complete data model
- How the AI agents work (and that they are NOT OpenCode — they are simple TypeScript functions)
- The full API contract
- The deployment architecture

Always tell the assistant which module/feature you are currently working on and what the specific task is.
