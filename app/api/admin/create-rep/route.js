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

export async function POST(req) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

  try {
    const body = await req.json()
    const {
      email,
      password,
      display_name,
      compensation_plan = 'residual_only',
      default_commission_rate = 0.50,
      base_salary_monthly_cents = null,
    } = body

    if (!email?.trim() || !password) {
      return Response.json({ error: 'Email and password are required.' }, { status: 400 })
    }
    if (typeof password !== 'string' || password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Please enter a valid email.' }, { status: 400 })
    }
    if (!['residual_only', 'salary_plus_commission'].includes(compensation_plan)) {
      return Response.json({ error: 'Invalid compensation_plan.' }, { status: 400 })
    }
    const rate = Number(default_commission_rate)
    if (Number.isNaN(rate) || rate < 0 || rate > 1) {
      return Response.json({ error: 'default_commission_rate must be between 0 and 1.' }, { status: 400 })
    }
    let salaryCents = null
    if (compensation_plan === 'salary_plus_commission') {
      salaryCents = Number(base_salary_monthly_cents)
      if (Number.isNaN(salaryCents) || salaryCents < 0) {
        return Response.json({ error: 'base_salary_monthly_cents must be >= 0 for salary plan.' }, { status: 400 })
      }
    }

    const sb = getSb()
    const normEmail = email.trim().toLowerCase()

    const { data: authData, error: authError } = await sb.auth.admin.createUser({
      email: normEmail,
      password,
      email_confirm: true,
    })
    if (authError) {
      return Response.json({ error: authError.message || 'Failed to create rep auth user.' }, { status: 400 })
    }

    const userId = authData.user.id

    // Trigger created the profile row with role='owner'. Promote it to rep + set comp.
    const { error: profileError } = await sb
      .from('profiles')
      .update({
        role: 'rep',
        compensation_plan,
        base_salary_monthly_cents: salaryCents,
        default_commission_rate: rate,
        display_name: display_name?.trim() || null,
      })
      .eq('id', userId)

    if (profileError) {
      // Roll back auth user so we don't leave an orphan
      await sb.auth.admin.deleteUser(userId)
      return Response.json({ error: 'Failed to set rep profile: ' + profileError.message }, { status: 500 })
    }

    return Response.json({
      success: true,
      user_id: userId,
      email: normEmail,
      display_name: display_name?.trim() || null,
      compensation_plan,
      default_commission_rate: rate,
      base_salary_monthly_cents: salaryCents,
      // Echo password back so leed can copy + share with the rep out-of-band
      generated_password: password,
    })
  } catch (err) {
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
