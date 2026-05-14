// SMS credit helpers — atomic balance ops via Supabase RPC.
// See supabase/migrations/20260514_pricing_v3_credit_ledger.sql for the
// underlying schema + functions.

export const COST_PER_SMS_CENTS = 5
export const STARTER_GRANT_CENTS = 500

// Read-only balance check. Returns integer cents or null on error.
export async function getBalance(sb, salonId) {
  const { data, error } = await sb
    .from('salons')
    .select('sms_credit_balance_cents')
    .eq('id', salonId)
    .single()
  if (error || !data) return null
  return data.sms_credit_balance_cents ?? 0
}

// Atomic debit. Returns { success, balanceAfterCents }.
// success=false means insufficient balance (no DB state change occurred).
export async function debitCredit(sb, salonId, amountCents, source, referenceId = null) {
  const { data, error } = await sb.rpc('debit_sms_credit', {
    p_salon_id: salonId,
    p_amount_cents: amountCents,
    p_source: source,
    p_reference_id: referenceId,
  })
  if (error) return { success: false, balanceAfterCents: 0, error: error.message }
  const row = Array.isArray(data) ? data[0] : data
  return {
    success: !!row?.success,
    balanceAfterCents: row?.balance_after_cents ?? 0,
  }
}

// Atomic grant. Returns { success, balanceAfterCents, wasDuplicate }.
// wasDuplicate=true means idempotency skipped the grant (already applied).
export async function grantCredit(sb, salonId, amountCents, source, referenceId = null) {
  const { data, error } = await sb.rpc('grant_sms_credit', {
    p_salon_id: salonId,
    p_amount_cents: amountCents,
    p_source: source,
    p_reference_id: referenceId,
  })
  if (error) return { success: false, balanceAfterCents: 0, wasDuplicate: false, error: error.message }
  const row = Array.isArray(data) ? data[0] : data
  return {
    success: !!row?.success,
    balanceAfterCents: row?.balance_after_cents ?? 0,
    wasDuplicate: !!row?.was_duplicate,
  }
}

// Display helper: cents → "$X.XX"
export function formatCents(cents) {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents || 0)
  return `${sign}$${(abs / 100).toFixed(2)}`
}
