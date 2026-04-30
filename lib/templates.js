// Booking page visual templates. Each shop's `salons.template_id` selects one.
// Adding a template: add an entry below + update the Google Fonts link in app/layout.js.

export const TEMPLATES = {
  luxury: {
    name: 'Luxury Gold',
    description: 'Dark + gold, upscale spa. The original ServiceMind look.',
    swatchColors: ['#0a0a0a', '#C9A84C', '#eee'],
    colors: {
      bg: '#0a0a0a',
      surface: '#111',
      surface2: '#1a1a1a',
      text: '#eee',
      muted: '#777',
      accent: '#C9A84C',
      accentInk: '#0a0a0a',
      border: '#222',
    },
    fonts: {
      display: 'Cinzel',
      displayFallback: 'serif',
      body: 'Cormorant Garamond',
      bodyFallback: 'serif',
      ui: 'Jost',
      uiFallback: 'sans-serif',
    },
    style: {
      letterSpacingDisplay: '.35em',
      buttonRadius: 0,
      uppercase: true,
    },
  },

  classic_barber: {
    name: 'Classic Barber',
    description: 'Vintage Americana — barbershop red, cocoa, cream.',
    swatchColors: ['#1a120e', '#b22b2b', '#f5e8d4'],
    colors: {
      bg: '#0e0a08',
      surface: '#1a120e',
      surface2: '#221812',
      text: '#f5e8d4',
      muted: '#8a7f70',
      accent: '#b22b2b',
      accentInk: '#f5e8d4',
      border: '#322419',
    },
    fonts: {
      display: 'Oswald',
      displayFallback: 'sans-serif',
      body: 'Cormorant Garamond',
      bodyFallback: 'serif',
      ui: 'Jost',
      uiFallback: 'sans-serif',
    },
    style: {
      letterSpacingDisplay: '.25em',
      buttonRadius: 0,
      uppercase: true,
    },
  },

  urban_grit: {
    name: 'Urban Grit',
    description: 'Raw black, electric lime, brutalist edges.',
    swatchColors: ['#050505', '#c8ff00', '#ffffff'],
    colors: {
      bg: '#050505',
      surface: '#0e0e0e',
      surface2: '#181818',
      text: '#ffffff',
      muted: '#888',
      accent: '#c8ff00',
      accentInk: '#050505',
      border: '#1f1f1f',
    },
    fonts: {
      display: 'Space Grotesk',
      displayFallback: 'sans-serif',
      body: 'Space Grotesk',
      bodyFallback: 'sans-serif',
      ui: 'Jost',
      uiFallback: 'sans-serif',
    },
    style: {
      letterSpacingDisplay: '.18em',
      buttonRadius: 0,
      uppercase: true,
    },
  },

  clean_minimal: {
    name: 'Clean Minimal',
    description: 'Light, airy, lots of whitespace. The opposite of luxury.',
    swatchColors: ['#fafafa', '#0a0a0a', '#888'],
    colors: {
      bg: '#fafafa',
      surface: '#ffffff',
      surface2: '#f3f3f3',
      text: '#0a0a0a',
      muted: '#777',
      accent: '#0a0a0a',
      accentInk: '#fafafa',
      border: '#e5e5e5',
    },
    fonts: {
      display: 'Jost',
      displayFallback: 'sans-serif',
      body: 'Jost',
      bodyFallback: 'sans-serif',
      ui: 'Jost',
      uiFallback: 'sans-serif',
    },
    style: {
      letterSpacingDisplay: '.15em',
      buttonRadius: 0,
      uppercase: false,
    },
  },

  modern_bold: {
    name: 'Modern Bold',
    description: 'Black background, vibrant orange accent, oversized type.',
    swatchColors: ['#0a0a0a', '#ff5e1a', '#ffffff'],
    colors: {
      bg: '#0a0a0a',
      surface: '#141414',
      surface2: '#1f1f1f',
      text: '#ffffff',
      muted: '#999',
      accent: '#ff5e1a',
      accentInk: '#0a0a0a',
      border: '#2a2a2a',
    },
    fonts: {
      display: 'Space Grotesk',
      displayFallback: 'sans-serif',
      body: 'Cormorant Garamond',
      bodyFallback: 'serif',
      ui: 'Jost',
      uiFallback: 'sans-serif',
    },
    style: {
      letterSpacingDisplay: '.2em',
      buttonRadius: 0,
      uppercase: true,
    },
  },
}

export const TEMPLATE_LIST = Object.entries(TEMPLATES).map(([id, t]) => ({ id, ...t }))

export function getTemplate(id) {
  return TEMPLATES[id] || TEMPLATES.luxury
}
