import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function twimlResponse(message) {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}

export async function POST(req) {
  try {
    const formData = await req.formData()
    const from = formData.get('From')
    const to = formData.get('To')
    const body = formData.get('Body')

    if (!from || !body) {
      return twimlResponse('Sorry, something went wrong.')
    }

    const { data: salon } = await sb
      .from('salons')
      .select('id, shop_name, salon_type, city, state, slug, hours, schedule_settings')
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

    const serviceList = (services || []).map(s => `${s.name} ($${s.price}, ${s.duration_minutes}min)`).join(', ')

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
        const msgs = convo.messages || []
        for (const m of msgs) {
          history.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })
        }
      }
    }
    history.push({ role: 'user', content: body })

    let scheduleStr = 'Not set'
    if (salon.hours) {
      const h = typeof salon.hours === 'string' ? JSON.parse(salon.hours) : salon.hours
      scheduleStr = Object.entries(h)
        .filter(([, v]) => v)
        .map(([day, v]) => `${day}: ${v.open}-${v.close}`)
        .join(', ')
    }

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
    if (!ANTHROPIC_API_KEY) {
      return twimlResponse('Our system is temporarily unavailable. Please try again later.')
    }

    const systemPrompt = `You are the AI receptionist for ${salon.shop_name}, a ${salon.salon_type} in ${salon.city}, ${salon.state}. Your job is to help clients book appointments, answer questions about services and pricing, and be friendly and professional. Available services: ${serviceList}. Hours: ${scheduleStr}. Booking link: https://servicemind.vercel.app/book/${salon.slug}. Keep replies short \u2014 this is SMS. If the client wants to book, send them the booking link. If you can\'t help, say you\'ll have someone follow up.`

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
      messages: [
        { role: 'user', content: body },
        { role: 'assistant', content: reply }
      ],
      resolved: false
    }])

    const { data: existingClient } = await sb
      .from('clients')
      .select('id, total_visits')
      .eq('salon_id', salon.id)
      .eq('phone', from)
      .single()

    if (!existingClient) {
      await sb.from('clients').insert([{
        salon_id: salon.id,
        phone: from,
        name: 'SMS Client',
        source: 'sms'
      }])
    }

    return twimlResponse(reply)
  } catch (err) {
    console.error('SMS incoming error:', err)
    return twimlResponse('Sorry, something went wrong. Please try again.')
  }
}
