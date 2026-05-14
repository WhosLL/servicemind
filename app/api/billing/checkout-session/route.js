// POST /api/billing/checkout-session
// Creates a Stripe Checkout Session for the $30/mo subscription with 30-day
// trial. After completion the webhook at /api/billing/webhook fills in the
// salon's stripe_customer_id, stripe_subscription_id, and subscription_status.

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

async function stripeReq(path, params, method = 'POST') {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured')
  const body = new URLSearchParams()
  const flatten = (obj, prefix = '') => {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}[${k}]` : k
      if (v === null || v === undefined) continue
      if (typeof v === 'object' && !Array.isArray(v)) flatten(v, key)
      else if (Array.isArray(v)) v.forEach((item, i) => {
        if (typeof item === 'object') flatten(item, `${key}[${i}]`)
        else body.append(`${key}[${i}]`, String(item))
      })
      else body.append(key, String(v))
    }
  }
  if (params) flatten(params)
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: method === 'GET' ? undefined : body,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || `Stripe ${res.status}`)
  return data
}

export async function POST(req) {
  try {
    const sb = getSb()
    const { salon_id } = await req.json()

    if (!salon_id) {
      return Response.json({ error: 'salon_id required' }, { status: 400 })
    }

    // Auth: user must own this salon. (Or a service-role internal call from
    // the signup flow can pass CRON_SECRET — keep symmetric with other routes.)
    const authHeader = req.headers.get('authorization') || ''
    if (!authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const isCron = process.env.CRON_SECRET && token === process.env.CRON_SECRET

    let user = null
    if (!isCron) {
      const { data: { user: u }, error: authErr } = await sb.auth.getUser(token)
      if (authErr || !u) return Response.json({ error: 'Invalid session' }, { status: 401 })
      user = u
      const { data: ownership } = await sb.from('salons').select('id').eq('id', salon_id).eq('user_id', user.id).single()
      if (!ownership) return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: salon } = await sb
      .from('salons')
      .select('id, shop_name, email, stripe_customer_id, stripe_subscription_id, subscription_status')
      .eq('id', salon_id)
      .single()
    if (!salon) return Response.json({ error: 'Salon not found' }, { status: 404 })

    // If already actively subscribed, send them to a billing portal instead.
    if (salon.stripe_subscription_id && (salon.subscription_status === 'active' || salon.subscription_status === 'trialing' || salon.subscription_status === 'trial')) {
      const origin = req.headers.get('origin') || 'https://servicemind.io'
      const portal = await stripeReq('billing_portal/sessions', {
        customer: salon.stripe_customer_id,
        return_url: `${origin}/dashboard`,
      })
      return Response.json({ checkout_url: portal.url, kind: 'portal' })
    }

    // Ensure salon has a Stripe customer.
    let customerId = salon.stripe_customer_id
    if (!customerId) {
      const customer = await stripeReq('customers', {
        email: salon.email || user?.email,
        name: salon.shop_name,
        metadata: { salon_id: salon.id },
      })
      customerId = customer.id
      await sb.from('salons').update({ stripe_customer_id: customerId }).eq('id', salon.id)
    }

    const priceId = process.env.STRIPE_PRICE_MONTHLY
    if (!priceId) throw new Error('STRIPE_PRICE_MONTHLY not configured')

    const origin = req.headers.get('origin') || 'https://servicemind.io'
    const session = await stripeReq('checkout/sessions', {
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 30,
        metadata: { salon_id: salon.id },
      },
      // Card required upfront so the trial converts cleanly at day 31.
      payment_method_collection: 'always',
      success_url: `${origin}/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard?subscription=cancel`,
      metadata: { salon_id: salon.id, intent: 'monthly_subscription' },
    })

    return Response.json({ checkout_url: session.url, session_id: session.id, kind: 'checkout' })
  } catch (err) {
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
