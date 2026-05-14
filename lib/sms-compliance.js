// SMS compliance helpers: marketing detection, footer injection, brand prefix,
// timezone-aware quiet hours. Used by /api/send-sms before every outbound to
// keep ServiceMind aligned with TCPA + carrier (TCR) rules at ISV scale.

const MARKETING_TRIGGERS = new Set([
  'win_back',
  'slow_day',
  'birthday',
  'promo',
  'broadcast',
])

export function isMarketingTrigger(triggerType) {
  return MARKETING_TRIGGERS.has(triggerType)
}

// US state → IANA timezone. For states with multiple zones, picks the dominant
// one (e.g. FL→Eastern even though the panhandle is Central). Good enough for
// quiet-hours enforcement; switch to per-salon `timezone` column when added.
const STATE_TIMEZONES = {
  AL: 'America/Chicago', AK: 'America/Anchorage', AZ: 'America/Phoenix',
  AR: 'America/Chicago', CA: 'America/Los_Angeles', CO: 'America/Denver',
  CT: 'America/New_York', DE: 'America/New_York', FL: 'America/New_York',
  GA: 'America/New_York', HI: 'Pacific/Honolulu', ID: 'America/Boise',
  IL: 'America/Chicago', IN: 'America/Indiana/Indianapolis', IA: 'America/Chicago',
  KS: 'America/Chicago', KY: 'America/New_York', LA: 'America/Chicago',
  ME: 'America/New_York', MD: 'America/New_York', MA: 'America/New_York',
  MI: 'America/Detroit', MN: 'America/Chicago', MS: 'America/Chicago',
  MO: 'America/Chicago', MT: 'America/Denver', NE: 'America/Chicago',
  NV: 'America/Los_Angeles', NH: 'America/New_York', NJ: 'America/New_York',
  NM: 'America/Denver', NY: 'America/New_York', NC: 'America/New_York',
  ND: 'America/Chicago', OH: 'America/New_York', OK: 'America/Chicago',
  OR: 'America/Los_Angeles', PA: 'America/New_York', RI: 'America/New_York',
  SC: 'America/New_York', SD: 'America/Chicago', TN: 'America/Chicago',
  TX: 'America/Chicago', UT: 'America/Denver', VT: 'America/New_York',
  VA: 'America/New_York', WA: 'America/Los_Angeles', WV: 'America/New_York',
  WI: 'America/Chicago', WY: 'America/Denver',
  DC: 'America/New_York', PR: 'America/Puerto_Rico',
}

export function getSalonTimezone(salon) {
  if (salon?.timezone) return salon.timezone
  const st = (salon?.state || '').trim().toUpperCase()
  return STATE_TIMEZONES[st] || 'America/New_York'
}

// TCPA quiet hours: messages may not be sent before 8 AM or after 9 PM
// recipient-local. Returns true if `now` falls outside that window.
export function isQuietHours(now, timezone) {
  const hour = Number(new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, hour: 'numeric', hour12: false,
  }).format(now))
  return hour < 8 || hour >= 21
}

// Brand prefix: "[ShopName]: …". Skips if message already starts with the shop
// name (case-insensitive) so we don't double-prefix templates that already
// include it.
export function addBrandPrefix(message, salon) {
  const name = (salon?.shop_name || '').trim()
  if (!name) return message
  const prefix = `${name}: `
  if (message.toLowerCase().startsWith(name.toLowerCase())) return message
  return prefix + message
}

const FOOTER = ' Reply STOP to opt out, HELP for help. Msg&data rates apply. Msg freq varies.'

// Marketing footer: appends opt-out + rate disclosure. Idempotent — skips if
// the message already contains "STOP" wording.
export function appendComplianceFooter(message, triggerType) {
  if (!isMarketingTrigger(triggerType)) return message
  if (/reply\s+stop/i.test(message)) return message
  return message + FOOTER
}

// One-call wrapper for outbound message prep.
export function prepareOutboundMessage(message, salon, triggerType) {
  let m = addBrandPrefix(message, salon)
  m = appendComplianceFooter(m, triggerType)
  return m
}
