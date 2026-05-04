import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '../../../../lib/auth-admin'

let _sb
function getSb() {
  if (!_sb) {
    _sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }
  return _sb
}

export async function GET(req) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

  const sb = getSb()

  const { data: rows, error } = await sb
    .from('commissions')
    .select(`
      id,
      rep_user_id,
      salon_id,
      payment_event_ref,
      gross_amount_cents,
      commission_rate,
      commission_amount_cents,
      status,
      earned_at,
      paid_at,
      notes,
      salons:salon_id (shop_name, slug),
      profiles:rep_user_id (display_name)
    `)
    .order('earned_at', { ascending: false })
    .limit(500)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const totals = (rows || []).reduce((acc, r) => {
    if (r.status === 'paid') acc.paid_cents += r.commission_amount_cents
    else if (r.status === 'owed') acc.owed_cents += r.commission_amount_cents
    else if (r.status === 'pending') acc.pending_cents += r.commission_amount_cents
    return acc
  }, { paid_cents: 0, owed_cents: 0, pending_cents: 0 })

  const { data: reps } = await sb
    .from('profiles')
    .select('id, display_name, role')
    .in('role', ['rep', 'admin'])

  return Response.json({
    rows: rows || [],
    totals,
    reps: reps || [],
  })
}
