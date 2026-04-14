import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
    if (authErr || !user) {
      return Response.json({ error: 'Invalid session' }, { status: 401 })
    }

    const { salon_id, message, context } = await req.json()
    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 })
    }

    const { data: salon } = await supabaseAdmin
      .from('salons')
      .select('id, shop_name')
      .eq('id', salon_id)
      .eq('user_id', user.id)
      .single()

    if (!salon) {
      return Response.json({ error: 'Salon not found' }, { status: 404 })
    }

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
    if (!ANTHROPIC_API_KEY) {
      return Response.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: context || `You are the AI business advisor for ${salon.shop_name}. Give direct, actionable advice.`,
        messages: [{ role: 'user', content: message }]
      })
    })

    const aiData = await aiRes.json()
    const text = aiData.content?.map(c => c.text || '').join('') || 'Unable to get a response right now.'

    await supabaseAdmin.from('ai_conversations').insert([{
      salon_id,
      type: 'advisor',
      channel: 'web',
      messages: [{ role: 'user', content: message }, { role: 'assistant', content: text }],
      resolved: true
    }])

    return Response.json({ success: true, response: text })
  } catch (err) {
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
