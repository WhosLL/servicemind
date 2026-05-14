// POST /api/billing/checkout-session
// Creates a Stripe Checkout Session for buying SMS credit. On completion, the
// webhook at /api/billing/webhook credits the salon's balance.

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

const MIN_TOPUP_CENTS = 500     // $5.00
const MAX_TOPUP_CENTS = 100000  // $1000.00

async function stripeReq(path, params, method = 'POST') {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured')
  const body = new URLSearchParams()
  const flatten = (obj, prefix = '') => {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}[${k}]` : k
      if (v === null || v === undefined) continue
      if (typeof v === 'object') flatten(v, key)
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
    const { salon_id, amount_cents } = await req.json()

    if (!salon_id) {
      return Response.json({ error: 'salon_id required' }, { status: 400 })
    }
    const amt = Number.parseInt(amount_cents, 10)
    if (!Number.isFinite(amt) || amt < MIN_TOPUP_CENTS || amt > MAX_TOPUP_CENTS) {
      return Response.json({
        error: `Amount must be between $${MIN_TOPUP_CENTS / 100} and $${MAX_TOPUP_CENTS / 100}`,
      }, { status: 400 })
    }

    // Auth: user must own this salon.
    const authHeader = req.headers.get('authorization') || ''
    if (!authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authErr } = await sb.auth.getUser(token)
    if (authErr || !user) return Response.json({ error: 'Invalid session' }, { status: 401 })

    const { data: salon } = await sb
      .from('salons')
      .select('id, user_id, shop_name, stripe_customer_id')
      .eq('id', salon_id)
      .eq('user_id', user.id)
      .single()
    if (!salon) return Response.json({ error: 'Salon not found' }, { status: 404 })

    // Ensure salon has a Stripe customer.
    let customerId = salon.stripe_customer_id
    if (!customerId) {
      const customer = await stripeReq('customers', {
        email: user.email,
        name: salon.shop_name,
        metadata: { salon_id: salon.id, user_id: user.id },
      })
      customerId = customer.id
      await sb.from('salons').update({ stripe_customer_id: customerId }).eq('id', salon.id)
    }

    const origin = req.headers.get('origin') || 'https://servicemind.io'
    const session = await stripeReq('checkout/sessions', {
      mode: 'payment',
      customer: customerId,
      line_items: [{
        price_data: {
          currency: 'usd',
          product: process.env.STRIPE_PRODUCT_SMS_CREDIT || 'prod_UW8mSZEZOUhYtb',
          unit_amount: amt,
          tax_behavior: 'inclusive',
        },
        quantity: 1,
      }],
      success_url: `${origin}/dashboard?topup=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard?topup=cancel`,
      metadata: {
        salon_id: salon.id,
        intent: 'sms_credit_topup',
        amount_cents: String(amt),
      },
      payment_intent_data: {
        metadata: {
          salon_id: salon.id,
          intent: 'sms_credit_topup',
          amount_cents: String(amt),
        },
      },
    })

    return Response.json({ checkout_url: session.url, session_id: session.id })
  } catch (err) {
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
