# TODOS — TeenAlpha

## Done 2026-04-14 (afternoon session)
- [x] Profile route consolidation — `/dashboard/profile` redirects to `/profile`.
- [x] Color sweep — 8 high-traffic components + 7 app-route pages + AdminDashboard now DESIGN.md-clean (zero purple/indigo/violet/pink Tailwind classes across user-facing + admin code).
- [x] SQL seed copy — replaced "Welcome to Teen Alpha" defaults with specific outcome-led copy.
- [x] Dark-theme audit on app pages — no actual violations found.
- [x] PRODUCTION_MIGRATION fold — sections 20-29 added, all legacy `apps/web/sql/` and `supabase/migrations/` files folded in. Single fresh-DB run now produces a fully code-ready schema.
- [x] Radius hierarchy — `--radius-sm/md/lg/xl` tokens in globals.css now match DESIGN.md exactly (4 / 8 / 12 / 16 px). All ~525 `rounded-*` instances auto-resolve to spec.

## Blocked

- [x] **Load Cabinet Grotesk display font** — done 2026-04-14. Variable .woff2 from Fontshare, loaded via `next/font/local`, applied to hero h1/h2 across `/sprint`, `/sprint/success`, `/dashboard`, `/dashboard/sprint/[id]`, `/dashboard/pick-project`, `/profile`.

- [ ] **Live `/design-review` rerun** — gated on `gstack-upgrade` to restore the corrupt browse binary, plus `codex login` to refresh expired auth. Will catch any residual visual issues + give an adversarial third opinion against the live deployed site.

---

## Future — Stripe 2026 Integration (from Sessions 2026 research)

- [ ] **Parent-linked Connect Express account** — Stripe Connect + Networked Onboarding. Parent's KYC covers teen's seller account. Enables real Seller Wallets for teen earnings. Effort: M.
- [ ] **Stripe Workflows for payment notifications** — auto-notify teen + parent on sale, update First Dollar Tracker, emit activity feed event. GA feature. Effort: S.
- [ ] **TeenAlpha prepaid debit card** — Stripe Issuing (Consumer Debit preview). Physical card where teen earnings accumulate. Viral artifact. Effort: L. Waitlist/preview.
- [ ] **Agent-discoverable projects** — Agentic Commerce Suite for Platforms. Teen projects sellable through ChatGPT/Gemini. Effort: M. Requires agent-ready catalog upload.
- [ ] **Stablecoin payouts to UnpluggedMint** — Stripe Stablecoin Financial Accounts. Teen earns USD, receives as USDC in their UnpluggedMint wallet. Cross-product synergy. Effort: L. Requires UnpluggedMint ready.
- [ ] **Startup Micro-Challenges** — real companies from the Map post weekly challenges. Teens compete, winners get tours/intros. Requires startup partnerships + engaged user base. Effort: L.
- [ ] **Obsidian → app automation** — Obsidian Git plugin syncs vault to GitHub, daily cron ingests new insight .md files into insights table. Effort: M.
