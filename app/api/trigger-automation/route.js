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

function fillTemplate(template, vars) {
  let msg = template
  Object.entries(vars).forEach(([key, val]) => {
    msg = msg.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val == null ? '' : String(val))
  })
  return msg
}

export async function POST(req) {
  try {
    const sb = getSb()
    const body = await req.json()
    const { salon_id, trigger_type, client_phone, client_name, service_name, booking_date, time } = body

    if (!salon_id || !trigger_type) {
      return Response.json({ error: 'Missing salon_id or trigger_type' }, { status: 400 })
    }

    // Auth: accept either CRON_SECRET (internal/cron) or a user Bearer token whose user owns this salon
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

    const { data: salon } = await sb.from('salons').select('*').eq('id', salon_id).single()
    if (!salon) return Response.json({ error: 'Salon not found' }, { status: 404 })

    const { data: campaigns } = await sb
      .from('salon_campaigns')
      .select('*')
      .eq('salon_id', salon_id)
      .eq('campaign_type', trigger_type)
      .eq('is_active', true)

    if (!campaigns || campaigns.length === 0) {
      return Response.json({ message: 'No active campaigns for this trigger', sent: 0 })
    }

    const results = []

    for (const campaign of campaigns) {
      if (!campaign.message_template) continue

      const message = fillTemplate(campaign.message_template, {
        client_name: client_name || 'there',
        shop_name: salon.shop_name || '',
        owner_name: salon.owner_name || '',
        service_name: service_name || '',
        booking_date: booking_date || '',
        time: time || '',
        booking_link: `https://servicemind.io/book/${salon.slug}`,
        review_link: `https://servicemind.io/book/${salon.slug}#review`,
      })

      if (client_phone) {
        const smsRes = await fetch(new URL('/api/send-sms', req.url).href, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CRON_SECRET}`
          },
          body: JSON.stringify({ salon_id, to: client_phone, message, trigger_type, campaign_id: campaign.id })
        })
        const smsData = await smsRes.json()
        results.push({ campaign: campaign.name, phone: client_phone, ...smsData })

        await sb.from('salon_campaigns').update({
          send_count: (campaign.send_count || 0) + 1,
          last_sent_at: new Date().toISOString()
        }).eq('id', campaign.id)
      }

      if (!client_phone && ['win_back', 'slow_day'].includes(trigger_type)) {
        let clients = []
        if (trigger_type === 'win_back') {
          const cutoff = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
          const { data } = await sb.from('clients').select('*').eq('salon_id', salon_id).lt('last_visit_at', cutoff).not('phone', 'is', null).is('sms_opted_out_at', null)
          clients = data || []
        } else if (trigger_type === 'slow_day') {
          const { data } = await sb.from('clients').select('*').eq('salon_id', salon_id).not('phone', 'is', null).is('sms_opted_out_at', null).limit(50)
          clients = data || []
        }

        for (const client of clients) {
          const personalMsg = fillTemplate(campaign.message_template, {
            client_name: client.name || 'there', shop_name: salon.shop_name || '', owner_name: salon.owner_name || '',
            service_name: '', booking_date: '', time: '',
            booking_link: `https://servicemind.io/book/${salon.slug}`,
            review_link: `https://servicemind.io/book/${salon.slug}#review`,
          })
          const smsRes = await fetch(new URL('/api/send-sms', req.url).href, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.CRON_SECRET}`
            },
            body: JSON.stringify({ salon_id, to: client.phone, message: personalMsg, trigger_type, campaign_id: campaign.id })
          })
          const smsData = await smsRes.json()
          results.push({ campaign: campaign.name, phone: client.phone, ...smsData })
        }
        await sb.from('salon_campaigns').update({
          send_count: (campaign.send_count || 0) + clients.length,
          last_sent_at: new Date().toISOString()
        }).eq('id', campaign.id)
      }
    }

    return Response.json({ success: true, sent: results.length, results })
  } catch (err) {
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

