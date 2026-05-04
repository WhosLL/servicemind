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

function envAdminUserIds() {
  return (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
}

export async function getAuthedUser(req) {
  const authHeader = req.headers.get('authorization') || ''
  if (!authHeader.startsWith('Bearer ')) return { ok: false, status: 401, error: 'Unauthorized' }
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await getSb().auth.getUser(token)
  if (error || !user) return { ok: false, status: 401, error: 'Invalid session' }
  return { ok: true, user }
}

export async function getProfile(userId) {
  if (!userId) return null
  const { data, error } = await getSb()
    .from('profiles')
    .select('id, role, compensation_plan, base_salary_monthly_cents, default_commission_rate, display_name')
    .eq('id', userId)
    .maybeSingle()
  if (error) return null
  return data
}

export async function isAdmin(userId) {
  if (!userId) return false
  const profile = await getProfile(userId)
  if (profile?.role === 'admin') return true
  return envAdminUserIds().includes(userId)
}

export async function isAdminOrRep(userId) {
  if (!userId) return false
  const profile = await getProfile(userId)
  return profile?.role === 'admin' || profile?.role === 'rep'
}

export async function requireAdmin(req) {
  const auth = await getAuthedUser(req)
  if (!auth.ok) return auth
  const env = envAdminUserIds()
  if (env.length === 0 && !(await getProfile(auth.user.id))) {
    return { ok: false, status: 500, error: 'ADMIN_USER_IDS not configured and no profiles' }
  }
  if (!(await isAdmin(auth.user.id))) {
    return { ok: false, status: 403, error: 'Forbidden' }
  }
  return { ok: true, user: auth.user }
}

export async function requireAdminOrRep(req) {
  const auth = await getAuthedUser(req)
  if (!auth.ok) return auth
  if (!(await isAdminOrRep(auth.user.id))) {
    return { ok: false, status: 403, error: 'Forbidden' }
  }
  return { ok: true, user: auth.user }
}
