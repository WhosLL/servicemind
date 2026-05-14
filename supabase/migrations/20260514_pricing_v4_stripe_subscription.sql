-- Pricing v4 — $30/mo subscription with 30-day trial, card upfront.
--
-- Adds:
--   salons.stripe_customer_id      — Stripe Customer object link
--   salons.stripe_subscription_id  — Stripe Subscription object link
--
-- subscription_status, subscription_tier, trial_ends_at already exist on
-- salons and are reused. New possible values for subscription_status:
--   'pending_payment'  — salon row exists, awaiting Stripe Checkout completion
--   'trial'            — payment method on file, in 30-day trial (existing)
--   'trialing'         — Stripe's term for the same; both accepted
--   'active'           — paying customer (existing)
--   'past_due'         — payment failed, retry in progress
--   'canceled'         — sub canceled by owner or by us

BEGIN;

ALTER TABLE salons
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

CREATE INDEX IF NOT EXISTS idx_salons_stripe_customer_id ON salons (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_salons_stripe_subscription_id ON salons (stripe_subscription_id);

COMMIT;
