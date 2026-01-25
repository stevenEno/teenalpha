# Teen Alpha Production Deployment Guide

This guide walks you through deploying Teen Alpha to production with:
- **Hosting**: Vercel
- **Domain**: teenalpha.org (Squarespace)
- **Database**: Supabase
- **Payments**: Stripe

---

## Prerequisites

- [ ] Vercel account (vercel.com)
- [ ] Supabase account with production project (supabase.com)
- [ ] Stripe account (stripe.com)
- [ ] Access to Squarespace domain settings for teenalpha.org
- [ ] Anthropic API key for AI features (console.anthropic.com)

---

## Step 1: Supabase Production Setup

### 1.1 Create Production Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Set project name: `teenalpha-production`
5. Set a strong database password (save this!)
6. Choose a region close to your users (e.g., `us-east-1`)
7. Click "Create new project"

### 1.2 Get Supabase Credentials

Once the project is ready, go to **Settings → API** and copy:

```
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]  # Keep this secret!
```

### 1.3 Run Database Migrations

1. Go to **SQL Editor** in your Supabase dashboard
2. Run the consolidated migration file: `sql/PRODUCTION_MIGRATION.sql`
3. Verify tables were created by checking **Table Editor**

### 1.4 Configure Authentication

1. Go to **Authentication → URL Configuration**
2. Set **Site URL**: `https://teenalpha.org`
3. Add **Redirect URLs**:
   - `https://teenalpha.org/auth/callback`
   - `https://www.teenalpha.org/auth/callback`
   - `https://teenalpha.org/**`

4. Go to **Authentication → Providers**
5. Enable **Email** provider (enabled by default)
6. Optional: Configure Google, GitHub, etc.

### 1.5 Configure Email Templates (Optional)

Go to **Authentication → Email Templates** and customize:
- Confirmation email
- Password reset email
- Magic link email

---

## Step 2: Stripe Production Setup

### 2.1 Activate Stripe Account

