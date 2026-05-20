'use client'
import { useRef, useState } from 'react'
import { extractDominantColors } from './_extract-colors'

const MAX_W = 1920
const MAX_H = 1080
const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp'])

async function resizeImage(file) {
  if (!ALLOWED.has(file.type)) {
    throw new Error('Use a JPG, PNG, or WebP image.')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Image must be 8 MB or smaller.')
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error("Couldn't read that image. Try a different file."))
      el.src = objectUrl
    })

    const scale = Math.min(1, MAX_W / img.naturalWidth, MAX_H / img.naturalHeight)
    if (scale >= 1 && file.size <= MAX_BYTES) {
      return file
    }

    const w = Math.round(img.naturalWidth * scale)
    const h = Math.round(img.naturalHeight * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, w, h)

    const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const quality = outType === 'image/jpeg' ? 0.88 : undefined
    const blob = await new Promise(resolve => canvas.toBlob(resolve, outType, quality))
    if (!blob) throw new Error("Couldn't resize that image. Try a different file.")
    return new File([blob], file.name, { type: outType })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export default function HeroPhotoUpload({ value, onChange, onColors }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleFile = async (file) => {
    setErr('')
    if (!file) return
    setBusy(true)
    try {
      const sized = await resizeImage(file)
      const fd = new FormData()
      fd.append('file', sized, sized.name)
      const res = await fetch('/api/upload-hero-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed.')
      onChange(data.url)
      if (onColors) {
        // Best-effort: color extraction failure should not block upload success.
        try {
          const colors = await extractDominantColors(sized)
          if (colors.length) onColors(colors)
        } catch {}
      }
    } catch (e) {
      setErr(e.message || 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  const onPick = () => inputRef.current?.click()

  if (value) {
    return (
      <div>
        <div style={{
          position: 'relative',
          border: '1px solid var(--border-dim)',
          background: 'var(--dark-3)',
          aspectRatio: '16 / 9',
          overflow: 'hidden',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Your shop hero" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={onPick}
              disabled={busy}
              style={{ background: 'rgba(0,0,0,0.7)', color: 'var(--gold)', border: '1px solid var(--gold)', padding: '6px 12px', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', cursor: busy ? 'not-allowed' : 'pointer' }}
            >
              {busy ? 'Working...' : 'Replace'}
            </button>
            <button
              type="button"
              onClick={() => { setErr(''); onChange(null) }}
              disabled={busy}
              style={{ background: 'rgba(0,0,0,0.7)', color: 'var(--muted)', border: '1px solid var(--border-dim)', padding: '6px 12px', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', cursor: busy ? 'not-allowed' : 'pointer' }}
            >
              Remove
            </button>
          </div>
        </div>
        {err && <div style={{ fontSize: 11, color: '#ff7070', marginTop: 8 }}>{err}</div>}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; handleFile(f) }}
        />
      </div>
    )
  }

  return (
    <div>
      <div
        onClick={busy ? undefined : onPick}
        onDragOver={e => { e.preventDefault(); if (!busy) setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault()
          setDragOver(false)
          if (busy) return
          const f = e.dataTransfer.files?.[0]
          handleFile(f)
        }}
        style={{
          border: `1px dashed ${dragOver ? 'var(--gold)' : 'var(--border-dim)'}`,
          background: dragOver ? 'rgba(201,168,76,0.06)' : 'var(--dark-3)',
          padding: '36px 20px',
          textAlign: 'center',
          cursor: busy ? 'not-allowed' : 'pointer',
          transition: 'all .15s',
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>
          {busy ? 'Uploading...' : 'Drop a Photo or Click to Pick'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.7 }}>
          JPG, PNG, or WebP · up to 8 MB · resized to 1920×1080 max
        </div>
      </div>
      {err && <div style={{ fontSize: 11, color: '#ff7070', marginTop: 8 }}>{err}</div>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; handleFile(f) }}
      />
    </div>
  )
}
