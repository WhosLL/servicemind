// POST /api/billing/webhook
// Stripe webhook receiver. Handles checkout.session.completed to credit a
// salon's SMS balance after a successful top-up payment.

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

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

function verifyStripeSignature(rawBody, sigHeader, secret) {
  if (!sigHeader || !secret) return false
  const parts = Object.fromEntries(
    sigHeader.split(',').map(p => p.split('=', 2))
  )
  const ts = parts.t
  const sig = parts.v1
  if (!ts || !sig) return false

  // 5 min replay window
  const age = Math.floor(Date.now() / 1000) - Number(ts)
  if (Math.abs(age) > 300) return false

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${ts}.${rawBody}`)
    .digest('hex')

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
}

export async function POST(req) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature') || ''
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!secret) {
    return new Response('Webhook secret not configured', { status: 500 })
  }
  if (!verifyStripeSignature(rawBody, sig, secret)) {
    return new Response('Invalid signature', { status: 400 })
  }

  let event
  try {
    event = JSON.parse(rawBody)
  } catch {
    return new Response('Invalid payload', { status: 400 })
  }

  const sb = getSb()

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object
      const salonId = session?.metadata?.salon_id
      const intent = session?.metadata?.intent
      const amountCents = Number.parseInt(session?.metadata?.amount_cents || session?.amount_total, 10)

      if (intent !== 'sms_credit_topup' || !salonId || !Number.isFinite(amountCents) || amountCents <= 0) {
        // Not a credit top-up — ignore silently
        return Response.json({ received: true, skipped: 'not_a_topup' })
      }

      // Use the Stripe session id as the dedup key. grant_sms_credit handles
      // the (source='topup', reference_id) idempotency check.
      const { data, error } = await sb.rpc('grant_sms_credit', {
        p_salon_id: salonId,
        p_amount_cents: amountCents,
        p_source: 'topup',
        p_reference_id: session.id,
      })
      if (error) throw new Error(error.message)
      const row = Array.isArray(data) ? data[0] : data

      return Response.json({
        received: true,
        salon_id: salonId,
        amount_cents: amountCents,
        balance_after_cents: row?.balance_after_cents,
        was_duplicate: row?.was_duplicate,
      })
    }

    // Other event types: acknowledge, don't process
    return Response.json({ received: true, skipped: event.type })
  } catch (err) {
    console.error('Webhook handler error:', err)
    return new Response(err.message || 'Webhook handler error', { status: 500 })
  }
}
