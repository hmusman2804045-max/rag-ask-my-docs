/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#080A0D',
          secondary: '#0B0E13',
          tertiary: '#10141B',
          elevated: '#12161D',
        },
        card: {
          DEFAULT: '#11151C',
          hover: '#151A22',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-active': 'rgba(245, 166, 35, 0.35)',
        },
        amber: {
          primary: '#F5A623',
          bright: '#FFB52E',
          soft: '#D99A25',
          glow: 'rgba(245, 166, 35, 0.15)',
          deep: '#B3770E',
        },
        gold: {
          200: '#FDE9B5',
          300: '#FFB52E',
          400: '#F5A623',
          500: '#D99A25',
          600: '#B3770E',
        },
        ink: {
          primary: '#F5F7FA',
          secondary: '#94A3B8',
          muted: '#64748B',
          faint: '#334155',
        },
        success: {
          DEFAULT: '#22C55E',
          glow: 'rgba(34, 197, 94, 0.2)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'Geist', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'amber-glow': '0 0 24px -4px rgba(245, 166, 35, 0.25)',
        'amber-glow-lg': '0 0 40px -8px rgba(245, 166, 35, 0.35)',
        'card-subtle': '0 12px 30px -10px rgba(0, 0, 0, 0.6)',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.08)' },
        },
        'scan-laser': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '20%': { opacity: '1' },
          '80%': { opacity: '1' },
          '100%': { transform: 'translateY(280%)', opacity: '0' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'orbit-rotate': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'glow-pulse': 'glow-pulse 2.5s ease-in-out infinite',
        'scan-laser': 'scan-laser 2.2s ease-in-out infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'orbit-rotate': 'orbit-rotate 30s linear infinite',
      },
    },
  },
  plugins: [],
};
