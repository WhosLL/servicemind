'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '../../../lib/supabase'
import '../../globals.css'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = sb().auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe()
        try {
          // Check if user already has a salon
          const { data: salon } = await sb()
            .from('salons')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle()

          if (salon) {
            // Returning user — route by role
            const { data: profile } = await sb()
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .maybeSingle()
            if (profile?.role === 'admin') return router.replace('/admin')
            if (profile?.role === 'rep') return router.replace('/rep')
            return router.replace('/dashboard')
          } else {
            // New OAuth user — send to onboard, skip auth step
            return router.replace('/onboard?oauth=true')
          }
        } catch {
          router.replace('/login')
        }
      }
    })

    // Fallback: if already signed in when page loads (e.g. implicit flow)
    sb().auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe()
        sb().from('salons').select('id').eq('user_id', session.user.id).maybeSingle()
          .then(({ data: salon }) => {
            if (salon) router.replace('/dashboard')
            else router.replace('/onboard?oauth=true')
          })
          .catch(() => router.replace('/login'))
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--black)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 10, letterSpacing: '.3em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Signing you in...
        </div>
      </div>
    </div>
  )
}
