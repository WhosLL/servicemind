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

export async function GET(req) {
  const authHeader = req.headers.get('authorization') || ''
  if (!authHeader.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = authHeader.replace('Bearer ', '')
  const sb = getSb()
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return Response.json({ error: 'Invalid session' }, { status: 401 })

  const allowed = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
  if (allowed.length === 0) return Response.json({ error: 'ADMIN_USER_IDS not configured' }, { status: 500 })
  if (!allowed.includes(user.id)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  return Response.json({ success: true, admin: true })
}
