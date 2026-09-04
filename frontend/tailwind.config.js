/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Executive Titanium Slate — warm charcoal, never flat black.
        titanium: {
          950: '#05060A',
          900: '#08090D',
          850: '#0D101A',
          800: '#11141F',
          700: '#181C2A',
          600: '#232838',
          500: '#2E3446',
        },
        // Electric Gold — the primary accent.
        gold: {
          200: '#FDE9B5',
          300: '#FBBF24',
          400: '#F59E0B',
          500: '#D97706',
          600: '#B45309',
          700: '#92400E',
          800: '#6B3009',
        },
        // Liquid Champagne — the pale secondary accent.
        champagne: {
          200: '#FFFBEB',
          300: '#FDE68A',
          400: '#FCD34D',
          500: '#EAB308',
          600: '#CA8A04',
        },
        ink: {
          100: '#F8FAFC',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Outfit', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backdropBlur: {
        xl: '24px',
      },
      boxShadow: {
        glass: '0 24px 60px -24px rgba(0, 0, 0, 0.9)',
        gold: '0 0 34px -8px rgba(245, 158, 11, 0.45)',
        'gold-lg': '0 0 60px -12px rgba(245, 158, 11, 0.5)',
        champagne: '0 0 30px -8px rgba(253, 230, 138, 0.4)',
      },
      keyframes: {
        'scan-sweep': {
          '0%': { transform: 'translateY(-120%)', opacity: '0' },
          '15%': { opacity: '1' },
          '85%': { opacity: '1' },
          '100%': { transform: 'translateY(320%)', opacity: '0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.85)', opacity: '0.7' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'glow-dot': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 10px 1px rgba(245, 158, 11, 0.7)' },
          '50%': { opacity: '0.7', boxShadow: '0 0 18px 4px rgba(245, 158, 11, 0.35)' },
        },
      },
      animation: {
        'scan-sweep': 'scan-sweep 2.2s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'glow-dot': 'glow-dot 2.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
