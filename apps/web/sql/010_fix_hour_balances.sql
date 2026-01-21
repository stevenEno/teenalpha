-- Fix for hour_balances issues
-- Run this in your Supabase SQL Editor

-- 1. Fix any NULL values in total_used_hours column
UPDATE public.hour_balances
SET total_used_hours = 0
WHERE total_used_hours IS NULL;

-- 2. Fix any NULL values in total_purchased_hours column
UPDATE public.hour_balances
SET total_purchased_hours = balance_hours
WHERE total_purchased_hours IS NULL;

-- 3. Verify the triggers exist and are working
-- Check credit_hours_trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'credit_hours_trigger'
  ) THEN
    RAISE NOTICE 'WARNING: credit_hours_trigger does not exist! Run 007_payments_schema.sql';
  ELSE
    RAISE NOTICE 'credit_hours_trigger exists';
  END IF;
END $$;

-- Check deduct_hours_trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'deduct_hours_trigger'
  ) THEN
    RAISE NOTICE 'WARNING: deduct_hours_trigger does not exist! Run 007_payments_schema.sql';
  ELSE
    RAISE NOTICE 'deduct_hours_trigger exists';
  END IF;
END $$;

-- 4. Verify the functions exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'credit_hours_after_payment'
  ) THEN
    RAISE NOTICE 'WARNING: credit_hours_after_payment function does not exist!';
  ELSE
    RAISE NOTICE 'credit_hours_after_payment function exists';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'deduct_hours_on_session_complete'
  ) THEN
    RAISE NOTICE 'WARNING: deduct_hours_on_session_complete function does not exist!';
  ELSE
    RAISE NOTICE 'deduct_hours_on_session_complete function exists';
  END IF;
END $$;

-- 5. Show current hour_balances for verification
SELECT
  hb.id,
  f.full_name as family_name,
  m.full_name as mentor_name,
  t.full_name as teen_name,
  hb.balance_hours,
  hb.total_purchased_hours,
  hb.total_used_hours
FROM public.hour_balances hb
JOIN public.profiles f ON hb.family_id = f.id
JOIN public.profiles m ON hb.mentor_id = m.id
JOIN public.profiles t ON hb.teen_id = t.id;

-- 6. Show recent payments for verification
SELECT
  p.id,
  f.full_name as family_name,
  p.hours_purchased,
  p.amount / 100.0 as amount_dollars,
  p.status,
  p.created_at
FROM public.payments p
JOIN public.profiles f ON p.family_id = f.id
ORDER BY p.created_at DESC
LIMIT 10;
