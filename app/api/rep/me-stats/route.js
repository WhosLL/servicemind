import { createClient } from '@supabase/supabase-js'
import { requireAdminOrRep, getProfile } from '../../../../lib/auth-admin'

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
  const auth = await requireAdminOrRep(req)
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

  const sb = getSb()
  const profile = await getProfile(auth.user.id)

  const { data: shops } = await sb
    .from('salons')
    .select('id, slug, shop_name, owner_name, city, state, twilio_phone_number, subscription_status, trial_ends_at, created_at, commission_rate, is_pilot, created_via')
    .eq('created_by_user_id', auth.user.id)
    .order('created_at', { ascending: false })

  const { data: commissions } = await sb
    .from('commissions')
    .select('commission_amount_cents, status')
    .eq('rep_user_id', auth.user.id)

  const totals = (commissions || []).reduce((acc, c) => {
    if (c.status === 'paid') acc.paid_cents += c.commission_amount_cents
    else if (c.status === 'owed') acc.owed_cents += c.commission_amount_cents
    else if (c.status === 'pending') acc.pending_cents += c.commission_amount_cents
    return acc
  }, { paid_cents: 0, owed_cents: 0, pending_cents: 0 })

  return Response.json({
    profile: {
      user_id: auth.user.id,
      email: auth.user.email,
      display_name: profile?.display_name || null,
      role: profile?.role || 'unknown',
      compensation_plan: profile?.compensation_plan || null,
      default_commission_rate: profile?.default_commission_rate ?? 0,
      base_salary_monthly_cents: profile?.base_salary_monthly_cents ?? null,
    },
    shops: shops || [],
    totals,
  })
}
