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

function validateTwilioSignature(authToken, signature, url, params) {
  const sortedKeys = Object.keys(params).sort()
  let data = url
  for (const key of sortedKeys) data += key + params[key]
  const computed = crypto.createHmac('sha1', authToken).update(Buffer.from(data, 'utf-8')).digest('base64')
  return computed === signature
}

export async function POST(req) {
  try {
    const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN
    const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID

    const formData = await req.formData()
    const params = {}
    for (const [key, value] of formData.entries()) params[key] = value

    // Validate Twilio signature
    const signature = req.headers.get('x-twilio-signature')
    const url = 'https://servicemind.vercel.app/api/calls/incoming'
    if (TWILIO_TOKEN && signature && !validateTwilioSignature(TWILIO_TOKEN, signature, url, params)) {
      return new Response('Forbidden', { status: 403 })
    }

    const callerPhone = params.From
    const twilioNumber = params.To

    if (!callerPhone || !twilioNumber) {
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>',
        { headers: { 'Content-Type': 'text/xml' } }
      )
    }

    const sb = getSb()

    const { data: salon } = await sb
      .from('salons')
      .select('id, shop_name, slug, missed_call_text_back, missed_call_auto_text, twilio_phone_number')
      .eq('twilio_phone_number', twilioNumber)
      .single()

    if (salon && salon.missed_call_text_back && TWILIO_SID && TWILIO_TOKEN) {
      let autoText = salon.missed_call_auto_text || "Hey! Sorry I missed your call. I'm with a client right now. Book your appointment here: {{booking_link}}"
      autoText = autoText.replace('{{booking_link}}', `https://servicemind.vercel.app/book/${salon.slug}`)
      autoText = autoText.replace('{{shop_name}}', salon.shop_name || '')

      const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`

      await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: callerPhone,
          From: salon.twilio_phone_number,
          Body: autoText,
        }),
      })

      // Log it
      await sb.from('sms_log').insert([{
        salon_id: salon.id,
        to_phone: callerPhone,
        from_phone: salon.twilio_phone_number,
        message: autoText,
        trigger_type: 'missed_call',
        status: 'sent'
      }])
    }

    // Return TwiML that hangs up
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    )
  } catch (err) {
    console.error('Call incoming error:', err)
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }
}
