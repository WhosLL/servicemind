-- Pricing v3 — usage-based billing. SMS credit balance + ledger + atomic
-- debit/grant functions + Stripe customer link.
--
-- Adds:
--   salons.sms_credit_balance_cents   — current balance in integer cents
--   salons.stripe_customer_id         — Stripe Customer link (NULL until first top-up)
--   sms_credit_transactions           — append-only ledger of all credit movements
--   debit_sms_credit()                — atomic deduct + ledger insert
--   grant_sms_credit()                — atomic add + ledger insert (idempotent on
--                                       starter_grant and on (topup, reference_id))
--
-- Backfills: $5 starter credit (500 cents) for every existing salon without one.

BEGIN;

ALTER TABLE salons
  ADD COLUMN IF NOT EXISTS sms_credit_balance_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE TABLE IF NOT EXISTS sms_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  source TEXT NOT NULL,
  reference_id TEXT,
  balance_after_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_credit_transactions_salon
  ON sms_credit_transactions (salon_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_credit_transactions_source
  ON sms_credit_transactions (source);

-- Atomic debit. Returns success=false if balance insufficient.
CREATE OR REPLACE FUNCTION debit_sms_credit(
  p_salon_id UUID,
  p_amount_cents INTEGER,
  p_source TEXT,
  p_reference_id TEXT DEFAULT NULL
) RETURNS TABLE (success BOOLEAN, balance_after_cents INTEGER) AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE salons
    SET sms_credit_balance_cents = sms_credit_balance_cents - p_amount_cents
    WHERE id = p_salon_id AND sms_credit_balance_cents >= p_amount_cents
    RETURNING sms_credit_balance_cents INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RETURN QUERY SELECT FALSE,
      COALESCE((SELECT sms_credit_balance_cents FROM salons WHERE id = p_salon_id), 0);
    RETURN;
  END IF;

  INSERT INTO sms_credit_transactions (salon_id, amount_cents, source, reference_id, balance_after_cents)
    VALUES (p_salon_id, -p_amount_cents, p_source, p_reference_id, v_new_balance);

  RETURN QUERY SELECT TRUE, v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic grant. Idempotent on starter_grant (one per salon ever) and on
-- (topup, reference_id) so duplicate webhook fires don't double-credit.
CREATE OR REPLACE FUNCTION grant_sms_credit(
  p_salon_id UUID,
  p_amount_cents INTEGER,
  p_source TEXT,
  p_reference_id TEXT DEFAULT NULL
) RETURNS TABLE (success BOOLEAN, balance_after_cents INTEGER, was_duplicate BOOLEAN) AS $$
DECLARE
  v_new_balance INTEGER;
  v_existing INTEGER;
BEGIN
  IF p_source = 'starter_grant' THEN
    SELECT 1 INTO v_existing FROM sms_credit_transactions
      WHERE salon_id = p_salon_id AND source = 'starter_grant' LIMIT 1;
    IF FOUND THEN
      RETURN QUERY SELECT FALSE,
        COALESCE((SELECT sms_credit_balance_cents FROM salons WHERE id = p_salon_id), 0),
        TRUE;
      RETURN;
    END IF;
  END IF;

  IF p_source = 'topup' AND p_reference_id IS NOT NULL THEN
    SELECT 1 INTO v_existing FROM sms_credit_transactions
      WHERE source = 'topup' AND reference_id = p_reference_id LIMIT 1;
    IF FOUND THEN
      RETURN QUERY SELECT FALSE,
        COALESCE((SELECT sms_credit_balance_cents FROM salons WHERE id = p_salon_id), 0),
        TRUE;
      RETURN;
    END IF;
  END IF;

  UPDATE salons
    SET sms_credit_balance_cents = sms_credit_balance_cents + p_amount_cents
    WHERE id = p_salon_id
    RETURNING sms_credit_balance_cents INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, FALSE;
    RETURN;
  END IF;

  INSERT INTO sms_credit_transactions (salon_id, amount_cents, source, reference_id, balance_after_cents)
    VALUES (p_salon_id, p_amount_cents, p_source, p_reference_id, v_new_balance);

  RETURN QUERY SELECT TRUE, v_new_balance, FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill: $5 starter credit for every existing salon without one.
WITH eligible AS (
  SELECT s.id FROM salons s
  WHERE NOT EXISTS (
    SELECT 1 FROM sms_credit_transactions t
    WHERE t.salon_id = s.id AND t.source = 'starter_grant'
  )
),
updated AS (
  UPDATE salons
    SET sms_credit_balance_cents = sms_credit_balance_cents + 500
    WHERE id IN (SELECT id FROM eligible)
    RETURNING id, sms_credit_balance_cents
)
INSERT INTO sms_credit_transactions (salon_id, amount_cents, source, balance_after_cents)
SELECT id, 500, 'starter_grant', sms_credit_balance_cents FROM updated;

COMMIT;
