// Tiny client-side dominant-color extractor. No deps.
// Quantizes pixels into 4 bits/channel buckets (4096 bins), drops near-black
// + near-white + grayish noise, returns the top N hex colors by frequency.

const SAMPLE_SIZE = 64   // canvas dim we sample at — small but representative
const TOP_N = 5
const NEAR_BLACK = 24
const NEAR_WHITE = 232
const GRAY_DELTA = 12    // max channel spread to be considered grayish noise

function bucket(c) {
  return c & 0xF0  // top 4 bits — collapses to 16 levels per channel
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

function isGrayish(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return (max - min) <= GRAY_DELTA
}

export async function extractDominantColors(imgOrFile) {
  let img
  let objectUrl = null
  try {
    if (imgOrFile instanceof Blob) {
      objectUrl = URL.createObjectURL(imgOrFile)
      img = await new Promise((resolve, reject) => {
        const el = new Image()
        el.onload = () => resolve(el)
        el.onerror = () => reject(new Error('Color extraction: image load failed.'))
        el.src = objectUrl
      })
    } else if (imgOrFile instanceof HTMLImageElement) {
      img = imgOrFile
    } else {
      throw new Error('extractDominantColors: pass a Blob/File or HTMLImageElement.')
    }

    const canvas = document.createElement('canvas')
    canvas.width = SAMPLE_SIZE
    canvas.height = SAMPLE_SIZE
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
    const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE)

    const counts = new Map()
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
      if (a < 200) continue
      const maxRgb = Math.max(r, g, b)
      const minRgb = Math.min(r, g, b)
      if (maxRgb < NEAR_BLACK) continue
      if (minRgb > NEAR_WHITE) continue
      if (isGrayish(r, g, b)) continue
      const key = (bucket(r) << 16) | (bucket(g) << 8) | bucket(b)
      counts.set(key, (counts.get(key) || 0) + 1)
    }

    const sorted = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_N)

    return sorted.map(([key]) => {
      const r = (key >> 16) & 0xFF
      const g = (key >> 8) & 0xFF
      const b = key & 0xFF
      return rgbToHex(r, g, b)
    })
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  }
}
