import { createClient } from '@supabase/supabase-js'

let _client = null

export function getServiceClient() {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    const missing = [!url && 'NEXT_PUBLIC_SUPABASE_URL', !key && 'SUPABASE_SERVICE_ROLE_KEY'].filter(Boolean).join(', ')
    throw new Error(`Server misconfigured: ${missing} not set. Add to Vercel → Project → Settings → Environment Variables for the matching env.`)
  }
  _client = createClient(url, key, { auth: { persistSession: false } })
  return _client
}
