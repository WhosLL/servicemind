import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

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
  try {
    const sb = getSb()
    const { salon_id, client_name, client_phone, service_id, service_name, addon_ids, addon_names, total_price, appointment_date, appointment_time, notes, referral_code } = await req.json()

    if (!salon_id || !client_name || !client_phone || !service_name || !appointment_date || !appointment_time) {
      return Response.json({ error: 'Missing required booking fields' }, { status: 400 })
    }

    // Insert appointment
    const { data: appt, error: apptErr } = await sb.from('salon_appointments').insert([{
      salon_id,
      client_name: client_name.trim(),
      client_phone: client_phone.trim(),
      service_name: addon_names?.length ? `${service_name} + ${addon_names.join(', ')}` : service_name,
      service_id: service_id || null,
      total_price: total_price || 0,
      appointment_date,
      appointment_time,
      status: 'confirmed',
      notes: notes?.trim() || null
    }]).select()

    if (apptErr) {
      return Response.json({ error: 'Failed to create appointment: ' + apptErr.message }, { status: 500 })
    }

    // Upsert client
    const { data: existingClient } = await sb
      .from('clients')
      .select('id, total_visits, total_spent, referral_code')
      .eq('salon_id', salon_id)
      .eq('phone', client_phone.trim())
      .single()

    let referredByName = null
    if (referral_code) {
      const { data: referrer } = await sb
        .from('clients')
        .select('name, referral_code')
        .eq('referral_code', referral_code)
        .eq('salon_id', salon_id)
        .single()
      if (referrer) referredByName = referrer.name
    }

    if (existingClient) {
      await sb.from('clients').update({
        total_visits: (existingClient.total_visits || 0) + 1,
        total_spent: (existingClient.total_spent || 0) + (total_price || 0),
        last_visit_at: new Date().toISOString(),
        name: client_name.trim()
      }).eq('id', existingClient.id)
    } else {
      const newCode = crypto.randomBytes(3).toString('hex').toUpperCase()
      await sb.from('clients').insert([{
        salon_id,
        name: client_name.trim(),
        phone: client_phone.trim(),
        total_visits: 1,
        total_spent: total_price || 0,
        last_visit_at: new Date().toISOString(),
        source: 'booking_page',
        referral_code: newCode,
        referred_by: referredByName || (referral_code ? referral_code : null)
      }])
    }

    // Get salon for SMS
    const { data: salon } = await sb.from('salons').select('shop_name, twilio_phone_number, slug').eq('id', salon_id).single()

    // Send confirmation SMS
    if (salon?.twilio_phone_number && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const dateFormatted = new Date(appointment_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      const smsBody = `You're booked at ${salon.shop_name} on ${dateFormatted} at ${appointment_time} for ${service_name}. See you then!`

      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')
      let cleanPhone = client_phone.trim().replace(/[^0-9+]/g, '')
      if (!cleanPhone.startsWith('+')) {
        cleanPhone = cleanPhone.length === 10 ? '+1' + cleanPhone : cleanPhone.startsWith('1') ? '+' + cleanPhone : '+' + cleanPhone
      }

      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ To: cleanPhone, From: salon.twilio_phone_number, Body: smsBody }),
      })

      await sb.from('sms_log').insert([{
        salon_id, to_phone: cleanPhone, from_phone: salon.twilio_phone_number,
        message: smsBody, trigger_type: 'booking_confirmation', status: 'sent'
      }])
    }

    return Response.json({ success: true, appointment: appt?.[0] })
  } catch (err) {
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
