// Booking page visual templates. Each shop's `salons.template_id` selects one.
// Templates carry full visual treatments: colors, fonts, gradients, hero composition,
// decorative SVG accents, and pattern overlays.
//
// Adding a template: add an entry below + update the Google Fonts link in app/layout.js
// if new font families are introduced.

// SVG patterns inlined as data URIs. Keep them small (kB matters for load).
const noisePattern = "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"
const gridFine = (color) => `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><path d='M 40 0 L 0 0 0 40' fill='none' stroke='${encodeURIComponent(color)}' stroke-width='1' opacity='0.4'/></svg>")`
const filigree = (color) => `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><g fill='none' stroke='${encodeURIComponent(color)}' stroke-width='0.5' opacity='0.18'><circle cx='40' cy='40' r='2'/><circle cx='40' cy='40' r='14'/><path d='M40 26 L40 18 M40 62 L40 54 M26 40 L18 40 M62 40 L54 40'/></g></svg>")`

export const TEMPLATES = {
  luxury: {
    name: 'Luxury Gold',
    description: 'Dark + gold, upscale spa. Refined and timeless.',
    swatchColors: ['#0a0a0a', '#C9A84C', '#1a1a1a'],
    colors: {
      bg: '#0a0a0a',
      surface: '#141111',
      surface2: '#1a1614',
      text: '#f0e6d2',
      muted: '#8a7d65',
      accent: '#C9A84C',
      accentInk: '#0a0a0a',
      border: '#2a221a',
    },
    fonts: {
      display: 'Cinzel',
      displayFallback: 'serif',
      body: 'Cormorant Garamond',
      bodyFallback: 'serif',
      ui: 'Jost',
      uiFallback: 'sans-serif',
    },
    decoration: {
      bgGradient: 'radial-gradient(ellipse 1200px 600px at 50% -10%, rgba(201,168,76,0.10), transparent 60%), linear-gradient(180deg, #0a0a0a 0%, #0a0a0a 100%)',
      bgPattern: filigree('#C9A84C'),
      heroAccent: { type: 'gold-line' },
      cardShadow: '0 1px 0 rgba(201,168,76,0.05) inset, 0 0 0 1px rgba(201,168,76,0.05)',
    },
    style: {
      letterSpacingDisplay: '.35em',
      buttonRadius: 0,
      uppercase: true,
    },
  },

  classic_barber: {
    name: 'Classic Barber',
    description: 'Vintage Americana — barbershop pole, cream + cocoa, hand-painted feel.',
    swatchColors: ['#1c1310', '#c83028', '#f4e4c8'],
    colors: {
      bg: '#15100d',
      surface: '#1f1814',
      surface2: '#28201a',
      text: '#f4e4c8',
      muted: '#9a8a78',
      accent: '#c83028',
      accentInk: '#f4e4c8',
      border: '#3a2c22',
    },
    fonts: {
      display: 'Oswald',
      displayFallback: 'sans-serif',
      body: 'Cormorant Garamond',
      bodyFallback: 'serif',
      ui: 'Jost',
      uiFallback: 'sans-serif',
    },
    decoration: {
      bgGradient: 'linear-gradient(180deg, #1c1310 0%, #15100d 50%, #15100d 100%)',
      bgPattern: 'none',
      heroAccent: { type: 'barber-pole' },
      cardShadow: '0 0 0 1px rgba(244,228,200,0.04)',
    },
    style: {
      letterSpacingDisplay: '.18em',
      buttonRadius: 2,
      uppercase: true,
    },
  },

  urban_grit: {
    name: 'Urban Grit',
    description: 'Brutalist — black + electric lime, raw edges, oversized type.',
    swatchColors: ['#050505', '#c8ff00', '#ffffff'],
    colors: {
      bg: '#050505',
      surface: '#0d0d0d',
      surface2: '#161616',
      text: '#ffffff',
      muted: '#888',
      accent: '#c8ff00',
      accentInk: '#050505',
      border: '#1a1a1a',
    },
    fonts: {
      display: 'Space Grotesk',
      displayFallback: 'sans-serif',
      body: 'Space Grotesk',
      bodyFallback: 'sans-serif',
      ui: 'Jost',
      uiFallback: 'sans-serif',
    },
    decoration: {
      bgGradient: 'linear-gradient(180deg, #0a0a0a 0%, #050505 100%)',
      bgPattern: noisePattern,
      heroAccent: { type: 'lime-bars' },
      cardShadow: 'none',
    },
    style: {
      letterSpacingDisplay: '.10em',
      buttonRadius: 0,
      uppercase: true,
    },
  },

  clean_minimal: {
    name: 'Clean Minimal',
    description: 'Light, airy, minimal. Ample whitespace, lowercase, single accent.',
    swatchColors: ['#fafaf7', '#0a0a0a', '#d8d4cc'],
    colors: {
      bg: '#fafaf7',
      surface: '#ffffff',
      surface2: '#f3f1ec',
      text: '#0a0a0a',
      muted: '#737373',
      accent: '#0a0a0a',
      accentInk: '#fafaf7',
      border: '#e5e2dc',
    },
    fonts: {
      display: 'Jost',
      displayFallback: 'sans-serif',
      body: 'Jost',
      bodyFallback: 'sans-serif',
      ui: 'Jost',
      uiFallback: 'sans-serif',
    },
    decoration: {
      bgGradient: 'linear-gradient(180deg, #ffffff 0%, #fafaf7 100%)',
      bgPattern: gridFine('#0a0a0a'),
      heroAccent: { type: 'thin-line' },
      cardShadow: '0 0 0 1px rgba(10,10,10,0.05)',
    },
    style: {
      letterSpacingDisplay: '.08em',
      buttonRadius: 999,
      uppercase: false,
    },
  },

  modern_bold: {
    name: 'Modern Bold',
    description: 'Neon orange on deep black. Oversized geometry, confident type.',
    swatchColors: ['#0a0a0a', '#ff5e1a', '#ffffff'],
    colors: {
      bg: '#0a0a0a',
      surface: '#141414',
      surface2: '#1c1c1c',
      text: '#ffffff',
      muted: '#999',
      accent: '#ff5e1a',
      accentInk: '#0a0a0a',
      border: '#262626',
    },
    fonts: {
      display: 'Space Grotesk',
      displayFallback: 'sans-serif',
      body: 'Cormorant Garamond',
      bodyFallback: 'serif',
      ui: 'Jost',
      uiFallback: 'sans-serif',
    },
    decoration: {
      bgGradient: 'radial-gradient(circle at 100% 0%, rgba(255,94,26,0.18) 0%, transparent 50%), linear-gradient(180deg, #0a0a0a 0%, #050505 100%)',
      bgPattern: 'none',
      heroAccent: { type: 'orange-circle' },
      cardShadow: '0 0 0 1px rgba(255,255,255,0.04)',
    },
    style: {
      letterSpacingDisplay: '.15em',
      buttonRadius: 4,
      uppercase: true,
    },
  },
}

export const TEMPLATE_LIST = Object.entries(TEMPLATES).map(([id, t]) => ({ id, ...t }))

export function getTemplate(id) {
  return TEMPLATES[id] || TEMPLATES.luxury
}

// Hero accent renderer — returns inline JSX-like style block + content for the hero header.
// Pure data; the booking page decides how to render based on the type.
export function heroAccentDef(type, accent) {
  switch (type) {
    case 'gold-line':
      return { type, height: 1, width: 60, color: accent, opacity: 0.6 }
    case 'barber-pole':
      // 6px diagonal stripes — red/white/blue at top of hero
      return { type, gradient: `repeating-linear-gradient(45deg, ${accent} 0px, ${accent} 8px, #f4e4c8 8px, #f4e4c8 16px, #1d4ed8 16px, #1d4ed8 24px, #f4e4c8 24px, #f4e4c8 32px)`, height: 4 }
    case 'lime-bars':
      return { type, color: accent, height: 6, count: 3, gap: 4 }
    case 'thin-line':
      return { type, color: accent, height: 1, width: 32, opacity: 0.3 }
    case 'orange-circle':
      return { type, color: accent, size: 8, opacity: 1 }
    default:
      return null
  }
}
