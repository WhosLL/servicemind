// Booking page visual templates. Each shop's `salons.template_id` selects one.
// Templates carry full visual treatments: colors, fonts, gradients, decorative
// SVG illustrations, and pattern overlays.
//
// To add a template: add an entry below + a render branch in `renderTemplateScene`
// inside app/app/book/[slug]/page.js + ensure fonts are loaded in app/app/layout.js.
//
// Per-shop overrides:
//   - salons.hero_image_url replaces the template's default scene with a dramatic
//     full-width photo of the shop (or anything the barber wants).
//   - salons.instagram (existing) renders an "Instagram" link button below the shop name.

export const TEMPLATES = {
  beach: {
    name: 'Beach',
    description: 'Sand, ocean, sunset coral. Wave-shaped header. Coastal salon vibe.',
    swatchColors: ['#f4e7d3', '#1e88a8', '#ff7e5f'],
    colors: {
      bg: '#f4e7d3',
      surface: '#ffffff',
      surface2: '#f9efde',
      text: '#1a3a4a',
      muted: '#7a8a8f',
      accent: '#1e88a8',
      accentInk: '#ffffff',
      accentSecondary: '#ff7e5f',
      border: '#e0d4be',
    },
    fonts: {
      display: 'Cormorant Garamond',
      displayFallback: 'serif',
      body: 'Jost',
      bodyFallback: 'sans-serif',
      ui: 'Jost',
      uiFallback: 'sans-serif',
    },
    decoration: {
      bgGradient: 'linear-gradient(180deg, #b6dfe8 0%, #f4e7d3 35%, #f4e7d3 100%)',
      scene: 'beach',
    },
    style: {
      letterSpacingDisplay: '.18em',
      buttonRadius: 999,
      uppercase: false,
    },
  },

  mountain: {
    name: 'Mountain',
    description: 'Deep evergreen, snow, slate. Peak silhouette skyline. Cabin/lodge vibe.',
    swatchColors: ['#1a2e2e', '#dde8e3', '#5a7a83'],
    colors: {
      bg: '#0f1f1f',
      surface: '#172d2d',
      surface2: '#1f3838',
      text: '#dde8e3',
      muted: '#8aa0a0',
      accent: '#a8c9c5',
      accentInk: '#0f1f1f',
      accentSecondary: '#d8b76e',
      border: '#243d3d',
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
      bgGradient: 'linear-gradient(180deg, #1f3838 0%, #0f1f1f 60%, #0a1414 100%)',
      scene: 'mountain',
    },
    style: {
      letterSpacingDisplay: '.22em',
      buttonRadius: 0,
      uppercase: true,
    },
  },

  urban_edge: {
    name: 'Urban Edge',
    description: 'Concrete, neon cyan, city silhouette. Brooklyn / SoHo barbershop energy.',
    swatchColors: ['#0a0a0a', '#00d4ff', '#262626'],
    colors: {
      bg: '#0a0a0a',
      surface: '#141414',
      surface2: '#1c1c1c',
      text: '#ffffff',
      muted: '#888',
      accent: '#00d4ff',
      accentInk: '#0a0a0a',
      accentSecondary: '#ff2a6d',
      border: '#262626',
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
      bgGradient: 'radial-gradient(ellipse 800px 400px at 50% 0%, rgba(0,212,255,0.12) 0%, transparent 60%), linear-gradient(180deg, #0a0a0a 0%, #050505 100%)',
      scene: 'skyline',
    },
    style: {
      letterSpacingDisplay: '.10em',
      buttonRadius: 0,
      uppercase: true,
    },
  },

  classic_barber: {
    name: 'Classic Barber',
    description: 'Sepia, cream, burgundy red. Vintage barber pole + scissor motifs.',
    swatchColors: ['#1f1410', '#8b2635', '#f4e4c8'],
    colors: {
      bg: '#1f1410',
      surface: '#291a14',
      surface2: '#33221c',
      text: '#f4e4c8',
      muted: '#a0907a',
      accent: '#c83028',
      accentInk: '#f4e4c8',
      accentSecondary: '#d8b76e',
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
      bgGradient: 'linear-gradient(180deg, #2a1c14 0%, #1f1410 60%, #1a0f0c 100%)',
      scene: 'barbershop',
    },
    style: {
      letterSpacingDisplay: '.18em',
      buttonRadius: 2,
      uppercase: true,
    },
  },

  luxury: {
    name: 'Luxury Gold',
    description: 'Dark + gold, art-deco arches. Upscale spa / high-end men\'s grooming.',
    swatchColors: ['#0a0a0a', '#C9A84C', '#1a1a1a'],
    colors: {
      bg: '#0a0a0a',
      surface: '#141111',
      surface2: '#1a1614',
      text: '#f0e6d2',
      muted: '#8a7d65',
      accent: '#C9A84C',
      accentInk: '#0a0a0a',
      accentSecondary: '#dfc485',
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
      bgGradient: 'radial-gradient(ellipse 1200px 600px at 50% -10%, rgba(201,168,76,0.12), transparent 60%), linear-gradient(180deg, #0a0a0a 0%, #0a0a0a 100%)',
      scene: 'art_deco',
    },
    style: {
      letterSpacingDisplay: '.35em',
      buttonRadius: 0,
      uppercase: true,
    },
  },
}

export const TEMPLATE_LIST = Object.entries(TEMPLATES).map(([id, t]) => ({ id, ...t }))

export function getTemplate(id) {
  return TEMPLATES[id] || TEMPLATES.luxury
}
