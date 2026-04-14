# TODOS — TeenAlpha

## Done 2026-04-14
- [x] Profile route consolidation — `/dashboard/profile` redirects to `/profile`.
- [x] Color sweep — 8 high-traffic components + 7 app-route pages now DESIGN.md-clean (zero purple/indigo/violet/pink Tailwind classes).
- [x] SQL seed copy — replaced "Welcome to Teen Alpha" defaults with specific outcome-led copy.
- [x] Dark-theme audit on app pages — no actual violations found; leftover color drift cleaned in same pass.

## Infrastructure
- [x] Restore TeenAlpha Supabase dev project — done 2026-04-13.
- [ ] **Fold legacy `apps/web/sql/` files into PRODUCTION_MIGRATION.sql.** PRODUCTION_MIGRATION claims to set up a fresh DB but is missing several legacy migrations: `011_visual_onboarding.sql` (adds `profiles.onboarding_interest`, `onboarding_completed_at`, `onboarding_alpha_awarded`, plus `alpha_awards` and `guest_onboarding_sessions` tables), `create_teen_discover_rls.sql`, `fix_rls_incentive_tables.sql`, and `20260413_mentor_calendly_url.sql` (calendly_url column). Audit `apps/web/sql/00*` and `supabase/migrations/` against PRODUCTION_MIGRATION and fold every missing CREATE/ALTER/POLICY in. Otherwise next fresh-DB setup will silently miss columns runtime code reads (caught 2026-04-13 when teen dashboard treated parent-enrolled teen as a new user because `onboarding_interest` was absent).

## Design system migration — remaining

### Larger sweeps
- [ ] **Radius hierarchy sweep** — 525 `rounded-*` instances codebase-wide. DESIGN.md specifies sm 4 / md 8 / lg 12 / xl 16 / full. Normalize per-context: 40px icon containers → `rounded-lg`, progress bars → `rounded-md`, etc. Judgment-heavy; defer until live `/design-review` browser is back so each change can be visually verified.
- [ ] **AdminDashboard.tsx** — admin surface, internal users only. Lower priority than user-facing.

### Display font
- [ ] **Load Cabinet Grotesk** — DESIGN.md display font, not on Google Fonts. Buy license from Fontshare or Indian Type Foundry, drop files into `apps/web/public/fonts/`, load via `next/font/local` in `apps/web/app/layout.tsx`. Wire `--font-display` and add a Tailwind `font-display` utility for h1/h2 hero text.

## Tooling
- [ ] **Re-run `/design-review` against live browser** once `gstack-upgrade` restores the browse binary and Codex auth is refreshed (`codex login`). Will catch any residual visual issues + give an adversarial third opinion.

---
