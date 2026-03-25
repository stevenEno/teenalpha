# CLAUDE.md — TeenAlpha

## Project
**TeenAlpha** — Ed-tech mentorship platform where teens discover interests (via social media data), connect with mentors, generate AI-powered startup pathways, and earn their first dollar. Steven Eno is the default mentor for every new user (a la MySpace's Tom).

**Domain:** teenalpha.org
**Production:** Vercel

## Tech Stack
- **Monorepo:** npm workspaces + Turborepo
- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript 5 (strict)
- **Styling:** Tailwind CSS 4 + Radix UI + shadcn/ui
- **Animations:** Framer Motion
- **Database/Auth:** Supabase (PostgreSQL + RLS + Auth + Realtime + Storage)
- **AI:** Groq (llama-3.3-70b, primary) + Anthropic Claude (fallback). Configured via `AI_PROVIDER` env var.
- **Payments:** Stripe (checkout sessions, webhooks, mentor hour packages)
- **Testing:** Playwright (E2E)
- **Deployment:** Vercel

## Monorepo Structure
```
teenalpha/
├── apps/
│   ├── web/                  # Next.js web app (main)
│   └── mobile/               # Expo mobile (placeholder)
├── packages/
│   ├── database/             # Supabase client, auth helpers, queries
│   ├── ui/                   # Shared UI components
│   └── utils/                # Shared utilities
├── supabase/
│   └── migrations/           # SQL migration files
├── turbo.json
└── package.json              # npm workspaces root
```

## Commands
```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Turbo production build
npm run web          # Start web app only
npm run lint         # ESLint
```

## Key Routes

### Public (no auth required)
- `/` — Home (redirects to `/dashboard` if authed, `/explore` if not)
- `/explore` — Guest exploration flow (main landing for unauthenticated)
- `/login`, `/signup`, `/forgot-password` — Auth pages
- `/auth/callback` — OAuth/email confirmation callback
- `/m/*` — Mobile-specific routes

### Protected (auth required)
- `/dashboard` — Main hub
- `/dashboard/discover` — Interest discovery
- `/dashboard/incentives/{quests,ladders,tracker}` — Gamification systems
- `/dashboard/sessions` — Mentoring sessions
- `/dashboard/profile/{customize,data}` — MySpace-inspired profile
- `/dashboard/purchase` — Buy mentor hours (Stripe)
- `/messages`, `/messages/[chatId]` — Snapchat-inspired messaging
- `/mentees`, `/mentees/[id]` — Mentor's mentee views
- `/projects/*` — Project management + AI recommendations
- `/family/teen/[id]` — Parent-teen connections
- `/admin/*` — Admin panel (prompts, analytics, mentor recs)
- `/start` — Post-signup onboarding

## Architecture Patterns

### Auth Flow
1. User signs up via `AuthForm.tsx` → Supabase creates user + `profiles` row (role: teen/mentor/parent)
2. Confirmation email → user clicks link → `/auth/callback` exchanges code for session
3. Redirects to `/onboarding` or `/dashboard`
4. Middleware (`apps/web/middleware.ts`) checks `supabase.auth.getUser()` on every request

### Middleware — Known Gotchas
- Skips: static assets, `/api/payments/webhook`, `/api/analytics/track`, `/api/explore/*`
- Has **redirect loop prevention** via referer checking (lines ~112-131)
- Public routes are allowlisted; everything else requires auth
- Authenticated users on auth pages → redirect to `/dashboard`
- **Common bug:** adding a new public route but forgetting to allowlist it in middleware → users get redirected to login

### Database Access
- **Browser:** `createBrowserClient()` from `@teen-alpha/database` (anon key, RLS enforced)
- **Server:** `createServerClient()` (anon key for reads, service role for webhooks only)
- **Queries:** centralized in `packages/database/queries.ts`

### API Routes (not Server Actions)
- Organized by feature: `/api/quests/`, `/api/ladders/`, `/api/messages/`, `/api/profile/`, etc.
- Each route: auth check → validate input → Supabase query → NextResponse
- Stripe webhook at `/api/payments/webhook` — uses service role, skips middleware

### AI Integration
- Quest generation, project recommendations, path exploration, task suggestions
- **Primary:** Groq SDK (`llama-3.3-70b-versatile`) — chosen for speed
- **Fallback:** Anthropic Claude SDK — higher quality but slower
- Switch via `AI_PROVIDER` env var

### Incentive Systems (3 separate mechanics)
| System | Mechanic | Alpha Earned |
|--------|----------|-------------|
| Quests | Daily AI-generated tasks | 1 Alpha/quest |
| Ladders | Group challenges with leaderboards | 5 Alpha/challenge |
| Tracker | Weekly ambition goals | 3 Alpha/goal |
Users assigned to ONE system via `incentive_assignments` table.

### Guest Flow
- `/explore` allows unauthenticated browsing
- Guest data stored in **localStorage** (`guest-storage.ts`)
- Syncs to account post-signup
- **Known bug pattern:** guest data lost if sync fails during signup flow

## Database (Supabase)

### Key Tables
- `profiles` — User profiles with role (teen/mentor/parent/admin)
- `mentorships` — Mentor-teen connections
- `social_media_data` — Parsed Instagram/TikTok/Snapchat zip uploads
- `sessions` / `session_bookings` — Mentoring sessions + Stripe payments
- `quests`, `user_quest_progress` — Daily quest system
- `ladders`, `ladder_members`, `challenges` — Group challenge system
- `ambition_goals`, `daily_tracks` — Ambition tracker
- `chats`, `chat_participants`, `messages` — Messaging (ephemeral, Snapchat-style)
- `profile_customizations`, `profile_unlocks` — MySpace-style theming
- `incentive_assignments`, `incentive_events` — Alpha coin economy

### RLS Patterns in This Project
- User reads/writes own data via `auth.uid() = user_id`
- Mentors read mentee profiles via `EXISTS (SELECT 1 FROM mentorships WHERE ...)`
- Chat participants read messages via participant check
- **CRITICAL:** Never add a policy on a table that subqueries that same table. Use `SECURITY DEFINER` functions for cross-table checks.

### Migrations
Located in `supabase/migrations/`. When adding tables:
1. Create migration file with `YYYYMMDD_description.sql` naming
2. Include `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
3. Add RLS policies in the same migration
4. Test with both anon and authenticated roles

## Environment Variables
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# AI
GROQ_API_KEY
ANTHROPIC_API_KEY
AI_PROVIDER=groq|anthropic

# Stripe
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET

# App
NEXT_PUBLIC_APP_URL

# Optional
STEAM_API_KEY
```

**Common production bug:** deploying without setting `GROQ_API_KEY` or `STRIPE_WEBHOOK_SECRET` in Vercel env vars.

## Recurring Bug Patterns (Watch Out For)
1. **RLS infinite recursion** — Policy on table X queries table X. Use SECURITY DEFINER functions.
2. **Redirect loops** — New route not in middleware's public allowlist. Check `middleware.ts`.
3. **Missing env vars in production** — Always verify Vercel env vars match `.env.local`.
4. **Guest data loss on signup** — localStorage sync can fail. Check `guest-storage.ts`.
5. **Auth pages accessible when logged in** — Middleware should redirect. Check the auth page list.
6. **Social media parser failures** — Instagram/TikTok/Snapchat zip structures change. Validate folder structure before parsing.
7. **Stripe webhook not firing** — Ensure `/api/payments/webhook` is in middleware skip list and `STRIPE_WEBHOOK_SECRET` is set.

## Design Philosophy
- Teen-friendly, not corporate. Snapchat/TikTok energy.
- MySpace-inspired profile customization (themes, widgets, overlays)
- Should NOT look "AI-generated" — warm, human, playful
- Framer Motion for micro-interactions
- Mobile-first (PWA routes at `/m/*`)

## gstack
Use /browse from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.
Available skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /review, /ship, /land-and-deploy, /canary, /benchmark, /browse,
/qa, /qa-only, /design-review, /setup-browser-cookies, /setup-deploy, /retro,
/investigate, /document-release, /codex, /cso, /autoplan, /careful, /freeze, /guard,
/unfreeze, /gstack-upgrade.