1. Go to [stripe.com](https://stripe.com) and sign in
2. Complete account activation (requires business details)
3. Toggle from "Test mode" to "Live mode" in the dashboard

### 2.2 Get Stripe Credentials

In **Live mode**, go to **Developers → API keys**:

```
STRIPE_SECRET_KEY=sk_live_[your-key]
STRIPE_PUBLISHABLE_KEY=pk_live_[your-key]
```

### 2.3 Create Webhook Endpoint

1. Go to **Developers → Webhooks**
2. Click "Add endpoint"
3. Set URL: `https://teenalpha.org/api/payments/webhook`
4. Select events to listen:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
5. Click "Add endpoint"
6. Copy the **Signing secret**:

```
STRIPE_WEBHOOK_SECRET=whsec_[your-webhook-secret]
```

---

## Step 3: Vercel Deployment

### 3.1 Connect Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import your Git repository (GitHub/GitLab/Bitbucket)
4. Select the `teenalpha` repository

### 3.2 Configure Project Settings

1. **Framework Preset**: Next.js (auto-detected)
2. **Root Directory**: `apps/web` (if monorepo)
3. **Build Command**: `npm run build` or `next build`
4. **Output Directory**: `.next` (default)

### 3.3 Set Environment Variables

In Vercel project settings, add these environment variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[project].supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://teenalpha.org` | Production |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Production |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Production |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Production |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Production |
| `STEAM_API_KEY` | `[optional]` | Production |

### 3.4 Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Your app will be live at `[project-name].vercel.app`

---

## Step 4: Domain Configuration (Squarespace → Vercel)

### 4.1 Add Domain in Vercel

1. Go to your Vercel project → **Settings → Domains**
2. Add domain: `teenalpha.org`
3. Add domain: `www.teenalpha.org`
4. Vercel will show required DNS records

### 4.2 Configure DNS in Squarespace

1. Log in to Squarespace
2. Go to **Settings → Domains → teenalpha.org → DNS Settings**
3. Remove any existing A or CNAME records for the root domain

4. Add these DNS records:

**For root domain (teenalpha.org):**
```
Type: A
Host: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Host: www
Value: cname.vercel-dns.com
```

### 4.3 Verify Domain

1. Wait 5-15 minutes for DNS propagation
2. In Vercel, check that domains show "Valid Configuration"
3. SSL certificates are automatically provisioned

### 4.4 Set Primary Domain

1. In Vercel Domains settings
2. Set `teenalpha.org` as primary (redirects www → non-www)
3. Or set `www.teenalpha.org` as primary based on preference

---

## Step 5: Post-Deployment Checklist

### 5.1 Verify Authentication

- [ ] Sign up with a new account works
- [ ] Email confirmation is received
- [ ] Login/logout works correctly
- [ ] Password reset works

### 5.2 Verify Payments

- [ ] Test a real payment with a small amount
- [ ] Webhook receives events (check Stripe dashboard)
- [ ] Hours are credited after payment
- [ ] Session completion deducts hours

### 5.3 Verify Core Features

- [ ] Teen onboarding flow works
- [ ] Social media upload and analysis works
- [ ] Startup pathways generation works
- [ ] Project creation works
- [ ] Mentor-teen relationships work
- [ ] Parent-teen connections work

### 5.4 Create Admin Account

Run this SQL in Supabase to make yourself admin:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### 5.5 Set Up Default Mentor

Ensure Steven Eno (or your default mentor) exists:

```sql
-- Check if default mentor exists
SELECT * FROM profiles WHERE is_default_mentor = true;

-- If not, update an existing mentor account
UPDATE profiles
SET is_default_mentor = true, role = 'mentor'
WHERE email = 'steven@example.com';
```

---

## Environment Variables Reference

### Required Variables

```bash
# Supabase (from Supabase dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App URL
NEXT_PUBLIC_APP_URL=https://teenalpha.org

# Stripe (from Stripe dashboard → Developers → API keys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI (from Anthropic console)
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Optional Variables

```bash
# Steam API (for gaming profile integration)
STEAM_API_KEY=your-steam-api-key
```

---

## Troubleshooting

### Domain Not Working

1. Check DNS propagation: https://dnschecker.org
2. Verify Vercel shows "Valid Configuration"
3. Wait up to 48 hours for full propagation

### Webhook Not Receiving Events

1. Check Stripe webhook dashboard for failures
2. Verify webhook URL is correct
3. Check Vercel function logs for errors
4. Ensure `STRIPE_WEBHOOK_SECRET` matches

### Authentication Issues

1. Verify Supabase Site URL matches your domain
2. Check redirect URLs include your domain
3. Clear browser cookies and try again

### Database Errors

1. Check Supabase logs in dashboard
2. Verify RLS policies are correct
3. Run the fix migration: `sql/010_fix_hour_balances.sql`

---

## Security Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is only in server-side code
- [ ] No secrets exposed in client-side code
- [ ] RLS policies enabled on all tables
- [ ] Stripe webhook signature verification enabled
- [ ] HTTPS enforced on all endpoints
- [ ] Rate limiting configured (Vercel handles this)

---

## Monitoring

### Vercel
- **Analytics**: Enable in project settings
- **Logs**: View in Functions tab
- **Alerts**: Set up in Notifications

### Supabase
- **Database**: Monitor in Dashboard → Database
- **Auth**: Monitor in Dashboard → Authentication
- **Logs**: View in Dashboard → Logs

### Stripe
- **Payments**: Monitor in Payments tab
- **Webhooks**: Check webhook logs
- **Reports**: View in Reports tab

---

## Rollback Plan

If deployment fails:

1. **Vercel**: Redeploy previous commit from Deployments tab
2. **Database**: Restore from Supabase automatic backups
3. **DNS**: Revert to previous DNS settings in Squarespace

---

## Support

- Vercel: https://vercel.com/docs
- Supabase: https://supabase.com/docs
- Stripe: https://stripe.com/docs
- Next.js: https://nextjs.org/docs
