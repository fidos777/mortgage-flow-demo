// lib/config/brand-tokens.ts
// BM-1: Snang.my Design Tokens
// Source of Truth: snang-my-brand-guidelines.docx §2.1, §3.1
// Logo: Confirmed DM Sans 600, "Snang.my" with teal text + amber dot

export const BRAND = {
  name: 'Snang.my',
  tagline: 'Semak Kelayakan Rumah, Tanpa Leceh',
  entity: 'SME Cloud Sdn Bhd',
  engine: 'Qontrek Authority Engine', // backend attribution
  prd: 'v3.6.1',

  colors: {
    // Primary: Teal (trust, calm, freshness)
    teal: {
      900: '#042F2E',
      700: '#115E59',
      600: '#0D9488', // ★ PRIMARY
      500: '#14B8A6',
      400: '#2DD4BF',
      300: '#5EEAD4',
      100: '#CCFBF1',
      50: '#F0FDFA',
    },
    // Accent: Amber (warmth, CTA, highlights)
    amber: {
      700: '#B45309',
      600: '#D97706',
      500: '#F59E0B', // ★ ACCENT
      400: '#FBBF24',
      300: '#FCD34D',
      100: '#FEF3C7',
      50: '#FFFBEB',
    },
    // Neutral: Slate
    slate: {
      900: '#0F172A',
      800: '#1E293B',
      700: '#334155',
      500: '#64748B',
      400: '#94A3B8',
      300: '#CBD5E1',
      200: '#E2E8F0',
      100: '#F1F5F9',
      50: '#F8FAFC',
    },
    // Semantic (unchanged)
    green: { 600: '#059669' },
    red: { 600: '#DC2626' },
    yellow: { 600: '#CA8A04' },
    blue: { 600: '#2563EB' },
  },

  fonts: {
    logo: "'DM Sans', sans-serif",       // Logo only
    display: "'Plus Jakarta Sans', sans-serif", // Headings
    body: "'Inter', sans-serif",          // Body text + UI
  },

  radii: {
    input: '8px',   // inputs, small elements
    card: '12px',   // cards, containers
    pill: '9999px', // badges, pills
  },
} as const;

// Convenience aliases
export const PRIMARY = BRAND.colors.teal[600];
export const ACCENT = BRAND.colors.amber[500];
export const DARK_BG = BRAND.colors.teal[900];

// CSS variable map (for injection into :root if needed)
export const CSS_VARS = {
  '--snang-primary': BRAND.colors.teal[600],
  '--snang-accent': BRAND.colors.amber[500],
  '--snang-dark': BRAND.colors.teal[900],
  '--snang-font-logo': BRAND.fonts.logo,
  '--snang-font-display': BRAND.fonts.display,
  '--snang-font-body': BRAND.fonts.body,
} as const;
