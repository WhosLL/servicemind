'use client'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
