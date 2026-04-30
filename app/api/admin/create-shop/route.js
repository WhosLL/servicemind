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

function adminUserIds() {
  return (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
}

async function requireAdmin(req) {
  const authHeader = req.headers.get('authorization') || ''
  if (!authHeader.startsWith('Bearer ')) return { ok: false, status: 401, error: 'Unauthorized' }
  const token = authHeader.replace('Bearer ', '')
  const sb = getSb()
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return { ok: false, status: 401, error: 'Invalid session' }
  const allowed = adminUserIds()
  if (allowed.length === 0) return { ok: false, status: 500, error: 'ADMIN_USER_IDS not configured' }
  if (!allowed.includes(user.id)) return { ok: false, status: 403, error: 'Forbidden' }
  return { ok: true, user }
}

function slugify(name) {
  return (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
}

const DEFAULT_CAMPAIGNS = (id) => [
  { salon_id: id, campaign_type: 'missed_call', name: 'Missed Call Text Back', is_active: true, message_template: "Hey! You just missed us at {{shop_name}}. Ready to book? Reply here or tap: {{booking_link}}" },
  { salon_id: id, campaign_type: 'reminder_24h', name: 'Appointment Reminder (24hr)', is_active: true, message_template: "Reminder: You have an appointment at {{shop_name}} tomorrow at {{time}}. Reply CANCEL to reschedule." },
  { salon_id: id, campaign_type: 'reminder_1h', name: 'Appointment Reminder (1hr)', is_active: true, message_template: "See you soon! Your appointment at {{shop_name}} starts in 1 hour at {{time}}." },
  { salon_id: id, campaign_type: 'review_request', name: 'Post-Appointment Review', is_active: false, message_template: "{{shop_name}}: Thanks for coming in! Tap to share how it went: {{review_link}} Reply STOP to opt out." },
  { salon_id: id, campaign_type: 'win_back', name: 'Win-Back (45 Days)', is_active: true, message_template: "{{shop_name}}: We miss you! Come back this week and save 10%: {{booking_link}} Reply STOP to opt out." },
  { salon_id: id, campaign_type: 'slow_day', name: 'Slow Day Blast', is_active: true, message_template: "{{shop_name}}: Spots just opened today! Book now: {{booking_link}} Reply STOP to opt out." },
  { salon_id: id, campaign_type: 'no_show', name: 'No-Show Follow-up', is_active: true, message_template: "{{shop_name}}: You missed your appointment — no worries! Rebook anytime: {{booking_link}}" },
]

const DEFAULT_SERVICES = (salonId) => [
  { salon_id: salonId, name: 'Haircut', category: 'core', price: 35, duration_minutes: 30, is_addon: false, sort_order: 0 },
  { salon_id: salonId, name: 'Beard Trim', category: 'core', price: 15, duration_minutes: 15, is_addon: false, sort_order: 1 },
  { salon_id: salonId, name: 'Cut + Beard', category: 'core', price: 45, duration_minutes: 45, is_addon: false, sort_order: 2 },
  { salon_id: salonId, name: 'Kids Cut', category: 'core', price: 25, duration_minutes: 25, is_addon: false, sort_order: 3 },
]

export async function POST(req) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })

  try {
    const sb = getSb()
    const body = await req.json()
    const { shop_name, owner_name, owner_email, owner_phone, salon_type, city, state, address, zip, trial_days } = body

    if (!shop_name?.trim() || !owner_name?.trim()) {
      return Response.json({ error: 'shop_name and owner_name are required' }, { status: 400 })
    }

    let baseSlug = slugify(shop_name)
    if (!baseSlug) return Response.json({ error: 'Cannot derive a slug from shop_name' }, { status: 400 })

    // Ensure slug uniqueness
    let slug = baseSlug
    let attempt = 0
    while (true) {
      const { data: existing } = await sb.from('salons').select('id').eq('slug', slug).maybeSingle()
      if (!existing) break
      attempt++
      slug = `${baseSlug}-${attempt + 1}`
      if (attempt > 50) return Response.json({ error: 'Could not find unique slug' }, { status: 500 })
    }

    const trialEnd = new Date(Date.now() + (Number(trial_days) || 365) * 24 * 60 * 60 * 1000).toISOString()

    const { data: salonRows, error: salonErr } = await sb
      .from('salons')
      .insert([{
        shop_name: shop_name.trim(),
        owner_name: owner_name.trim(),
        email: owner_email?.trim() || null,
        phone: owner_phone?.trim() || null,
        personal_phone: owner_phone?.trim() || null,
        salon_type: salon_type || 'barbershop',
        slug,
        city: city?.trim() || null,
        state: state?.trim() || null,
        address: address?.trim() || null,
        zip: zip?.trim() || null,
        subscription_status: 'trial',
        subscription_tier: 'basic',
        trial_ends_at: trialEnd,
        onboarded: true,
        onboarded_at: new Date().toISOString(),
      }])
      .select()

    if (salonErr) return Response.json({ error: 'Failed to create salon: ' + salonErr.message }, { status: 500 })

    const salon = salonRows[0]

    await sb.from('salon_services').insert(DEFAULT_SERVICES(salon.id))
    await sb.from('salon_campaigns').insert(DEFAULT_CAMPAIGNS(salon.id))

    return Response.json({ success: true, id: salon.id, slug: salon.slug, shop_name: salon.shop_name })
  } catch (err) {
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
