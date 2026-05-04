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
  const { data, error } = await sb
    .from('salons')
    .select('id, slug, shop_name, owner_name, email, phone, personal_phone, city, state, twilio_phone_number, subscription_status, subscription_tier, trial_ends_at, created_at, user_id, onboarded, is_pilot, created_by_user_id, commission_rate, created_via')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ shops: data || [] })
}
