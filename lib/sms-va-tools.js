// SMS Virtual Assistant — tool definitions + executors.
// Used by /api/sms/incoming to give the Claude receptionist the ability to
// actually book / reschedule / cancel via tool-use, instead of only chatting.

// ----- Tool definitions sent to Claude -----

export const SMS_VA_TOOLS = [
  {
    name: 'get_services',
    description: 'Get the list of services this shop offers, including price and duration. Use this when the customer asks what services are available, or before booking to look up service_id and pricing.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_shop_hours',
    description: 'Get the shop hours so you can tell the customer when the shop is open or check if a date is open.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'lookup_availability',
    description: 'Look up open appointment slots on a given date. Returns the list of available start times (HH:MM, 24-hr) for an appointment of the given duration. Use this BEFORE confirming a booking time with the customer.',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'The date the customer wants, in YYYY-MM-DD format. Translate "today", "tomorrow", "this Friday" etc to a real date based on the current date in the salon\'s timezone (America/New_York).' },
        duration_minutes: { type: 'integer', description: 'How long the appointment will take. Look this up from get_services first if you do not know.' },
      },
      required: ['date', 'duration_minutes'],
    },
  },
  {
    name: 'find_my_appointment',
    description: 'Look up the customer\'s upcoming appointments. Use this when they want to reschedule or cancel and you don\'t already know which appointment they mean.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'book_appointment',
    description: 'Confirm and create an appointment for the customer. ONLY call this after you have (1) confirmed the service, date, and time with the customer, (2) verified the slot is available via lookup_availability, and (3) have the customer\'s name. The customer\'s phone is already known (it\'s the number they\'re texting from).',
    input_schema: {
      type: 'object',
      properties: {
        service_id: { type: 'string', description: 'The id of the service from get_services. Required.' },
        appointment_date: { type: 'string', description: 'YYYY-MM-DD' },
        appointment_time: { type: 'string', description: 'HH:MM (24-hr, salon local time)' },
        client_name: { type: 'string', description: 'The customer\'s name as they gave it to you' },
      },
      required: ['service_id', 'appointment_date', 'appointment_time', 'client_name'],
    },
  },
  {
    name: 'reschedule_appointment',
    description: 'Move an existing appointment to a new date/time. Verify the new slot is available via lookup_availability first.',
    input_schema: {
      type: 'object',
      properties: {
        appointment_id: { type: 'string', description: 'The appointment id from find_my_appointment' },
        new_date: { type: 'string', description: 'YYYY-MM-DD' },
        new_time: { type: 'string', description: 'HH:MM (24-hr, salon local time)' },
      },
      required: ['appointment_id', 'new_date', 'new_time'],
    },
  },
  {
    name: 'cancel_appointment',
    description: 'Cancel an existing appointment. Confirm with the customer first.',
    input_schema: {
      type: 'object',
      properties: {
        appointment_id: { type: 'string', description: 'The appointment id from find_my_appointment' },
      },
      required: ['appointment_id'],
    },
  },
]

// ----- Helpers -----

function cleanPhoneForSms(raw) {
  let p = (raw || '').trim().replace(/[^0-9+]/g, '')
  if (!p) return null
  if (!p.startsWith('+')) {
    p = p.length === 10 ? '+1' + p : p.startsWith('1') ? '+' + p : '+' + p
  }
  return p
}

async function sendSms({ to, from, body, salon_id, trigger_type, sb }) {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token || !to || !from) return false
  const auth = Buffer.from(`${sid}:${token}`).toString('base64')
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
  try {
    await fetch(twilioUrl, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ To: to, From: from, Body: body }),
    })
    if (sb) {
      await sb.from('sms_log').insert([{
        salon_id, to_phone: to, from_phone: from,
        message: body, trigger_type, status: 'sent'
      }])
    }
    return true
  } catch {
    return false
  }
}

function parseHoursForDate(salonHours, dateStr) {
  if (!salonHours) return null
  const hours = typeof salonHours === 'string' ? JSON.parse(salonHours) : salonHours
  // dateStr is YYYY-MM-DD; figure out the day of week
  const d = new Date(dateStr + 'T12:00:00')
  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const key = dayKeys[d.getDay()]
  const today = hours[key]
  if (!today || !today.open || !today.close) return null
  return { open: today.open, close: today.close }
}

