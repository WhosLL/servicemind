// Subscription status helpers. Used by /api/send-sms to gate outbound sends
// and by the dashboard to render the trial countdown / upgrade prompt.

// A salon can send SMS only while the subscription is healthy. This is the
// single source of truth — everything else (UI, gating, cron) calls through.
//
// Healthy =
//   subscription_status in ('active', 'trialing')
//   OR subscription_status == 'trial' AND trial_ends_at is in the future
//
// Anything else (pending_payment, past_due, canceled, expired, trial with
// trial_ends_at in the past) is blocked.
export function canSendSms(salon) {
  if (!salon) return false
  const status = String(salon.subscription_status || '').toLowerCase()
  if (status === 'active' || status === 'trialing') return true
  if (status === 'trial') {
    if (!salon.trial_ends_at) return false
    return new Date(salon.trial_ends_at).getTime() > Date.now()
  }
  return false
}

// Human-readable reason for the dashboard ("Trial ends in 12 days",
// "Payment past due", etc.). Returns { state, message, daysLeft }.
export function subscriptionLabel(salon) {
  if (!salon) return { state: 'unknown', message: 'No subscription found' }
  const status = String(salon.subscription_status || '').toLowerCase()

  if (status === 'active') {
    return { state: 'active', message: 'Subscription active' }
  }
  if (status === 'trialing' || (status === 'trial' && salon.trial_ends_at)) {
    const ms = new Date(salon.trial_ends_at).getTime() - Date.now()
    const days = Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)))
    if (days <= 0) return { state: 'trial_expired', message: 'Trial ended — add a payment method to continue', daysLeft: 0 }
    return { state: 'trialing', message: `Trial ends in ${days} day${days === 1 ? '' : 's'}`, daysLeft: days }
  }
  if (status === 'pending_payment') {
    return { state: 'pending_payment', message: 'Finish signup — add a payment method to start your free trial' }
  }
  if (status === 'past_due') {
    return { state: 'past_due', message: 'Payment past due — update your card' }
  }
  if (status === 'canceled' || status === 'cancelled') {
    return { state: 'canceled', message: 'Subscription canceled' }
  }
  return { state: 'unknown', message: `Status: ${status || 'unknown'}` }
}
