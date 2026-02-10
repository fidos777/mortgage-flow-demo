/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      spacing: {
        'touch': '44px',
        'touch-lg': '48px',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
      },
      minHeight: {
        'touch': '44px',
        'touch-lg': '48px',
      },
      minWidth: {
        'touch': '44px',
        'touch-lg': '48px',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        logo: ['DM Sans', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        // PRIMARY ALIASES (for v3 components)
        primary: {
          DEFAULT: '#0D9488',  // teal-600
          light: '#14B8A6',    // teal-500
          dark: '#115E59',     // teal-700
        },
        secondary: {
          DEFAULT: '#F59E0B',  // amber-500
          light: '#FBBF24',    // amber-400
          dark: '#D97706',     // amber-600
        },
        // Legacy
        qontrek: {
          orange: '#f97316',
          slate: '#1e293b',
        },
        // BM-1: Snang.my brand colors
        snang: {
          'teal-900': '#042F2E',
          'teal-700': '#115E59',
          'teal-600': '#0D9488',
          'teal-500': '#14B8A6',
          'teal-400': '#2DD4BF',
          'teal-300': '#5EEAD4',
          'teal-100': '#CCFBF1',
          'teal-50': '#F0FDFA',
          'amber-700': '#B45309',
          'amber-600': '#D97706',
          'amber-500': '#F59E0B',
          'amber-400': '#FBBF24',
          'amber-300': '#FCD34D',
          'amber-100': '#FEF3C7',
          'amber-50': '#FFFBEB',
        },
      },
      borderRadius: {
        'snang-input': '8px',
        'snang-card': '12px',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-out': 'fadeOut 0.3s ease-out forwards',
      },
      keyframes: {
        slideIn: {
          from: { transform: 'translateY(-20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        fadeOut: {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
