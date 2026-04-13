import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  'https://sbhjuntwwyavdnpsgzjb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiaGp1bnR3d3lhdmRucHNnempiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNTU2NzMsImV4cCI6MjA5MDkzMTY3M30.dl_6gY4ag0NdlI-yuDjijW_9uc9GP9E-eLp9snHLuZk'
)

export async function POST(req) {
  try {
    const { salon_id, to, message, trigger_type, campaign_id } = await req.json()

    if (!salon_id || !to || !message) {
      return Response.json({ error: 'Missing required fields: salon_id, to, message' }, { status: 400 })
    }

    // Get salon's Twilio credentials
    const { data: salon } = await sb
      .from('salons')
      .select('twilio_account_sid, twilio_auth_token, twilio_phone_number, shop_name')
      .eq('id', salon_id)
      .single()

    if (!salon?.twilio_account_sid || !salon?.twilio_auth_token || !salon?.twilio_phone_number) {
      // Log the attempt even if no credentials
      await sb.from('sms_log').insert([{
        salon_id, to_phone: to, message, trigger_type, campaign_id,
        status: 'failed', error_message: 'Twilio credentials not configured'
      }])
      return Response.json({ error: 'Twilio credentials not configured. Go to Settings → SMS Setup.' }, { status: 400 })
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

    // Call Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${salon.twilio_account_sid}/Messages.json`
    const auth = Buffer.from(`${salon.twilio_account_sid}:${salon.twilio_auth_token}`).toString('base64')

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
      // Log success
      await sb.from('sms_log').insert([{
        salon_id, to_phone: cleanPhone, from_phone: salon.twilio_phone_number,
        message, trigger_type, campaign_id,
        twilio_sid: twilioData.sid, status: 'sent'
      }])

      return Response.json({ success: true, sid: twilioData.sid, status: twilioData.status })
    } else {
      // Log failure
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
