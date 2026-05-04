import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { SMS_VA_TOOLS, executeTool } from '../../../../lib/sms-va-tools'

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

// Twilio signature validation
function validateTwilioSignature(authToken, signature, url, params) {
  const sortedKeys = Object.keys(params).sort()
  let data = url
  for (const key of sortedKeys) data += key + params[key]
  const computed = crypto.createHmac('sha1', authToken).update(Buffer.from(data, 'utf-8')).digest('base64')
  return computed === signature
}

// Rate limiting: 10 per phone per minute
const smsRateMap = new Map()
function checkSmsRate(phone) {
  const now = Date.now()
  const window = 60000
  const limit = 10
  if (!smsRateMap.has(phone)) smsRateMap.set(phone, [])
  const hits = smsRateMap.get(phone).filter(t => now - t < window)
  if (hits.length >= limit) return false
  hits.push(now)
  smsRateMap.set(phone, hits)
  return true
}

function twimlResponse(message) {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}

function escapeXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function POST(req) {
  try {
    const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN
    if (!TWILIO_TOKEN) return twimlResponse('System temporarily unavailable.')

    const formData = await req.formData()
    const params = {}
    for (const [key, value] of formData.entries()) params[key] = value

    // Twilio signs the URL it was configured to call, which can be either
    // servicemind.vercel.app (per /api/provision-number) or servicemind.io
    // (custom domain). Try the host the request actually arrived on first,
    // then both known apex hosts as fallbacks.
    const signature = req.headers.get('x-twilio-signature')
    if (signature) {
      const host = req.headers.get('host') || 'servicemind.vercel.app'
      const candidateUrls = [
        `https://${host}/api/sms/incoming`,
        'https://servicemind.vercel.app/api/sms/incoming',
        'https://servicemind.io/api/sms/incoming',
      ]
      const valid = candidateUrls.some(u => validateTwilioSignature(TWILIO_TOKEN, signature, u, params))
      if (!valid) return new Response('Forbidden', { status: 403 })
    }

    const from = params.From
    const to = params.To
    const body = params.Body

    if (!from || !body) return twimlResponse('Sorry, something went wrong.')
    if (!checkSmsRate(from)) return twimlResponse('Too many messages. Please wait a moment.')

    const sb = getSb()

    const { data: salon } = await sb
      .from('salons')
      .select('id, shop_name, salon_type, city, state, owner_name, slug, hours, schedule_settings, twilio_phone_number, personal_phone')
      .eq('twilio_phone_number', to)
      .single()

    if (!salon) return twimlResponse('This number is not currently active.')

    // Carrier-required keyword handling — runs before AI receptionist.
    const normalized = body.trim().toUpperCase()
    const stopKeywords = ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']
    const helpKeywords = ['HELP', 'INFO']
    const startKeywords = ['START', 'UNSTOP', 'YES']

    if (stopKeywords.includes(normalized)) {
      await sb.from('clients')
        .update({ sms_opted_out_at: new Date().toISOString() })
        .eq('salon_id', salon.id)
        .eq('phone', from)
      await sb.from('sms_log').insert([{
        salon_id: salon.id, to_phone: from, from_phone: to,
        message: body, trigger_type: 'opt_out', status: 'received'
      }])
      return twimlResponse(`You've been unsubscribed from ${salon.shop_name}. No more messages will be sent. Reply START to resubscribe.`)
    }

    if (helpKeywords.includes(normalized)) {
      return twimlResponse(`${salon.shop_name}: Booking confirmations & reminders. Reply STOP to unsubscribe. Msg&data rates may apply. Msg freq varies.`)
    }

    if (startKeywords.includes(normalized)) {
      await sb.from('clients')
        .update({ sms_opted_out_at: null, sms_consent_at: new Date().toISOString() })
        .eq('salon_id', salon.id)
        .eq('phone', from)
      await sb.from('sms_log').insert([{
        salon_id: salon.id, to_phone: from, from_phone: to,
        message: body, trigger_type: 'opt_in', status: 'received'
      }])
      return twimlResponse(`You're resubscribed to ${salon.shop_name}. Reply STOP at any time to opt out.`)
    }

    // Load prior turn text for context (tool roundtrips are session-local; we don't replay them).
    const { data: recentConvos } = await sb
      .from('ai_conversations')
      .select('messages, created_at')
      .eq('salon_id', salon.id)
      .eq('client_phone', from)
      .eq('channel', 'sms')
      .order('created_at', { ascending: false })
      .limit(10)

    const history = []
    if (recentConvos) {
      for (const convo of recentConvos.reverse()) {
        for (const m of (convo.messages || [])) {
          if (typeof m.content === 'string' && m.content.trim()) {
            history.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })
          }
        }
      }
    }
    history.push({ role: 'user', content: body })

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
    if (!ANTHROPIC_API_KEY) return twimlResponse('Our system is temporarily unavailable. Please try again later.')

    // Today in salon-local-ish terms (timezone is America/New_York for now per backlog).
    const now = new Date()
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }) // YYYY-MM-DD
    const dayName = now.toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'long' })

    const systemPrompt = `You are the AI receptionist for ${salon.shop_name}, a ${salon.salon_type || 'service business'} in ${salon.city || ''}, ${salon.state || ''} owned by ${salon.owner_name || 'the owner'}.

Your job: help customers book, reschedule, cancel, and answer service questions — entirely over SMS. You have tools to actually do these things; use them, don't just describe them.

Today is ${dayName}, ${todayStr} (America/New_York). The customer's phone is already known: ${from}. Don't ask for it.

Booking flow:
1. If you don't already know the services + prices, call get_services.
2. When the customer mentions a date like "tomorrow" or "Friday", convert it to YYYY-MM-DD based on today's date and call lookup_availability with the chosen service's duration_minutes.
3. Confirm the slot with the customer in plain language ("How about Tuesday May 6 at 2:00 PM?").
4. Once they say yes AND you have their name, call book_appointment.
5. Tell them the booking is confirmed.

For reschedule/cancel: call find_my_appointment first to get the appointment_id.

Style: SMS-short. Friendly but not chatty. Don't use markdown. Don't use links unless someone asks. Never mention you're an AI. If you genuinely can't help, say a team member will follow up.`

    // Tool-use loop
    const messages = history.slice(-30)
    let assistantText = ''
    const MAX_ITERS = 5
    for (let iter = 0; iter < MAX_ITERS; iter++) {
      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: systemPrompt,
          tools: SMS_VA_TOOLS,
          messages,
        }),
      })
      const aiData = await aiRes.json()

      if (!aiData?.content) {
        assistantText = "Thanks for reaching out! We'll get back to you soon."
        break
      }

      // Append assistant turn (full content array, including tool_use blocks)
      messages.push({ role: 'assistant', content: aiData.content })

      // Pull text out of any text blocks
      const textParts = aiData.content.filter(b => b.type === 'text').map(b => b.text || '').join('').trim()
      if (textParts) assistantText = textParts

      // If the model is done, stop
      if (aiData.stop_reason !== 'tool_use') break

      // Otherwise, execute every tool_use block and feed results back
      const toolUses = aiData.content.filter(b => b.type === 'tool_use')
      if (toolUses.length === 0) break

      const toolResults = []
      for (const tu of toolUses) {
        const result = await executeTool(tu.name, tu.input, { sb, salon, callerPhone: from })
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: JSON.stringify(result),
        })
      }
      messages.push({ role: 'user', content: toolResults })
    }

    if (!assistantText) assistantText = "Got it — someone will be in touch shortly."

    // Persist only the user's text + assistant's final text. Tool roundtrips stay session-local.
    await sb.from('ai_conversations').insert([{
      salon_id: salon.id,
      type: 'receptionist',
      channel: 'sms',
      client_phone: from,
      messages: [
        { role: 'user', content: body },
        { role: 'assistant', content: assistantText },
      ],
      resolved: false,
    }])

    // Ensure a clients row exists for this caller
    const { data: existingClient } = await sb
      .from('clients')
      .select('id')
      .eq('salon_id', salon.id)
      .eq('phone', from)
      .maybeSingle()
    if (!existingClient) {
      await sb.from('clients').insert([{
        salon_id: salon.id,
        phone: from,
        name: 'SMS Client',
        source: 'sms',
        referral_code: crypto.randomBytes(3).toString('hex').toUpperCase(),
      }])
    }

    return twimlResponse(assistantText)
  } catch (err) {
    console.error('SMS incoming error:', err)
    return twimlResponse('Sorry, something went wrong. Please try again.')
  }
}
