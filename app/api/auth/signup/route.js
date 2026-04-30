import { createClient } from '@supabase/supabase-js'

let _supabaseAdmin
function getAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }
  return _supabaseAdmin
}

const DEFAULT_CAMPAIGNS = (id) => [
  { salon_id: id, campaign_type: 'missed_call', name: 'Missed Call Text Back', is_active: true, message_template: "Hey! You just missed us at {{shop_name}}. Ready to book? Reply here or tap: {{booking_link}}" },
  { salon_id: id, campaign_type: 'reminder_24h', name: 'Appointment Reminder (24hr)', is_active: true, message_template: "Reminder: You have an appointment at {{shop_name}} tomorrow at {{time}}. Reply CANCEL to reschedule." },
  { salon_id: id, campaign_type: 'reminder_1h', name: 'Appointment Reminder (1hr)', is_active: true, message_template: "See you soon! Your appointment at {{shop_name}} starts in 1 hour at {{time}}." },
  { salon_id: id, campaign_type: 'review_request', name: 'Post-Appointment Review', is_active: true, message_template: "Thanks for coming in! Mind leaving us a quick review? {{review_link}}" },
  { salon_id: id, campaign_type: 'win_back', name: 'Win-Back (45 Days)', is_active: true, message_template: "{{shop_name}}: We miss you! Come back this week and save 10%: {{booking_link}} Reply STOP to opt out." },
  { salon_id: id, campaign_type: 'birthday', name: 'Birthday Special', is_active: true, message_template: "{{shop_name}}: Happy Birthday! $5 off your next visit this month: {{booking_link}} Reply STOP to opt out." },
  { salon_id: id, campaign_type: 'slow_day', name: 'Slow Day Blast', is_active: false, message_template: "{{shop_name}}: Spots just opened today! Book now: {{booking_link}} Reply STOP to opt out." },
  { salon_id: id, campaign_type: 'no_show', name: 'No-Show Follow-up', is_active: true, message_template: "{{shop_name}}: You missed your appointment — no worries! Rebook anytime: {{booking_link}}" },
]

export async function POST(req) {
  try {
    const supabaseAdmin = getAdmin()
    const body = await req.json()
    const { email, password, salonData } = body

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) {
      if (authError.message?.includes('already been registered')) {
        return Response.json({ error: 'An account with this email already exists. Please log in instead.' }, { status: 409 })
      }
      return Response.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user.id

    if (salonData) {
      const services = salonData._services || []
      delete salonData._services
      delete salonData._campaigns

      const { data: salon, error: salonError } = await supabaseAdmin
        .from('salons')
        .insert([{ ...salonData, user_id: userId }])
        .select()

      if (salonError) {
        await supabaseAdmin.auth.admin.deleteUser(userId)
        return Response.json({ error: 'Failed to create salon: ' + salonError.message }, { status: 500 })
      }

      const salonId = salon[0].id

      if (services.length > 0) {
        await supabaseAdmin.from('salon_services').insert(
          services.map((s, i) => ({ ...s, salon_id: salonId, sort_order: i }))
        )
      }

      await supabaseAdmin.from('salon_campaigns').insert(DEFAULT_CAMPAIGNS(salonId))

      return Response.json({ success: true, user_id: userId, salon: salon[0] })
    }

    return Response.json({ success: true, user_id: userId })
  } catch (err) {
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
