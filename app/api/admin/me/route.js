import { requireAdmin, getProfile } from '../../../../lib/auth-admin'

export async function GET(req) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

  const profile = await getProfile(auth.user.id)
  return Response.json({
    user_id: auth.user.id,
    email: auth.user.email,
    role: profile?.role || 'unknown',
    display_name: profile?.display_name || null,
    default_commission_rate: profile?.default_commission_rate ?? 0,
    compensation_plan: profile?.compensation_plan || null,
  })
}
