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
    const { salon_id, client_name, client_phone, service_id, service_name, addon_ids, addon_names, total_price, appointment_date, appointment_time, notes, referral_code, sms_consent } = await req.json()

    if (!salon_id || !client_name || !client_phone || !service_name || !appointment_date || !appointment_time) {
      return Response.json({ error: 'Missing required booking fields' }, { status: 400 })
    }

    if (sms_consent !== true) {
      return Response.json({ error: 'SMS consent is required to confirm a booking' }, { status: 400 })
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

    const nowIso = new Date().toISOString()
    if (existingClient) {
      await sb.from('clients').update({
        total_visits: (existingClient.total_visits || 0) + 1,
        total_spent: (existingClient.total_spent || 0) + (total_price || 0),
        last_visit_at: nowIso,
        name: client_name.trim(),
        sms_consent_at: nowIso,
        sms_opted_out_at: null
      }).eq('id', existingClient.id)
    } else {
      const newCode = crypto.randomBytes(3).toString('hex').toUpperCase()
      await sb.from('clients').insert([{
        salon_id,
        name: client_name.trim(),
        phone: client_phone.trim(),
        total_visits: 1,
        total_spent: total_price || 0,
        last_visit_at: nowIso,
        source: 'booking_page',
        referral_code: newCode,
        referred_by: referredByName || (referral_code ? referral_code : null),
        sms_consent_at: nowIso
      }])
    }

    // Get salon for SMS
    const { data: salon } = await sb.from('salons').select('shop_name, twilio_phone_number, personal_phone, slug').eq('id', salon_id).single()

    if (salon?.twilio_phone_number && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`
      const dateFormatted = new Date(appointment_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

      const cleanForSms = (raw) => {
        let p = (raw || '').trim().replace(/[^0-9+]/g, '')
        if (!p) return null
        if (!p.startsWith('+')) {
          p = p.length === 10 ? '+1' + p : p.startsWith('1') ? '+' + p : '+' + p
        }
        return p
      }

      // Confirmation SMS to the client
      const clientPhoneClean = cleanForSms(client_phone)
      if (clientPhoneClean) {
        const clientBody = `You're booked at ${salon.shop_name} on ${dateFormatted} at ${appointment_time} for ${service_name}. See you then!`
        await fetch(twilioUrl, {
          method: 'POST',
          headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ To: clientPhoneClean, From: salon.twilio_phone_number, Body: clientBody }),
        })
        await sb.from('sms_log').insert([{
          salon_id, to_phone: clientPhoneClean, from_phone: salon.twilio_phone_number,
          message: clientBody, trigger_type: 'booking_confirmation', status: 'sent'
        }])
      }

      // Owner notification — fires only if personal_phone is set and isn't the same as the Twilio number
      const ownerPhoneClean = cleanForSms(salon.personal_phone)
      if (ownerPhoneClean && ownerPhoneClean !== salon.twilio_phone_number) {
        const ownerBody = `New booking at ${salon.shop_name}: ${client_name.trim()} — ${service_name} on ${dateFormatted} at ${appointment_time}. Their phone: ${clientPhoneClean || client_phone}`
        await fetch(twilioUrl, {
          method: 'POST',
          headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ To: ownerPhoneClean, From: salon.twilio_phone_number, Body: ownerBody }),
        })
        await sb.from('sms_log').insert([{
          salon_id, to_phone: ownerPhoneClean, from_phone: salon.twilio_phone_number,
          message: ownerBody, trigger_type: 'owner_booking_alert', status: 'sent'
        }])
      }
    }

    return Response.json({ success: true, appointment: appt?.[0] })
  } catch (err) {
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
