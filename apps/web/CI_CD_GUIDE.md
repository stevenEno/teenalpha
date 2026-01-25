# Teen Alpha CI/CD & Development Workflow Guide

This guide covers the recommended workflow for developing locally, testing changes, and deploying to production safely.

---

## Table of Contents

1. [Environment Setup](#1-environment-setup)
2. [Git Branching Strategy](#2-git-branching-strategy)
3. [Local Development](#3-local-development)
4. [Database Migration Strategy](#4-database-migration-strategy)
5. [Preview Deployments](#5-preview-deployments)
6. [Production Deployments](#6-production-deployments)
7. [Recommended Workflow](#7-recommended-workflow)
8. [GitHub Actions (Optional)](#8-github-actions-optional)

---

## 1. Environment Setup

### Three Environments

| Environment | Purpose | Database | URL |
|-------------|---------|----------|-----|
| **Local** | Development | Supabase Dev Project | localhost:3000 |
| **Preview** | Testing PRs | Supabase Dev Project | *.vercel.app |
| **Production** | Live users | Supabase Prod Project | teenalpha.org |

### Create Two Supabase Projects

1. **Development Project**: `teenalpha-dev`
   - Used for local development and preview deployments
   - Safe to experiment and reset data

2. **Production Project**: `teenalpha-production`
   - Used only for production
   - Handle with care!

### Local Environment File

Create `.env.local` for local development:

```bash
# .env.local (DO NOT COMMIT)

# Development Supabase Project
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...dev-service-key

# Local URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe TEST mode keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...test-webhook-secret

# Anthropic (same key for dev/prod is fine)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Optional
STEAM_API_KEY=...
```

---

## 2. Git Branching Strategy

### Branch Structure

```
main (production)
  │
  ├── develop (staging/integration)
  │     │
  │     ├── feature/user-auth
  │     ├── feature/payment-flow
  │     ├── fix/login-bug
  │     └── ...
  │
  └── hotfix/critical-bug (emergency fixes)
```

### Branch Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/description` | `feature/teen-onboarding` |
| Bug Fix | `fix/description` | `fix/payment-webhook` |
| Hotfix | `hotfix/description` | `hotfix/auth-crash` |
| Refactor | `refactor/description` | `refactor/api-routes` |
| Docs | `docs/description` | `docs/deployment-guide` |

### Branch Rules

- **main**: Protected, requires PR review, auto-deploys to production
- **develop**: Integration branch, auto-deploys to preview
- **feature/***: Individual features, creates preview deployments

---

## 3. Local Development

### Daily Workflow

```bash
# 1. Start your day - sync with remote
git checkout develop
git pull origin develop

# 2. Create a feature branch
git checkout -b feature/my-new-feature

# 3. Start the dev server
npm run dev

# 4. Make changes and test locally
# ... code, code, code ...

# 5. Commit frequently with clear messages
git add .
git commit -m "Add user onboarding flow"

# 6. Push to remote (creates preview deployment)
git push origin feature/my-new-feature

# 7. Create PR when ready
# Go to GitHub and create PR: feature/my-new-feature → develop
```

### Local Testing Checklist

Before pushing, verify:

- [ ] App runs without errors (`npm run dev`)
- [ ] TypeScript compiles (`npm run build` or `npx tsc --noEmit`)
- [ ] Lint passes (`npm run lint`)
- [ ] Key features still work (manual testing)
- [ ] New features work as expected

---

## 4. Database Migration Strategy

### Golden Rule

> **Never run untested migrations directly on production.**

### Migration Workflow

```
1. Write migration SQL
       ↓
2. Test on LOCAL (dev Supabase project)
       ↓
3. Commit migration file to git
       ↓
4. Test on PREVIEW deployment
       ↓
5. PR merged to main
       ↓
6. Run migration on PRODUCTION Supabase
       ↓
7. Deploy code to production
```

### Migration File Naming

```
sql/
├── PRODUCTION_MIGRATION.sql    # Initial setup (already run)
├── migrations/
│   ├── 2024-01-15_add_user_preferences.sql
│   ├── 2024-01-20_add_notification_settings.sql
│   └── 2024-02-01_update_session_schema.sql
```

### Migration Template

```sql
-- Migration: [Description]
-- Date: YYYY-MM-DD
-- Author: [Your Name]
--
-- ROLLBACK INSTRUCTIONS:
-- [How to undo this migration if needed]
-- ============================================

-- Check if migration already applied (idempotent)
DO $$
BEGIN
  -- Your migration code here

  -- Example: Add column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'new_column'
  ) THEN
    ALTER TABLE profiles ADD COLUMN new_column TEXT;
  END IF;

  RAISE NOTICE 'Migration completed successfully';
END $$;
```

### Applying Migrations

```bash
# Local/Dev: Run in Supabase SQL Editor (dev project)
# Preview: Same dev project, should already be applied
# Production: Run in Supabase SQL Editor (prod project) BEFORE deploying code
```

---

## 5. Preview Deployments

Vercel automatically creates preview deployments for every push/PR.

### How It Works

```
Push to feature/xyz
       ↓
Vercel builds automatically
       ↓
Preview URL: teenalpha-xyz-123.vercel.app
       ↓
Test your changes
       ↓
Share URL for review
```

### Configure Preview Environment

In Vercel Project Settings → Environment Variables:

1. Set variables for **Preview** environment:
   - Use your **DEV** Supabase credentials
   - Use **TEST** Stripe keys
   - This keeps preview deployments safe

```
Environment: Preview
NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
STRIPE_SECRET_KEY=sk_test_...
```

### Preview Deployment Checklist

- [ ] Build succeeds (check Vercel dashboard)
- [ ] App loads without errors
- [ ] Test the specific feature you changed
- [ ] Check browser console for errors
- [ ] Test on mobile viewport

---

## 6. Production Deployments

### Deployment Flow

```
feature branch
       ↓ (PR + Review)
develop branch
       ↓ (PR + Review)
main branch
       ↓ (Auto-deploy)
Production (teenalpha.org)
```

### Pre-Production Checklist

Before merging to `main`:

- [ ] All tests pass on preview deployment
- [ ] Code reviewed by team (if applicable)
- [ ] Database migrations applied to production Supabase
- [ ] Environment variables updated (if new ones added)
- [ ] No console errors or warnings
- [ ] Feature tested end-to-end
- [ ] Rollback plan ready (if major change)

### Production Deployment Steps

```bash
# 1. Ensure develop is up to date
git checkout develop
git pull origin develop

# 2. Create PR: develop → main
# Go to GitHub, create PR

# 3. If migrations needed, run on PRODUCTION Supabase first
# Go to Supabase dashboard (production project) → SQL Editor
# Run your migration SQL

# 4. Merge the PR
# Vercel auto-deploys to production

# 5. Verify deployment
# - Check https://teenalpha.org
# - Test critical flows (login, signup, payments)
# - Monitor Vercel logs for errors
```

### Rollback Procedure

If something goes wrong:

```bash
# Option 1: Revert via Vercel Dashboard
# Go to Vercel → Deployments → Find last working deployment → "..." → "Promote to Production"

# Option 2: Git revert
git checkout main
git revert HEAD  # Reverts last commit
git push origin main
# Vercel auto-deploys the revert
```

---

## 7. Recommended Workflow

### Daily Development Cycle

```
┌─────────────────────────────────────────────────────────────┐
│                     DAILY WORKFLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Morning:                                                   │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────┐      │
│  │ git pull │ → │ checkout │ → │ feature/branch   │      │
│  │ develop  │    │ -b       │    │                  │      │
│  └──────────┘    └──────────┘    └──────────────────┘      │
│                                                             │
│  During Day:                                                │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────┐      │
│  │  Code    │ → │  Test    │ → │  Commit often    │      │
│  │          │    │ locally  │    │                  │      │
│  └──────────┘    └──────────┘    └──────────────────┘      │
│                                                             │
│  End of Day / Feature Complete:                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────┐      │
│  │  Push    │ → │  Create  │ → │  Review Preview  │      │
│  │          │    │  PR      │    │  Deployment      │      │
│  └──────────┘    └──────────┘    └──────────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Release Cycle

```
┌─────────────────────────────────────────────────────────────┐
│                     RELEASE WORKFLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────┐                                             │
│  │ Features   │ ──┐                                         │
│  │ complete   │   │                                         │
│  └────────────┘   │    ┌────────────┐    ┌────────────┐    │
│                   ├──→ │  develop   │ ──→│   main     │    │
│  ┌────────────┐   │    │  (staging) │    │(production)│    │
│  │ Bug fixes  │ ──┘    └────────────┘    └────────────┘    │
│  │ ready      │              │                  │          │
│  └────────────┘              ↓                  ↓          │
│                         Preview URL      teenalpha.org     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Quick Commands Reference

```bash
# Start new feature
git checkout develop && git pull && git checkout -b feature/name

# Save progress
git add . && git commit -m "Description"

# Push for preview
git push origin feature/name

# Update feature branch with latest develop
git checkout feature/name
git fetch origin
git rebase origin/develop

# Ready for review
# Create PR on GitHub: feature/name → develop

# Merge to staging
# Merge PR on GitHub (after review)

# Deploy to production
# Create PR: develop → main
# Run any migrations on prod Supabase
# Merge PR on GitHub
```

---

## 8. GitHub Actions (Optional)

For automated testing on every PR, create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    defaults:
      run:
        working-directory: apps/web

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: apps/web/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  # Optional: Add more jobs for E2E tests, etc.
```

### Setting Up GitHub Secrets

Go to GitHub Repository → Settings → Secrets → Actions:

Add these secrets (use DEV values for CI):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Summary: The Complete Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        COMPLETE CI/CD FLOW                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   LOCAL                    GITHUB                   VERCEL          │
│  ─────────                ────────                 ────────         │
│                                                                     │
│  ┌─────────┐   push    ┌──────────┐   trigger   ┌──────────┐       │
│  │ Develop │ ────────→ │ feature/ │ ──────────→ │ Preview  │       │
│  │ locally │           │ branch   │             │ Deploy   │       │
│  └─────────┘           └──────────┘             └──────────┘       │
│       │                      │                        │             │
│       │                      │ PR                     │ test        │
│       │                      ↓                        ↓             │
│       │                ┌──────────┐             ┌──────────┐       │
│       │                │ develop  │             │ Preview  │       │
│       │                │ branch   │ ──────────→ │ Deploy   │       │
│       │                └──────────┘             └──────────┘       │
│       │                      │                        │             │
│       │                      │ PR                     │ test        │
│       │                      ↓                        ↓             │
│  ┌─────────┐           ┌──────────┐             ┌──────────┐       │
│  │Run DB   │ ←──────── │   main   │ ──────────→ │Production│       │
│  │migration│  before   │ branch   │   deploy    │ Deploy   │       │
│  │on prod  │  merge    └──────────┘             └──────────┘       │
│  └─────────┘                                          │             │
│                                                       ↓             │
│                                               teenalpha.org         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference Card

### Commands

| Action | Command |
|--------|---------|
| Start feature | `git checkout develop && git pull && git checkout -b feature/name` |
| Save work | `git add . && git commit -m "message"` |
| Push | `git push origin feature/name` |
| Update branch | `git fetch && git rebase origin/develop` |
| Local dev | `npm run dev` |
| Type check | `npx tsc --noEmit` |
| Build test | `npm run build` |

### URLs

| Environment | URL |
|-------------|-----|
| Local | http://localhost:3000 |
| Preview | [auto-generated].vercel.app |
| Production | https://teenalpha.org |

### Dashboards

| Service | URL |
|---------|-----|
| Vercel | https://vercel.com/dashboard |
| Supabase (Dev) | https://supabase.com/dashboard |
| Supabase (Prod) | https://supabase.com/dashboard |
| Stripe | https://dashboard.stripe.com |
| GitHub | https://github.com/[your-repo] |

---

## Troubleshooting

### Build Fails on Vercel

1. Check build logs in Vercel dashboard
2. Run `npm run build` locally to reproduce
3. Check for missing environment variables
4. Verify TypeScript errors with `npx tsc --noEmit`

### Preview Works but Production Doesn't

1. Check production environment variables
2. Verify production database has latest migrations
3. Check Vercel function logs for errors

### Database Migration Issues

1. Always test migrations on dev first
2. Make migrations idempotent (can run multiple times safely)
3. Keep rollback SQL ready for critical changes

---

*Last updated: January 2025*
