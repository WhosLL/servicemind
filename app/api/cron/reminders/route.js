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

// "2:30 PM", "2:30PM", or "14:30" → minutes since midnight
function parseTime24(t) {
  if (!t) return null
  const cleaned = t.toUpperCase().replace(/\s+/g, '')
  const ampm = cleaned.match(/^(\d{1,2}):?(\d{2})?(AM|PM)$/)
  if (ampm) {
    let h = Number(ampm[1])
    const m = Number(ampm[2] || 0)
    if (ampm[3] === 'PM' && h !== 12) h += 12
    if (ampm[3] === 'AM' && h === 12) h = 0
    return h * 60 + m
  }
  const h24 = cleaned.match(/^(\d{1,2}):(\d{2})$/)
  if (h24) return Number(h24[1]) * 60 + Number(h24[2])
  return null
}

function localTodayAndMinutesInTZ(date, tz) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  })
  const parts = fmt.formatToParts(date)
  const get = (t) => parts.find(p => p.type === t)?.value
  const dateStr = `${get('year')}-${get('month')}-${get('day')}`
  const minutes = Number(get('hour')) * 60 + Number(get('minute'))
  return { dateStr, minutes }
}

function nextDayDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
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
    const tz = SALON_TZ_DEFAULT
    const { dateStr: localToday, minutes: nowMins } = localTodayAndMinutesInTZ(new Date(), tz)

    // Window: appointments starting between (now + 30 min) and (now + 90 min) in salon-local time.
    // Window may cross midnight; if so, also pull tomorrow's appts and offset their parsed minutes by +1440.
    const windowStart = nowMins + 30
    const windowEnd = nowMins + 90
    const crossesMidnight = windowEnd >= 1440

    const datesToQuery = crossesMidnight ? [localToday, nextDayDate(localToday)] : [localToday]

    const { data: appts } = await sb
      .from('salon_appointments')
      .select('id, salon_id, client_name, client_phone, service_name, appointment_date, appointment_time')
      .in('appointment_date', datesToQuery)
      .eq('status', 'confirmed')
      .is('reminder_1h_sent_at', null)

    const summary = { scanned: appts?.length || 0, sent: 0, errors: [] }

    for (const appt of appts || []) {
      if (!appt.client_phone) continue
      const apptMins = parseTime24(appt.appointment_time)
      if (apptMins == null) continue

      const adjustedMins = appt.appointment_date === localToday ? apptMins : apptMins + 1440
      if (adjustedMins < windowStart || adjustedMins > windowEnd) continue

      // Atomic claim
      const { data: claimed } = await sb
        .from('salon_appointments')
        .update({ reminder_1h_sent_at: new Date().toISOString() })
        .eq('id', appt.id)
        .is('reminder_1h_sent_at', null)
        .select('id')
      if (!claimed?.length) continue

      const r = await callTriggerAutomation(req, {
        salon_id: appt.salon_id,
        trigger_type: 'reminder_1h',
        client_phone: appt.client_phone,
        client_name: appt.client_name,
        service_name: appt.service_name,
        booking_date: appt.appointment_date,
        time: appt.appointment_time
      })
      if (r.success) summary.sent += r.sent || 0
      else if (r.error) summary.errors.push({ appt: appt.id, error: r.error })
    }

    return Response.json({ success: true, summary })
  } catch (err) {
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
