import { requireAdmin } from '../../../../lib/auth-admin'

export async function GET(req) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })
  return Response.json({ success: true, admin: true })
}
