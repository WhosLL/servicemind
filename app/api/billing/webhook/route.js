// POST /api/billing/webhook
// Stripe webhook receiver. Handles subscription lifecycle to keep
// salons.subscription_status + stripe_subscription_id in sync.

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

  const age = Math.floor(Date.now() / 1000) - Number(ts)
  if (Math.abs(age) > 300) return false

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${ts}.${rawBody}`)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  } catch {
    return false
  }
}

// Map Stripe's status terms to ours. Stripe uses 'trialing'; we accept both
// 'trialing' and 'trial' in our gate (see lib/subscription.js).
function stripeStatusToOurs(stripeStatus) {
  if (stripeStatus === 'trialing') return 'trialing'
  if (stripeStatus === 'active') return 'active'
  if (stripeStatus === 'past_due' || stripeStatus === 'unpaid') return 'past_due'
  if (stripeStatus === 'canceled' || stripeStatus === 'incomplete_expired') return 'canceled'
  return stripeStatus
}

async function syncSubscription(sb, sub) {
  const salonId = sub.metadata?.salon_id
  if (!salonId) return { skipped: 'no_salon_id_in_metadata' }

  const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null

  const update = {
    stripe_customer_id: sub.customer,
    stripe_subscription_id: sub.id,
    subscription_status: stripeStatusToOurs(sub.status),
  }
  if (trialEnd) update.trial_ends_at = trialEnd

  const { error } = await sb.from('salons').update(update).eq('id', salonId)
  if (error) throw new Error(`Failed to sync subscription: ${error.message}`)

  return { salon_id: salonId, status: update.subscription_status, trial_ends_at: trialEnd }
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
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const result = await syncSubscription(sb, event.data.object)
        return Response.json({ received: true, type: event.type, ...result })
      }

      case 'checkout.session.completed': {
        // Onboarding signup completion: the subscription is created server-side
        // by Stripe and arrives as customer.subscription.created right after,
        // so the heavy lifting happens there. We just acknowledge here.
        const session = event.data.object
        return Response.json({
          received: true,
          type: event.type,
          salon_id: session?.metadata?.salon_id,
          subscription_id: session?.subscription,
        })
      }

      default:
        return Response.json({ received: true, skipped: event.type })
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return new Response(err.message || 'Webhook handler error', { status: 500 })
  }
}
