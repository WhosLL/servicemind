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

// GET — returns public info for the review page (shop + appointment)
export async function GET(req, { params }) {
  try {
    const { appointmentId } = params
    if (!appointmentId) return Response.json({ error: 'Missing appointment id' }, { status: 400 })

    const sb = getSb()
    const { data: appt } = await sb
      .from('salon_appointments')
      .select('id, salon_id, client_name, service_name, appointment_date, appointment_time, status')
      .eq('id', appointmentId)
      .maybeSingle()

    if (!appt) return Response.json({ error: 'Appointment not found' }, { status: 404 })

    const { data: salon } = await sb
      .from('salons')
      .select('shop_name, slug, google_review_url')
      .eq('id', appt.salon_id)
      .maybeSingle()

    if (!salon) return Response.json({ error: 'Salon not found' }, { status: 404 })

    const { data: existingReview } = await sb
      .from('salon_reviews')
      .select('id, stars')
      .eq('appointment_id', appointmentId)
      .maybeSingle()

    return Response.json({
      appointment: {
        id: appt.id,
        client_name: appt.client_name,
        service_name: appt.service_name,
        appointment_date: appt.appointment_date,
        appointment_time: appt.appointment_time,
      },
      salon: {
        shop_name: salon.shop_name,
        slug: salon.slug,
        has_google_review: !!salon.google_review_url,
      },
      already_reviewed: !!existingReview,
    })
  } catch (err) {
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// POST — submit a review
export async function POST(req, { params }) {
  try {
    const { appointmentId } = params
    const body = await req.json()
    const { stars, review_text, author_name } = body

    if (!appointmentId) return Response.json({ error: 'Missing appointment id' }, { status: 400 })
    const rating = Number(stars)
    if (!rating || rating < 1 || rating > 5) {
      return Response.json({ error: 'Stars must be between 1 and 5' }, { status: 400 })
    }

    const sb = getSb()
    const { data: appt } = await sb
      .from('salon_appointments')
      .select('id, salon_id, client_name, service_name, client_phone')
      .eq('id', appointmentId)
      .maybeSingle()

    if (!appt) return Response.json({ error: 'Appointment not found' }, { status: 404 })

    const { data: existing } = await sb
      .from('salon_reviews')
      .select('id')
      .eq('appointment_id', appointmentId)
      .maybeSingle()

    if (existing) return Response.json({ error: 'Review already submitted for this appointment' }, { status: 409 })

    const { data: salon } = await sb
      .from('salons')
      .select('id, shop_name, owner_name, twilio_phone_number, personal_phone, google_review_url')
      .eq('id', appt.salon_id)
      .maybeSingle()

    if (!salon) return Response.json({ error: 'Salon not found' }, { status: 404 })

    // Find or create client_id by matching phone if available
    let clientId = null
    if (appt.client_phone) {
      const { data: client } = await sb
        .from('clients')
        .select('id')
        .eq('salon_id', salon.id)
        .eq('phone', appt.client_phone)
        .maybeSingle()
      if (client) clientId = client.id
    }

    const { error: insertErr } = await sb.from('salon_reviews').insert([{
      salon_id: salon.id,
      client_id: clientId,
      appointment_id: appointmentId,
      author_name: (author_name || appt.client_name || '').trim() || 'Anonymous',
      service_received: appt.service_name,
      stars: rating,
      review_text: (review_text || '').trim(),
      is_visible: rating >= 4,
      platform: 'servicemind',
    }])

    if (insertErr) return Response.json({ error: 'Failed to save review: ' + insertErr.message }, { status: 500 })

    // Low rating → alert the owner privately
    if (rating <= 3 && salon.twilio_phone_number && salon.personal_phone && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')
        let cleanPhone = salon.personal_phone.replace(/[^0-9+]/g, '')
        if (!cleanPhone.startsWith('+')) {
          cleanPhone = cleanPhone.length === 10 ? '+1' + cleanPhone : cleanPhone.startsWith('1') ? '+' + cleanPhone : '+' + cleanPhone
        }
        const alertBody = `${salon.shop_name}: ${appt.client_name} left ${rating}★ feedback. Check dashboard to follow up.`
        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
          method: 'POST',
          headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ To: cleanPhone, From: salon.twilio_phone_number, Body: alertBody }),
        })
        await sb.from('sms_log').insert([{
          salon_id: salon.id, to_phone: cleanPhone, from_phone: salon.twilio_phone_number,
          message: alertBody, trigger_type: 'low_rating_alert', status: 'sent'
        }])
      } catch (alertErr) {
        // Don't fail the review submission if the alert fails
        console.error('Low-rating alert failed:', alertErr)
      }
    }

    return Response.json({
      success: true,
      stars: rating,
      google_review_url: rating >= 4 ? salon.google_review_url : null,
      shop_name: salon.shop_name,
    })
  } catch (err) {
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
