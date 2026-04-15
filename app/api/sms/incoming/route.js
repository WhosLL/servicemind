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
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}

export async function POST(req) {
  try {
    const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN
    if (!TWILIO_TOKEN) {
      return twimlResponse('System temporarily unavailable.')
    }

    const formData = await req.formData()
    const params = {}
    for (const [key, value] of formData.entries()) params[key] = value

    // Validate Twilio signature
    const signature = req.headers.get('x-twilio-signature')
    const url = 'https://servicemind.vercel.app/api/sms/incoming'
    if (signature && !validateTwilioSignature(TWILIO_TOKEN, signature, url, params)) {
      return new Response('Forbidden', { status: 403 })
    }

    const from = params.From
    const to = params.To
    const body = params.Body

    if (!from || !body) {
      return twimlResponse('Sorry, something went wrong.')
    }

    // Rate limit check
    if (!checkSmsRate(from)) {
      return twimlResponse('Too many messages. Please wait a moment.')
    }

    const sb = getSb()

    const { data: salon } = await sb
      .from('salons')
      .select('id, shop_name, salon_type, city, state, owner_name, slug, hours, schedule_settings')
      .eq('twilio_phone_number', to)
      .single()

    if (!salon) {
      return twimlResponse('This number is not currently active.')
    }

    const { data: services } = await sb
      .from('salon_services')
      .select('name, price, duration_minutes, category')
      .eq('salon_id', salon.id)
      .eq('is_active', true)
      .order('sort_order')

    const coreList = (services || []).filter(s => s.category !== 'addon').map(s => `${s.name} ($${s.price}, ${s.duration_minutes}min)`).join(', ')
    const addonList = (services || []).filter(s => s.category === 'addon').map(s => `${s.name} (+$${s.price})`).join(', ')

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
          history.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })
        }
      }
    }
    history.push({ role: 'user', content: body })

    let scheduleStr = 'Not set'
    if (salon.hours) {
      const h = typeof salon.hours === 'string' ? JSON.parse(salon.hours) : salon.hours
      scheduleStr = Object.entries(h).filter(([, v]) => v).map(([day, v]) => `${day}: ${v.open}-${v.close}`).join(', ')
    }

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
    if (!ANTHROPIC_API_KEY) {
      return twimlResponse('Our system is temporarily unavailable. Please try again later.')
    }

    const systemPrompt = `You are the AI receptionist for ${salon.shop_name}, a ${salon.salon_type} in ${salon.city}, ${salon.state} owned by ${salon.owner_name}. Help clients book appointments, answer questions about services and pricing, and be friendly. Core services: ${coreList}. Add-ons: ${addonList}. Hours: ${scheduleStr}. Booking link: https://servicemind.vercel.app/book/${salon.slug}. Keep replies short â this is SMS. If they want to book, send the booking link. If you can't help, say the team will follow up shortly.`

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: systemPrompt,
        messages: history.slice(-20)
      })
    })

    const aiData = await aiRes.json()
    const reply = aiData.content?.map(c => c.text || '').join('') || "Thanks for reaching out! We'll get back to you soon."

    await sb.from('ai_conversations').insert([{
      salon_id: salon.id,
      type: 'receptionist',
      channel: 'sms',
      client_phone: from,
      messages: [{ role: 'user', content: body }, { role: 'assistant', content: reply }],
      resolved: false
    }])

    const { data: existingClient } = await sb
      .from('clients')
      .select('id')
      .eq('salon_id', salon.id)
      .eq('phone', from)
      .single()

    if (!existingClient) {
      await sb.from('clients').insert([{
        salon_id: salon.id,
        phone: from,
        name: 'SMS Client',
        source: 'sms',
        referral_code: crypto.randomBytes(3).toString('hex').toUpperCase()
      }])
    }

    return twimlResponse(reply)
  } catch (err) {
    console.error('SMS incoming error:', err)
    return twimlResponse('Sorry, something went wrong. Please try again.')
  }
}

