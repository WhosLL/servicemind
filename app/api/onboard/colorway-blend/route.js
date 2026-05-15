// Unauth: blends the template's palette with dominant colors extracted from
// the owner's uploaded hero photo. Called from Step 5 after upload + on
// re-roll. No persistence — chosen overrides are bundled into salonData at
// Activate.
//
// Inputs (POST JSON):
//   template_id    string                    required
//   photo_colors   string[] (hex, length 1-8) required
//   seed           number                    optional (re-roll variance)
//
// Output: { overrides: { accent?, accentSecondary? } }

import { TEMPLATES } from '../../../../lib/templates'

const MODEL = 'claude-sonnet-4-6'
const ALLOWED_KEYS = new Set(['accent', 'accentSecondary'])

function isHex(s) {
  return typeof s === 'string' && /^#[0-9a-fA-F]{6}$/.test(s)
}

function buildPrompt({ templateColors, photoColors, seed }) {
  const variance = typeof seed === 'number' && seed > 0
    ? `\nThis is re-roll #${seed}. Pick choices that are visibly different from a first-pass safe blend — push slightly bolder or in a different direction along the photo's palette.`
    : ''

  return `You're a brand colorist. The owner of a small service business uploaded a hero photo. You're going to blend the photo's mood into a fixed visual template by overriding two palette slots.

Template palette (the rest of these stay fixed — text, background, borders, surfaces — so legibility is preserved):
${JSON.stringify(templateColors, null, 2)}

Dominant colors from the owner's photo, ordered most → least frequent:
${photoColors.join(', ')}

Your job: return JSON overrides for these slots:
- "accent" — primary brand accent. Used on buttons, links, key prices. Must contrast strongly against the template bg (${templateColors.bg}). Should feel like it belongs to the photo's palette.
- "accentSecondary" — secondary highlight. Used for small flourishes. Can be a complementary or analogous color to the accent.

Constraints:
- Both values must be valid 6-digit hex strings.
- Do NOT override bg, surface, text, muted, border, accentInk — those are fixed.
- If the photo is monochrome or muddy, prefer leaning the template's existing accent slightly toward any visible hue rather than picking a low-saturation override.
- No commentary, no markdown, no code fences.${variance}

Return ONLY:
{
  "accent": "#xxxxxx",
  "accentSecondary": "#xxxxxx"
}`
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { template_id, photo_colors, seed } = body

    const tpl = TEMPLATES[template_id]
    if (!tpl) {
      return Response.json({ error: 'Unknown template_id.' }, { status: 400 })
    }
    if (!Array.isArray(photo_colors) || photo_colors.length === 0 || !photo_colors.every(isHex)) {
      return Response.json({ error: 'photo_colors must be a non-empty array of #rrggbb hex strings.' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'AI service not configured.' }, { status: 500 })
    }

    const prompt = buildPrompt({
      templateColors: tpl.colors,
      photoColors: photo_colors.slice(0, 8),
      seed,
    })

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 200,
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
        return Response.json({ error: 'AI returned malformed colorway. Try again.' }, { status: 502 })
      }
      parsed = JSON.parse(m[0])
    }

    const overrides = {}
    for (const k of Object.keys(parsed)) {
      if (ALLOWED_KEYS.has(k) && isHex(parsed[k])) {
        overrides[k] = parsed[k]
      }
    }
    if (Object.keys(overrides).length === 0) {
      return Response.json({ error: 'AI returned no usable overrides.' }, { status: 502 })
    }

    return Response.json({ overrides })
  } catch (err) {
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
