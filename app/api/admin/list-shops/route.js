import { createClient } from '@supabase/supabase-js'

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

async function requireAdmin(req) {
  const authHeader = req.headers.get('authorization') || ''
  if (!authHeader.startsWith('Bearer ')) return { ok: false, status: 401, error: 'Unauthorized' }
  const token = authHeader.replace('Bearer ', '')
  const sb = getSb()
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return { ok: false, status: 401, error: 'Invalid session' }
  const allowed = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
  if (allowed.length === 0) return { ok: false, status: 500, error: 'ADMIN_USER_IDS not configured' }
  if (!allowed.includes(user.id)) return { ok: false, status: 403, error: 'Forbidden' }
  return { ok: true }
}

export async function GET(req) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

  const sb = getSb()
  const { data, error } = await sb
    .from('salons')
    .select('id, slug, shop_name, owner_name, email, phone, personal_phone, city, state, twilio_phone_number, subscription_status, subscription_tier, trial_ends_at, created_at, user_id, onboarded')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ shops: data || [] })
}