function timeStrToMinutes(t) {
  if (!t) return null
  const [h, m] = String(t).split(':').map(n => parseInt(n, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

function minutesToTimeStr(m) {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

function formatTimeFriendly(t) {
  // "14:30" → "2:30 PM"
  const [h, m] = String(t).split(':').map(n => parseInt(n, 10))
  if (Number.isNaN(h)) return t
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m || 0).padStart(2, '0')} ${period}`
}

function formatDateFriendly(dateStr) {
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

// ----- Tool executors -----

async function tool_get_services({ sb, salon }) {
  const { data, error } = await sb
    .from('salon_services')
    .select('id, name, price, duration_minutes, category, is_addon')
    .eq('salon_id', salon.id)
    .eq('is_active', true)
    .order('sort_order')
  if (error) return { error: error.message }
  return { services: (data || []).map(s => ({
    id: s.id,
    name: s.name,
    price: Number(s.price) || 0,
    duration_minutes: s.duration_minutes,
    category: s.category,
    is_addon: s.is_addon,
  })) }
}

async function tool_get_shop_hours({ salon }) {
  if (!salon.hours) return { hours: null, message: 'Shop hours are not configured.' }
  const hours = typeof salon.hours === 'string' ? JSON.parse(salon.hours) : salon.hours
  return { hours }
}

async function tool_lookup_availability({ sb, salon }, { date, duration_minutes }) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'date must be YYYY-MM-DD' }
  const dur = Number(duration_minutes) || 30

  const dayHours = parseHoursForDate(salon.hours, date)
  if (!dayHours) return { available_slots: [], message: 'Shop is closed that day.' }

  const openMin = timeStrToMinutes(dayHours.open)
  const closeMin = timeStrToMinutes(dayHours.close)
  if (openMin == null || closeMin == null || closeMin <= openMin) {
    return { available_slots: [], message: 'Hours misconfigured for that day.' }
  }

  // Existing appointments that day
  const { data: appts } = await sb
    .from('salon_appointments')
    .select('appointment_time, service_name')
    .eq('salon_id', salon.id)
    .eq('appointment_date', date)
    .neq('status', 'cancelled')

  // Best-effort duration lookup per existing appt — fall back to 30 if unknown
  const blocked = []
  for (const a of (appts || [])) {
    const start = timeStrToMinutes(a.appointment_time)
    if (start == null) continue
    blocked.push({ start, end: start + 30 }) // conservative; we don't store duration on the appointment
  }

  const slots = []
  // Generate slots every 15 min; filter out the ones that overlap a blocked window or run past close
  for (let t = openMin; t + dur <= closeMin; t += 15) {
    const slotEnd = t + dur
    const overlap = blocked.some(b => t < b.end && slotEnd > b.start)
    if (!overlap) slots.push(minutesToTimeStr(t))
  }

  return {
    date,
    duration_minutes: dur,
    open: dayHours.open,
    close: dayHours.close,
    available_slots: slots,
    available_slots_friendly: slots.map(formatTimeFriendly),
  }
}

async function tool_find_my_appointment({ sb, salon, callerPhone }) {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await sb
    .from('salon_appointments')
    .select('id, appointment_date, appointment_time, service_name, status, total_price')
    .eq('salon_id', salon.id)
    .eq('client_phone', callerPhone)
    .gte('appointment_date', today)
    .neq('status', 'cancelled')
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })
    .limit(5)
  if (error) return { error: error.message }
  return {
    appointments: (data || []).map(a => ({
      id: a.id,
      date: a.appointment_date,
      time: a.appointment_time,
      time_friendly: formatTimeFriendly(a.appointment_time),
      date_friendly: formatDateFriendly(a.appointment_date),
      service_name: a.service_name,
      status: a.status,
    }))
  }
}

async function tool_book_appointment({ sb, salon, callerPhone }, { service_id, appointment_date, appointment_time, client_name }) {
  if (!service_id || !appointment_date || !appointment_time || !client_name) {
    return { error: 'service_id, appointment_date, appointment_time, and client_name are all required' }
  }

  const { data: svc } = await sb
    .from('salon_services')
    .select('id, name, price, duration_minutes')
    .eq('id', service_id)
    .eq('salon_id', salon.id)
    .maybeSingle()
  if (!svc) return { error: 'Service not found for this shop.' }

  // Re-check the slot is open before inserting (race protection)
  const startMin = timeStrToMinutes(appointment_time)
  const endMin = startMin + (svc.duration_minutes || 30)
  const { data: conflicts } = await sb
    .from('salon_appointments')
    .select('appointment_time')
    .eq('salon_id', salon.id)
    .eq('appointment_date', appointment_date)
    .neq('status', 'cancelled')
  const overlap = (conflicts || []).some(c => {
    const cs = timeStrToMinutes(c.appointment_time)
    if (cs == null) return false
    return startMin < cs + 30 && endMin > cs
  })
  if (overlap) return { error: 'That slot was just taken. Suggest the customer pick another from lookup_availability.' }

  const { data: appt, error: apptErr } = await sb
    .from('salon_appointments')
    .insert([{
      salon_id: salon.id,
      client_name: client_name.trim(),
      client_phone: callerPhone,
      service_name: svc.name,
      service_id: svc.id,
      total_price: Number(svc.price) || 0,
      appointment_date,
      appointment_time,
      status: 'confirmed',
    }])
    .select()
    .single()
  if (apptErr) return { error: 'Failed to create appointment: ' + apptErr.message }

  // Upsert client row
  const nowIso = new Date().toISOString()
  const { data: existingClient } = await sb
    .from('clients')
    .select('id, total_visits, total_spent')
    .eq('salon_id', salon.id)
    .eq('phone', callerPhone)
    .maybeSingle()

  if (existingClient) {
    await sb.from('clients').update({
      name: client_name.trim(),
      total_visits: (existingClient.total_visits || 0) + 1,
      total_spent: (existingClient.total_spent || 0) + (Number(svc.price) || 0),
      last_visit_at: nowIso,
      sms_consent_at: nowIso,
      sms_opted_out_at: null,
    }).eq('id', existingClient.id)
  } else {
    await sb.from('clients').insert([{
      salon_id: salon.id,
      name: client_name.trim(),
      phone: callerPhone,
      total_visits: 1,
      total_spent: Number(svc.price) || 0,
      last_visit_at: nowIso,
      source: 'sms_va',
      sms_consent_at: nowIso,
    }])
  }

  // Confirmation SMS to client + owner alert
  const friendlyDate = formatDateFriendly(appointment_date)
  const friendlyTime = formatTimeFriendly(appointment_time)
  if (salon.twilio_phone_number) {
    const ownerPhoneClean = cleanPhoneForSms(salon.personal_phone)
    if (ownerPhoneClean && ownerPhoneClean !== salon.twilio_phone_number) {
      await sendSms({
        to: ownerPhoneClean,
        from: salon.twilio_phone_number,
        body: `New booking at ${salon.shop_name}: ${client_name.trim()} — ${svc.name} on ${friendlyDate} at ${friendlyTime}. Booked via SMS.`,
        salon_id: salon.id,
        trigger_type: 'owner_booking_alert',
        sb,
      })
    }
  }

  return {
    success: true,
    appointment_id: appt.id,
    confirmation: `Booked ${svc.name} for ${client_name.trim()} on ${friendlyDate} at ${friendlyTime}.`,
  }
}

async function tool_reschedule_appointment({ sb, salon, callerPhone }, { appointment_id, new_date, new_time }) {
  if (!appointment_id || !new_date || !new_time) return { error: 'appointment_id, new_date, new_time required' }

  const { data: existing, error: fetchErr } = await sb
    .from('salon_appointments')
    .select('id, client_phone, service_name, salon_id, status')
    .eq('id', appointment_id)
    .maybeSingle()
  if (fetchErr || !existing) return { error: 'Appointment not found.' }
  if (existing.salon_id !== salon.id) return { error: 'Not authorized to modify that appointment.' }
  if (existing.client_phone !== callerPhone) return { error: 'You can only reschedule your own appointments.' }
  if (existing.status === 'cancelled') return { error: 'That appointment is already cancelled.' }

  const { error: updErr } = await sb
    .from('salon_appointments')
    .update({ appointment_date: new_date, appointment_time: new_time, status: 'confirmed' })
    .eq('id', appointment_id)
  if (updErr) return { error: 'Failed to reschedule: ' + updErr.message }

  return {
    success: true,
    confirmation: `Moved ${existing.service_name} to ${formatDateFriendly(new_date)} at ${formatTimeFriendly(new_time)}.`,
  }
}

async function tool_cancel_appointment({ sb, salon, callerPhone }, { appointment_id }) {
  if (!appointment_id) return { error: 'appointment_id required' }

  const { data: existing } = await sb
    .from('salon_appointments')
    .select('id, client_phone, service_name, appointment_date, appointment_time, salon_id, status')
    .eq('id', appointment_id)
    .maybeSingle()
  if (!existing) return { error: 'Appointment not found.' }
  if (existing.salon_id !== salon.id) return { error: 'Not authorized.' }
  if (existing.client_phone !== callerPhone) return { error: 'You can only cancel your own appointments.' }
  if (existing.status === 'cancelled') return { error: 'Already cancelled.' }

  const { error: updErr } = await sb
    .from('salon_appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointment_id)
  if (updErr) return { error: 'Failed to cancel: ' + updErr.message }

  // Owner alert
  if (salon.twilio_phone_number) {
    const ownerPhoneClean = cleanPhoneForSms(salon.personal_phone)
    if (ownerPhoneClean && ownerPhoneClean !== salon.twilio_phone_number) {
      await sendSms({
        to: ownerPhoneClean,
        from: salon.twilio_phone_number,
        body: `Cancellation at ${salon.shop_name}: ${existing.service_name} on ${formatDateFriendly(existing.appointment_date)} at ${formatTimeFriendly(existing.appointment_time)} was cancelled by ${callerPhone}.`,
        salon_id: salon.id,
        trigger_type: 'owner_cancel_alert',
        sb,
      })
    }
  }

  return {
    success: true,
    confirmation: `Cancelled ${existing.service_name} on ${formatDateFriendly(existing.appointment_date)} at ${formatTimeFriendly(existing.appointment_time)}.`,
  }
}

// ----- Dispatcher -----

const TOOL_MAP = {
  get_services: tool_get_services,
  get_shop_hours: tool_get_shop_hours,
  lookup_availability: tool_lookup_availability,
  find_my_appointment: tool_find_my_appointment,
  book_appointment: tool_book_appointment,
  reschedule_appointment: tool_reschedule_appointment,
  cancel_appointment: tool_cancel_appointment,
}

export async function executeTool(name, input, ctx) {
  const fn = TOOL_MAP[name]
  if (!fn) return { error: `Unknown tool: ${name}` }
  try {
    return await fn(ctx, input || {})
  } catch (err) {
    return { error: err.message || String(err) }
  }
}
