'use client'
import { useState, useEffect } from 'react'
import '../../globals.css'

const gold = '#C9A84C', dark = '#0a0a0a', dark2 = '#111', dark3 = '#1a1a1a', muted = '#777', border = '#222'

export default function ReviewPage({ params }) {
  const { appointmentId } = params
  const [info, setInfo] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)

  const [stars, setStars] = useState(0)
  const [hoverStars, setHoverStars] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/review/${appointmentId}`)
        const data = await res.json()
        if (!res.ok) {
          if (res.status === 404) setNotFound(true)
          else setError(data.error || 'Could not load')
          return
        }
        setInfo(data)
        if (data.already_reviewed) setAlreadyReviewed(true)
      } catch (e) {
        setError(e.message || 'Network error')
      }
    }
    if (appointmentId) load()
  }, [appointmentId])

  const submit = async () => {
    if (!stars) return
    setSubmitting(true); setError('')
    try {
      const res = await fetch(`/api/review/${appointmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stars, review_text: comment, author_name: info?.appointment?.client_name })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Submission failed')
        setSubmitting(false)
        return
      }
      setSubmitted(data)
    } catch (e) {
      setError(e.message || 'Network error')
    }
    setSubmitting(false)
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', background: dark, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{ fontSize: 48, color: gold, marginBottom: 20 }}>404</div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, color: '#eee', marginBottom: 12 }}>Review link not found</div>
          <div style={{ color: muted, fontSize: 13 }}>This link may have expired or been mistyped.</div>
        </div>
      </div>
    )
  }

  if (!info) {
    return (
      <div style={{ minHeight: '100vh', background: dark, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: gold, fontSize: 12, letterSpacing: '.3em', textTransform: 'uppercase', fontFamily: 'Cinzel, serif' }}>Loading...</div>
      </div>
    )
  }

  if (alreadyReviewed) {
    return (
      <div style={{ minHeight: '100vh', background: dark, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 48, color: gold, marginBottom: 20 }}>✓</div>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 11, color: gold, letterSpacing: '.3em', marginBottom: 16 }}>ALREADY SUBMITTED</div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, color: '#eee', fontWeight: 300, marginBottom: 12 }}>You've already reviewed this visit.</div>
          <div style={{ color: muted, fontSize: 13 }}>Thanks for the feedback!</div>
        </div>
      </div>
    )
  }

  if (submitted) {
    if (submitted.stars >= 4 && submitted.google_review_url) {
      return (
        <div style={{ minHeight: '100vh', background: dark, padding: '60px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: 440 }}>
            <div style={{ fontSize: 48, color: gold, marginBottom: 20 }}>★★★★★</div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 11, color: gold, letterSpacing: '.3em', marginBottom: 16 }}>THANK YOU</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, color: '#eee', fontWeight: 300, marginBottom: 24, lineHeight: 1.2 }}>
              Mind sharing on <em style={{ color: gold, fontStyle: 'italic' }}>Google?</em>
            </div>
            <div style={{ color: muted, fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
              It really helps {submitted.shop_name} reach more clients like you. Takes 30 seconds.
            </div>
            <a href={submitted.google_review_url} target="_blank" rel="noreferrer"
              style={{ display: 'inline-block', padding: '16px 36px', background: gold, color: dark, fontSize: 12, letterSpacing: '.2em', textTransform: 'uppercase', textDecoration: 'none', fontFamily: 'Cinzel, serif', marginBottom: 16 }}>
              Leave a Google Review
            </a>
            <div style={{ fontSize: 11, color: muted }}>(Opens in a new tab — your review is already saved either way.)</div>
          </div>
        </div>
      )
    }
    if (submitted.stars >= 4) {
      return (
        <div style={{ minHeight: '100vh', background: dark, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ fontSize: 48, color: gold, marginBottom: 20 }}>★★★★★</div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 11, color: gold, letterSpacing: '.3em', marginBottom: 16 }}>THANK YOU</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, color: '#eee', fontWeight: 300, marginBottom: 12 }}>Your review has been saved.</div>
            <div style={{ color: muted, fontSize: 13 }}>Appreciate the feedback.</div>
          </div>
        </div>
      )
    }
    return (
      <div style={{ minHeight: '100vh', background: dark, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 11, color: gold, letterSpacing: '.3em', marginBottom: 16 }}>FEEDBACK SAVED</div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, color: '#eee', fontWeight: 300, marginBottom: 16 }}>Sorry your visit wasn't great.</div>
          <div style={{ color: muted, fontSize: 14, lineHeight: 1.7 }}>The owner has been notified privately and will reach out. We don't share low-star feedback publicly.</div>
        </div>
      </div>
    )
  }

  const StarBtn = ({ n }) => {
    const filled = (hoverStars || stars) >= n
    return (
      <button onClick={() => setStars(n)} onMouseEnter={() => setHoverStars(n)} onMouseLeave={() => setHoverStars(0)}
        style={{ background: 'none', border: 'none', fontSize: 44, cursor: 'pointer', color: filled ? gold : '#333', padding: '4px 6px', transition: 'color .15s' }}>
        ★
      </button>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: dark, padding: '60px 20px' }}>
      <div style={{ maxWidth: 460, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: 10, color: gold, letterSpacing: '.35em', marginBottom: 10 }}>SERVICEMIND</div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, color: '#eee', fontWeight: 300, lineHeight: 1.15 }}>{info.salon.shop_name}</div>
          <div style={{ fontSize: 12, color: muted, marginTop: 8 }}>
            {info.appointment.service_name} · {new Date(info.appointment.appointment_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div style={{ background: dark2, border: `1px solid ${border}`, padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#eee', marginBottom: 18 }}>How was your visit, {info.appointment.client_name?.split(' ')[0] || 'friend'}?</div>
          <div style={{ marginBottom: 24, lineHeight: 1 }}>
            {[1, 2, 3, 4, 5].map(n => <StarBtn key={n} n={n} />)}
          </div>
          {stars > 0 && (
            <>
              <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4}
                placeholder={stars >= 4 ? 'Anything to add? (optional)' : 'What could we have done better?'}
                style={{ width: '100%', padding: '12px 14px', background: dark3, border: `1px solid ${border}`, color: '#eee', fontSize: 13, outline: 'none', resize: 'none', fontFamily: 'inherit', marginBottom: 16, boxSizing: 'border-box' }} />
              {error && <div style={{ color: '#ff7070', fontSize: 12, marginBottom: 12 }}>{error}</div>}
              <button onClick={submit} disabled={submitting}
                style={{ width: '100%', padding: 16, background: gold, border: 'none', color: dark, fontSize: 12, letterSpacing: '.2em', textTransform: 'uppercase', fontFamily: 'Cinzel, serif', cursor: 'pointer', opacity: submitting ? 0.5 : 1 }}>
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </>
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: muted }}>
          Reviews help small businesses. Thank you.
        </div>
      </div>
    </div>
  )
}
