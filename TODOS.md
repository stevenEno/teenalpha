# TODOS — TeenAlpha

## Done 2026-04-14 (afternoon session)
- [x] Profile route consolidation — `/dashboard/profile` redirects to `/profile`.
- [x] Color sweep — 8 high-traffic components + 7 app-route pages + AdminDashboard now DESIGN.md-clean (zero purple/indigo/violet/pink Tailwind classes across user-facing + admin code).
- [x] SQL seed copy — replaced "Welcome to Teen Alpha" defaults with specific outcome-led copy.
- [x] Dark-theme audit on app pages — no actual violations found.
- [x] PRODUCTION_MIGRATION fold — sections 20-29 added, all legacy `apps/web/sql/` and `supabase/migrations/` files folded in. Single fresh-DB run now produces a fully code-ready schema.
- [x] Radius hierarchy — `--radius-sm/md/lg/xl` tokens in globals.css now match DESIGN.md exactly (4 / 8 / 12 / 16 px). All ~525 `rounded-*` instances auto-resolve to spec.

## Blocked

- [ ] **Load Cabinet Grotesk display font** — DESIGN.md spec, not on Google Fonts. Requires font license (Fontshare or Indian Type Foundry) and `.woff2` files in `apps/web/public/fonts/`. Once files are present: load via `next/font/local` in `apps/web/app/layout.tsx`, wire `--font-display`, expose a Tailwind `font-display` utility for h1/h2 hero text. Until then, body text uses Plus Jakarta Sans which already covers display weights acceptably.

- [ ] **Live `/design-review` rerun** — gated on `gstack-upgrade` to restore the corrupt browse binary, plus `codex login` to refresh expired auth. Will catch any residual visual issues + give an adversarial third opinion against the live deployed site.

---
