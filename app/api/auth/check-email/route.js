import { createClient } from '@supabase/supabase-js'

let _supabaseAdmin
function getAdmin() {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      const missing = [!url && 'NEXT_PUBLIC_SUPABASE_URL', !key && 'SUPABASE_SERVICE_ROLE_KEY'].filter(Boolean).join(', ')
      throw new Error(`Server misconfigured: ${missing} not set.`)
    }
    _supabaseAdmin = createClient(url, key)
  }
  return _supabaseAdmin
}

export async function POST(req) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return Response.json({ error: 'Email required' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const supabaseAdmin = getAdmin()
    const normEmail = email.trim().toLowerCase()

    // Check auth.users via admin listUsers (filter client-side; Supabase doesn't expose a direct lookup by email)
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 })
    if (error) {
      return Response.json({ error: 'Lookup failed' }, { status: 500 })
    }
    const exists = (data?.users || []).some(u => (u.email || '').toLowerCase() === normEmail)

    return Response.json({ exists })
  } catch (e) {
    return Response.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}
