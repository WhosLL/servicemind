import { createClient } from '@supabase/supabase-js'

export const maxDuration = 300

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

const SALON_TZ_DEFAULT = 'America/New_York'

function localDateInTZ(date, tz) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
  return fmt.format(date)
}

async function callTriggerAutomation(req, body) {
  const res = await fetch(new URL('/api/trigger-automation', req.url).href, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    },
    body: JSON.stringify(body)
  })
  return res.json().catch(() => ({}))
}

export async function GET(req) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return Response.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const sb = getSb()
    const { data: salons } = await sb
      .from('salons')
      .select('id, slug, shop_name, twilio_phone_number, subscription_status')
      .in('subscription_status', ['active', 'trial', 'trialing'])

    const summary = { salons_processed: 0, salons_skipped: 0, win_back: 0, reminder_24h: 0, errors: [] }
    const tz = SALON_TZ_DEFAULT
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const tomorrowDate = localDateInTZ(tomorrow, tz)
    const todayDate = localDateInTZ(new Date(), tz)

    for (const salon of salons || []) {
      // Skip salons without a Twilio number — nothing they could send anyway
      if (!salon.twilio_phone_number) {
        summary.salons_skipped++
        continue
      }
      summary.salons_processed++

      // Broadcast triggers — guard each one with campaign_runs to prevent same-day re-fires on cron retries.
      // slow_day removed: it currently fires unconditionally; needs real slow-day detection logic before re-enabling.
      // birthday removed: barber doesn't have access to client birthday data, so the campaign would never match anyone.
      for (const trigger_type of ['win_back']) {
        const { error: claimErr } = await sb
          .from('campaign_runs')
          .insert([{ salon_id: salon.id, campaign_type: trigger_type, run_date: todayDate }])
        if (claimErr) {
          // Unique violation == already ran today; skip silently. Other errors logged.
          if (claimErr.code !== '23505') summary.errors.push({ salon: salon.id, trigger_type, error: claimErr.message })
          continue
        }
        const r = await callTriggerAutomation(req, { salon_id: salon.id, trigger_type })
        if (r.success) {
          summary[trigger_type] += r.sent || 0
          await sb.from('campaign_runs').update({ send_count: r.sent || 0 })
            .eq('salon_id', salon.id).eq('campaign_type', trigger_type).eq('run_date', todayDate)
        } else if (r.error) {
          summary.errors.push({ salon: salon.id, trigger_type, error: r.error })
        }
      }

      // 24h reminders — claim atomically before sending so retries don't double-fire.
      const { data: appts } = await sb
        .from('salon_appointments')
        .select('id, client_name, client_phone, service_name, appointment_date, appointment_time')
        .eq('salon_id', salon.id)
        .eq('appointment_date', tomorrowDate)
        .eq('status', 'confirmed')
        .is('reminder_24h_sent_at', null)

      for (const appt of appts || []) {
        if (!appt.client_phone) continue

        // Atomic claim: only proceed if we successfully flipped the dedup column from NULL.
        const { data: claimed } = await sb
          .from('salon_appointments')
          .update({ reminder_24h_sent_at: new Date().toISOString() })
          .eq('id', appt.id)
          .is('reminder_24h_sent_at', null)
          .select('id')
        if (!claimed?.length) continue

        const r = await callTriggerAutomation(req, {
          salon_id: salon.id,
          trigger_type: 'reminder_24h',
          client_phone: appt.client_phone,
          client_name: appt.client_name,
          service_name: appt.service_name,
          booking_date: appt.appointment_date,
          time: appt.appointment_time
        })
        if (r.success) summary.reminder_24h += r.sent || 0
        else if (r.error) summary.errors.push({ salon: salon.id, appt: appt.id, trigger_type: 'reminder_24h', error: r.error })
      }
    }

    return Response.json({ success: true, summary })
  } catch (err) {
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
