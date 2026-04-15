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

const STATE_AREA_CODES = {
  AL:'205',AK:'907',AZ:'480',AR:'501',CA:'213',CO:'303',CT:'203',
  DE:'302',FL:'305',GA:'404',HI:'808',ID:'208',IL:'312',IN:'317',
  IA:'515',KS:'316',KY:'502',LA:'504',ME:'207',MD:'301',MA:'617',
  MI:'313',MN:'612',MS:'601',MO:'314',MT:'406',NE:'402',NV:'702',
  NH:'603',NJ:'201',NM:'505',NY:'212',NC:'919',ND:'701',OH:'216',
  OK:'405',OR:'503',PA:'215',RI:'401',SC:'803',SD:'605',TN:'615',
  TX:'214',UT:'801',VT:'802',VA:'703',WA:'206',WV:'304',WI:'414',WY:'307'
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

    const { salon_id } = await req.json()
    if (!salon_id) {
      return Response.json({ error: 'Missing salon_id' }, { status: 400 })
    }

    const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID
    const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN

    if (!TWILIO_SID || !TWILIO_TOKEN) {
      return Response.json({ error: 'SMS service not configured.' }, { status: 500 })
    }

    const { data: salon } = await sb
      .from('salons')
      .select('id, state, city, shop_name, twilio_phone_number')
      .eq('id', salon_id)
      .eq('user_id', user.id)
      .single()

    if (!salon) {
      return Response.json({ error: 'Salon not found' }, { status: 404 })
    }

    if (salon.twilio_phone_number) {
      return Response.json({ success: true, phone_number: salon.twilio_phone_number, already_provisioned: true })
    }

    const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')
    const areaCode = STATE_AREA_CODES[salon.state] || '919'

    let searchUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/AvailablePhoneNumbers/US/Local.json?AreaCode=${areaCode}&SmsEnabled=true&VoiceEnabled=true&Limit=1`
    let searchRes = await fetch(searchUrl, { headers: { 'Authorization': `Basic ${auth}` } })
    let searchData = await searchRes.json()

    if (!searchData.available_phone_numbers?.length) {
      const fallbackUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/AvailablePhoneNumbers/US/Local.json?SmsEnabled=true&VoiceEnabled=true&Limit=1`
      const fallbackRes = await fetch(fallbackUrl, { headers: { 'Authorization': `Basic ${auth}` } })
      searchData = await fallbackRes.json()
      if (!searchData.available_phone_numbers?.length) {
        return Response.json({ error: 'No phone numbers available.' }, { status: 400 })
      }
    }

    const chosenNumber = searchData.available_phone_numbers[0].phone_number

    const buyUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/IncomingPhoneNumbers.json`
    const buyRes = await fetch(buyUrl, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        PhoneNumber: chosenNumber,
        FriendlyName: `ServiceMind - ${salon.shop_name}`,
        SmsUrl: 'https://servicemind.vercel.app/api/sms/incoming',
        SmsMethod: 'POST',
        VoiceUrl: 'https://servicemind.vercel.app/api/calls/incoming',
        VoiceMethod: 'POST',
      }),
    })

    const buyData = await buyRes.json()
    if (!buyRes.ok) {
      return Response.json({ error: buyData.message || 'Failed to provision number' }, { status: 400 })
    }

    await sb.from('salons').update({ twilio_phone_number: buyData.phone_number }).eq('id', salon_id)

    return Response.json({
      success: true,
      phone_number: buyData.phone_number,
      friendly_name: buyData.friendly_name,
      already_provisioned: false
    })
  } catch (err) {
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

