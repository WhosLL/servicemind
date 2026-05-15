// Unauth: generates draft tagline / about copy during onboarding Step 5.
// No persistence — the salon row doesn't exist yet at this point in the wizard.
// At Activate, the chosen copy is bundled into salonData.site_content.
//
// Inputs (POST JSON):
//   shop_name, salon_type, city, state, owner_name (optional)
//   template_id (optional — informs tone)
//   target: 'tagline' | 'about' | 'both'  (default 'both')
//   seed: number | undefined              (re-roll variance hint)
//
// Output: { tagline?: string, about?: string }

const MODEL = 'claude-sonnet-4-6'

function buildPrompt({ shop_name, salon_type, city, state, owner_name, template_id, target, seed }) {
  const where = [city, state].filter(Boolean).join(', ') || 'their city'
  const variancePrompt = typeof seed === 'number'
    ? `\nThis is variation #${seed}. Write something distinctly different in tone, structure, or phrasing from a typical first attempt — surprise the reader without being gimmicky.`
    : ''
  const templateLine = template_id
    ? `Design template the owner picked: "${template_id}". Let that influence tone (luxury=elevated, urban=direct, beach=relaxed, mountain=grounded, classic=traditional).`
    : ''

  const wantTagline = target === 'tagline' || target === 'both'
  const wantAbout = target === 'about' || target === 'both'

  const keys = []
  if (wantTagline) keys.push('"tagline": "<short, punchy, max 8 words — no shop name, no clichés like \\"experience the difference\\"">"')
  if (wantAbout) keys.push('"about": "<2-3 sentences. Concrete, not hype. Lead with what the shop does, not adjectives.>"')

  return `You are writing booking-page copy for a ${salon_type} called "${shop_name}" in ${where}${owner_name ? `, owned by ${owner_name}` : ''}.
${templateLine}
${variancePrompt}

Voice rules:
- Direct. No SaaS jargon, no MBA-speak.
- Respect the trade. Speak to walk-in clients, not to investors.
- Specific over generic. "Fades and beard work since 2019" beats "premium grooming experience."
- No emojis. No exclamation points unless genuinely warranted (almost never).

Return ONLY a JSON object with these keys (no markdown, no code fences):
{
  ${keys.join(',\n  ')}
}`
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { shop_name, salon_type } = body
    if (!shop_name || !salon_type) {
      return Response.json({ error: 'shop_name and salon_type are required.' }, { status: 400 })
    }

    const target = body.target || 'both'
    if (!['tagline', 'about', 'both'].includes(target)) {
      return Response.json({ error: "target must be 'tagline', 'about', or 'both'." }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'AI service not configured.' }, { status: 500 })
    }

    const prompt = buildPrompt({ ...body, target })

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => '')
      return Response.json({ error: `AI call failed (${aiRes.status})`, detail: errText.slice(0, 200) }, { status: 502 })
    }

    const aiData = await aiRes.json()
    const raw = aiData.content?.map(c => c.text || '').join('') || '{}'

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      const m = raw.match(/\{[\s\S]*\}/)
      if (!m) {
        return Response.json({ error: 'AI returned malformed copy. Try again.' }, { status: 502 })
      }
      parsed = JSON.parse(m[0])
    }

    const out = {}
    if (typeof parsed.tagline === 'string') out.tagline = parsed.tagline.trim()
    if (typeof parsed.about === 'string') out.about = parsed.about.trim()
    return Response.json(out)
  } catch (err) {
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
