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

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return Response.json({ error: 'invalid id' }, { status: 400 })
  }

  const { data: salon, error } = await getSb()
    .from('salons')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!salon) return Response.json({ error: 'not found' }, { status: 404 })

  // Privacy gate: self-signup customer data is never visible to admins/reps.
  if (salon.created_via === 'self_signup') {
    return Response.json({ error: 'Customer data is private. Self-signup accounts cannot be viewed.' }, { status: 403 })
  }

  // Ownership gate: caller must be the creator OR an admin (admins manage reps' books).
  const callerProfile = await getProfile(auth.user.id)
  const isCallerAdmin = callerProfile?.role === 'admin'
  const isCallerCreator = salon.created_by_user_id === auth.user.id
  if (!isCallerAdmin && !isCallerCreator) {
    return Response.json({ error: 'Not your shop.' }, { status: 403 })
  }

  return Response.json({ salon })
}
