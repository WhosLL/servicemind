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

export async function POST(req) {
  try {
    const sb = getSb()
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authErr } = await sb.auth.getUser(token)
    if (authErr || !user) {
      return Response.json({ error: 'Invalid session' }, { status: 401 })
    }

    const { salon_id, vibe, shop_name, salon_type, city, state, owner_name } = await req.json()

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
    if (!ANTHROPIC_API_KEY) {
      return Response.json({ error: 'AI service not configured' }, { status: 500 })
    }

    const prompt = `Generate website copy for a ${salon_type} called "${shop_name}" in ${city}, ${state}, owned by ${owner_name}. The vibe is: "${vibe}". Return ONLY valid JSON with these keys: tagline (short, punchy, max 8 words), hero_description (1-2 sentences for the hero section), about (2-3 sentences about the shop), accent_color (hex color that matches the vibe). No markdown, no code fences, just the JSON object.`

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const aiData = await aiRes.json()
    const raw = aiData.content?.map(c => c.text || '').join('') || '{}'

    let siteContent
    try {
      siteContent = JSON.parse(raw)
    } catch {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      siteContent = jsonMatch ? JSON.parse(jsonMatch[0]) : { tagline: shop_name, hero_description: `Welcome to ${shop_name}`, about: `${shop_name} is a ${salon_type} in ${city}, ${state}.`, accent_color: '#C9A84C' }
    }

    if (salon_id) {
      await sb.from('salons').update({ site_content: siteContent, vibe }).eq('id', salon_id)
    }

    return Response.json({ success: true, site_content: siteContent })
  } catch (err) {
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

