import { createClient } from '@supabase/supabase-js'
import {
  isMarketingTrigger,
  getSalonTimezone,
  isQuietHours,
  prepareOutboundMessage,
} from '../../../lib/sms-compliance'
import { canSendSms } from '../../../lib/subscription'

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
    const { salon_id, to, message, trigger_type, campaign_id, appointment_id } = await req.json()

    if (!salon_id || !to || !message) {
      return Response.json({ error: 'Missing required fields: salon_id, to, message' }, { status: 400 })
    }

    // Auth: accept either CRON_SECRET (internal) or a user Bearer token whose user owns this salon
    const authHeader = req.headers.get('authorization') || ''
    if (!authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const isCron = process.env.CRON_SECRET && token === process.env.CRON_SECRET
    if (!isCron) {
      const { data: { user }, error: authErr } = await sb.auth.getUser(token)
      if (authErr || !user) return Response.json({ error: 'Invalid session' }, { status: 401 })
      const { data: ownership } = await sb.from('salons').select('id').eq('id', salon_id).eq('user_id', user.id).single()
      if (!ownership) return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID
    const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN

    if (!TWILIO_SID || !TWILIO_TOKEN) {
      return Response.json({ error: 'SMS not configured. Contact ServiceMind support.' }, { status: 500 })
    }

    const { data: salon } = await sb
      .from('salons')
      .select('twilio_phone_number, shop_name, state, city, subscription_status, trial_ends_at')
      .eq('id', salon_id)
      .single()

    // Subscription gate: block sends if not on active/trialing/trial-in-window.
    // Runs before opt-out etc. so an inactive shop can't waste compute on gates.
    if (!canSendSms(salon)) {
      await sb.from('sms_log').insert([{
        salon_id, to_phone: to, message, trigger_type, campaign_id, appointment_id,
        status: 'blocked_subscription',
        error_message: `Subscription not active (status: ${salon?.subscription_status || 'none'})`,
      }])
      return Response.json({
        error: 'Subscription required. Add a payment method to keep texting.',
        subscription_status: salon?.subscription_status || null,
      }, { status: 402 })
    }

    if (!salon?.twilio_phone_number) {
      await sb.from('sms_log').insert([{
        salon_id, to_phone: to, message, trigger_type, campaign_id, appointment_id,
        status: 'failed', error_message: 'No phone number assigned. Enable texting in Settings.'
      }])
      return Response.json({ error: 'No phone number assigned. Enable texting in Settings.' }, { status: 400 })
    }

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

    // TCPA compliance: don't send to opted-out clients.
    // Phone storage is inconsistent across codepaths; match on last 10 digits.
    const last10 = cleanPhone.replace(/[^0-9]/g, '').slice(-10)
    if (last10) {
      const { data: optOut } = await sb
        .from('clients')
        .select('id, sms_opted_out_at')
        .eq('salon_id', salon_id)
        .ilike('phone', `%${last10}`)
        .not('sms_opted_out_at', 'is', null)
        .limit(1)
      if (optOut?.length) {
        await sb.from('sms_log').insert([{
          salon_id, to_phone: cleanPhone, from_phone: salon.twilio_phone_number,
          message, trigger_type, campaign_id, appointment_id,
          status: 'blocked_opt_out', error_message: 'Recipient has opted out of SMS'
        }])
        return Response.json({ error: 'Recipient has opted out of SMS' }, { status: 403 })
      }
    }

    // TCPA marketing-consent gate: marketing sends require the recipient to
    // have an affirmative consent record (sms_consent_at). This catches manual
    // dashboard fires + any path that bypasses the bulk-audience consent filter.
    // Transactional triggers (confirmations, reminders, owner alerts, AI receptionist)
    // are exempt — recipient initiated the interaction.
    if (isMarketingTrigger(trigger_type) && last10) {
      const { data: consented } = await sb
        .from('clients')
        .select('id, sms_consent_at')
        .eq('salon_id', salon_id)
        .ilike('phone', `%${last10}`)
        .not('sms_consent_at', 'is', null)
        .limit(1)
      if (!consented?.length) {
        await sb.from('sms_log').insert([{
          salon_id, to_phone: cleanPhone, from_phone: salon.twilio_phone_number,
          message, trigger_type, campaign_id, appointment_id,
          status: 'blocked_no_consent',
          error_message: 'No marketing consent on file for recipient',
        }])
        return Response.json({ error: 'Recipient has not opted in to marketing.' }, { status: 403 })
      }
    }

    // TCPA quiet hours: block marketing sends outside 8 AM - 9 PM recipient-local.
    // Transactional messages (confirmations, reminders, AI receptionist replies)
    // are exempt — recipient initiated them.
    if (isMarketingTrigger(trigger_type)) {
      const tz = getSalonTimezone(salon)
      if (isQuietHours(new Date(), tz)) {
        await sb.from('sms_log').insert([{
          salon_id, to_phone: cleanPhone, from_phone: salon.twilio_phone_number,
          message, trigger_type, campaign_id, appointment_id,
          status: 'blocked_quiet_hours',
          error_message: `Quiet hours in ${tz} — marketing send blocked`,
        }])
        return Response.json({ error: 'Outside permitted send window (8 AM - 9 PM local).' }, { status: 409 })
      }
    }

    const outboundBody = prepareOutboundMessage(message, salon, trigger_type)

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
        Body: outboundBody,
      }),
    })

    const twilioData = await twilioRes.json()

    if (twilioRes.ok) {
      await sb.from('sms_log').insert([{
        salon_id, to_phone: cleanPhone, from_phone: salon.twilio_phone_number,
        message: outboundBody, trigger_type, campaign_id, appointment_id,
        twilio_sid: twilioData.sid, status: 'sent'
      }])
      return Response.json({ success: true, sid: twilioData.sid, status: twilioData.status })
    } else {
      const errMsg = twilioData.message || 'Unknown Twilio error'
      await sb.from('sms_log').insert([{
        salon_id, to_phone: cleanPhone, from_phone: salon.twilio_phone_number,
        message: outboundBody, trigger_type, campaign_id, appointment_id,
        status: 'failed', error_message: errMsg
      }])
      return Response.json({ error: errMsg, code: twilioData.code }, { status: 400 })
    }
  } catch (err) {
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

