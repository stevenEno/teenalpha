# TODOS — TeenAlpha

## Infrastructure

- [x] **Restore TeenAlpha Supabase dev project** — done 2026-04-13.
- [ ] **Fold legacy `apps/web/sql/` files into PRODUCTION_MIGRATION.sql.** PRODUCTION_MIGRATION claims to set up a fresh DB but is missing several legacy migrations: `011_visual_onboarding.sql` (adds `profiles.onboarding_interest`, `onboarding_completed_at`, `onboarding_alpha_awarded`, plus `alpha_awards` and `guest_onboarding_sessions` tables), `create_teen_discover_rls.sql`, `fix_rls_incentive_tables.sql`. Audit `apps/web/sql/00*` against PRODUCTION_MIGRATION and fold every missing CREATE/ALTER/POLICY in. Otherwise next fresh-DB setup will silently miss columns that runtime code reads (caught 2026-04-13 when teen dashboard treated parent-enrolled teen as a new user because `onboarding_interest` column was absent).

## Design system migration (opened by /design-review 2026-04-12)

The foundation (globals.css tokens + Plus Jakarta Sans) is now aligned to DESIGN.md,
and 3 major surfaces (dashboard, sprint landing, explore, SprintWidget, sprint detail)
have been rewritten to the warm-orange/teal/money-green palette. The remaining 170+
purple/indigo/violet Tailwind arbitrary-color usages across these components still
need a pass:

### High priority (critical user-facing surfaces)
- [ ] **`apps/web/components/onboarding/QuickStartFlow.tsx`** — purple gradients at lines 151, 153, 161, 188, 209, 253, 281, 328, 411. First thing new teens see. Swap to orange.
- [ ] **`apps/web/components/layout/Header.tsx`** — purple references. Site-wide header; high visibility.
- [ ] **`apps/web/app/dashboard/discover/page.tsx`** — purple references on the AI discovery flow.

### Medium priority (feature surfaces)
- [ ] **`apps/web/components/projects/ProjectRecommendations.tsx`** — purple references on project cards.
- [ ] **`apps/web/components/profile/StartupPathways.tsx`** — purple on pathway explanation.
- [ ] **`apps/web/components/incentives/CalendarHeatmap.tsx`** — entire heatmap defined in purple at lines 11-14. Swap to orange gradient.
- [ ] **`apps/web/components/messaging/TeenCard.tsx`** — gradient backgrounds for interest/ladder/gaming badges. Replace with orange-tinted variants.
- [ ] **`apps/web/components/explore/PathDetailCard.tsx:23`** — pathway card gradients (violet/purple/teal).

### Lower priority
- [ ] **`apps/web/components/admin/AdminDashboard.tsx`** — admin surface, internal users only.
- [ ] **Radius hierarchy sweep** — 525 `rounded-*` instances codebase-wide. DESIGN.md specifies sm 4 / md 8 / lg 12 / xl 16 / full. Normalize `rounded-xl` on 40px icon containers → `rounded-lg`, progress bars → `rounded-md`, etc.
- [ ] **SQL seed data** — `apps/web/sql/002_mentor_workflow.sql:78,107` and `PRODUCTION_MIGRATION.sql:552` contain "Welcome to Teen Alpha..." default welcome messages. DESIGN.md flags this as anti-pattern copy. Rewrite to lead with specific outcome.
- [ ] **Dark-theme cards on app pages** — audit `apps/web/app/dashboard/profile/data/page.tsx` and similar for `bg-black`, `bg-gray-900`, `text-white` usage; DESIGN.md says authenticated app pages must be light-only.

### Display font
- [ ] **Load Cabinet Grotesk** — DESIGN.md specifies Cabinet Grotesk as the display font, but it is not on Google Fonts. Add font files to `apps/web/public/fonts/` (buy license from Fontshare or Indian Type Foundry) and load via `next/font/local` in `apps/web/app/layout.tsx`. Wire `--font-display` and add a Tailwind `font-display` utility for h1/h2 hero text.

Re-run `/design-review` after browse binary is rebuilt (`gstack-upgrade`) and Codex is
re-authenticated (`codex login`) to capture live screenshots + adversarial third opinion.

---
