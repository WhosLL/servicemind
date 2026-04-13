import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  'https://sbhjuntwwyavdnpsgzjb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiaGp1bnR3d3lhdmRucHNnempiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNTU2NzMsImV4cCI6MjA5MDkzMTY3M30.dl_6gY4ag0NdlI-yuDjijW_9uc9GP9E-eLp9snHLuZk'
)

// Replace template variables in message
function fillTemplate(template, vars) {
  let msg = template
  Object.entries(vars).forEach(([key, val]) => {
    msg = msg.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val || '')
  })
  return msg
}

export async function POST(req) {
  try {
    const { salon_id, trigger_type, client_phone, client_name, service_name, booking_date } = await req.json()

    if (!salon_id || !trigger_type) {
      return Response.json({ error: 'Missing salon_id or trigger_type' }, { status: 400 })
    }

    // Get salon info
    const { data: salon } = await sb.from('salons').select('*').eq('id', salon_id).single()
    if (!salon) return Response.json({ error: 'Salon not found' }, { status: 404 })

    // Get active campaigns matching this trigger
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

      // Build the message from template
      const message = fillTemplate(campaign.message_template, {
        client_name: client_name || 'there',
        shop_name: salon.shop_name || '',
        owner_name: salon.owner_name || '',
        service_name: service_name || '',
        booking_date: booking_date || '',
      })

      // If we have a specific client phone, send to them
      if (client_phone) {
        const smsRes = await fetch(new URL('/api/send-sms', req.url).href, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            salon_id,
            to: client_phone,
            message,
            trigger_type,
            campaign_id: campaign.id
          })
        })
        const smsData = await smsRes.json()
        results.push({ campaign: campaign.name, phone: client_phone, ...smsData })

        // Update send count
        await sb.from('salon_campaigns').update({
          send_count: (campaign.send_count || 0) + 1,
          last_sent_at: new Date().toISOString()
        }).eq('id', campaign.id)
      }

      // For bulk triggers (win_back, birthday, slow_day), find matching clients
      if (!client_phone && ['win_back', 'birthday', 'slow_day'].includes(trigger_type)) {
        let clients = []

        if (trigger_type === 'win_back') {
          // Clients who haven't visited in 45+ days
          const cutoff = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
          const { data: lapsed } = await sb.from('clients').select('*')
            .eq('salon_id', salon_id)
            .lt('last_visit_at', cutoff)
            .not('phone', 'is', null)
          clients = lapsed || []
        } else if (trigger_type === 'birthday') {
          // Clients with birthday today (requires birthday field)
          const today = new Date()
          const monthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
          const { data: bdays } = await sb.from('clients').select('*')
            .eq('salon_id', salon_id)
            .like('birthday', `%${monthDay}`)
            .not('phone', 'is', null)
          clients = bdays || []
        } else if (trigger_type === 'slow_day') {
          // Send to all clients with a phone number
          const { data: all } = await sb.from('clients').select('*')
            .eq('salon_id', salon_id)
            .not('phone', 'is', null)
            .limit(50)
          clients = all || []
        }

        for (const client of clients) {
          const personalMsg = fillTemplate(campaign.message_template, {
            client_name: client.name || 'there',
            shop_name: salon.shop_name || '',
            owner_name: salon.owner_name || '',
            service_name: '',
            booking_date: '',
          })

          const smsRes = await fetch(new URL('/api/send-sms', req.url).href, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              salon_id,
              to: client.phone,
              message: personalMsg,
              trigger_type,
              campaign_id: campaign.id
            })
          })
          const smsData = await smsRes.json()
          results.push({ campaign: campaign.name, phone: client.phone, ...smsData })
        }

        // Update send count
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
