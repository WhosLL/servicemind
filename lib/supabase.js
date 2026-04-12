'use client'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://sbhjuntwwyavdnpsgzjb.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiaGp1bnR3d3lhdmRucHNnempiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNTU2NzMsImV4cCI6MjA5MDkzMTY3M30.dl_6gY4ag0NdlI-yuDjijW_9uc9GP9E-eLp9snHLuZk'

let client = null
export const sb = () => {
  if (!client) client = createClient(SUPABASE_URL, SUPABASE_ANON)
  return client
}

export const DEFAULT_SERVICES = [
  { name: 'Signature Haircut', price: 40, category: 'core', is_addon: false, duration_minutes: 45, sort_order: 0, description: 'Customizable cut tailored to you' },
  { name: 'Beard Services', price: 40, category: 'core', is_addon: false, duration_minutes: 30, sort_order: 1, description: 'Shape, line & sculpt' },
  { name: 'Haircut + Beard Combo', price: 60, category: 'core', is_addon: false, duration_minutes: 60, sort_order: 2, description: 'Best value — both services' },
  { name: 'Razor Bald Head Shave', price: 70, category: 'luxury', is_addon: false, duration_minutes: 60, sort_order: 3, description: 'Straight razor precision finish' },
  { name: 'Haircut + Facial + Hot Towel', price: 150, category: 'luxury', is_addon: false, duration_minutes: 120, sort_order: 4, description: 'Full luxury treatment' },
  { name: 'VIP Outcall Appointment', price: 100, category: 'vip', is_addon: false, duration_minutes: 90, sort_order: 5, description: 'Brandon comes to you' },
  { name: 'Hot Towel', price: 10, category: 'addon', is_addon: true, duration_minutes: 0, sort_order: 6, description: '' },
  { name: 'Hair Enhancements', price: 10, category: 'addon', is_addon: true, duration_minutes: 0, sort_order: 7, description: '' },
  { name: 'Designs / Parts', price: 10, category: 'addon', is_addon: true, duration_minutes: 0, sort_order: 8, description: '' },
]
