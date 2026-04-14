import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  try {
    const { salon_id, to, message, trigger_type, campaign_id } = await req.json()

    if (!salon_id || !to || !message) {
      return Response.json({ error: 'Missing required fields: salon_id, to, message' }, { status: 400 })
    }

    // Master Twilio credentials (YOUR account, not the barber's)
    const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID
    const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN

    if (!TWILIO_SID || !TWILIO_TOKEN) {
      return Response.json({ error: 'SMS not configured. Contact ServiceMind support.' }, { status: 500 })
    }

    // Get the salon's assigned phone number
    const { data: salon } = await sb
      .from('salons')
      .select('twilio_phone_number, shop_name')
      .eq('id', salon_id)
      .single()

    if (!salon?.twilio_phone_number) {
      await sb.from('sms_log').insert([{
        salon_id, to_phone: to, message, trigger_type, campaign_id,
        status: 'failed', error_message: 'No phone number assigned. Enable texting in Settings.'
      }])
      return Response.json({ error: 'No phone number assigned. Enable texting in Settings.' }, { status: 400 })
    }

    // Clean the phone number - ensure E.164 format
    let cleanPhone = to.replace(/[^0-9+]/g, '')
    if (!cleanPhone.startsWith('+')) {
      if (cleanPhone.startsWith('1') && cleanPhone.length === 11) {
        cleanPhone = '+' + cleanPhone
      } else if (cleanPhone.length === 10) {
        cleanPhone = '+1' + cleanPhone
      } else {
        cleanPhone = '+' + cleanPhone
      }
    }

    // Call Twilio API using MASTER credentials
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`
    const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')

    const twilioRes = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: cleanPhone,
        From: salon.twilio_phone_number,
        Body: message,
      }),
    })

    const twilioData = await twilioRes.json()

    if (twilioRes.ok) {
      await sb.from('sms_log').insert([{
        salon_id, to_phone: cleanPhone, from_phone: salon.twilio_phone_number,
        message, trigger_type, campaign_id,
        twilio_sid: twilioData.sid, status: 'sent'
      }])
      return Response.json({ success: true, sid: twilioData.sid, status: twilioData.status })
    } else {
      const errMsg = twilioData.message || 'Unknown Twilio error'
      await sb.from('sms_log').insert([{
        salon_id, to_phone: cleanPhone, from_phone: salon.twilio_phone_number,
        message, trigger_type, campaign_id,
        status: 'failed', error_message: errMsg
      }])
      return Response.json({ error: errMsg, code: twilioData.code }, { status: 400 })
    }
  } catch (err) {
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
