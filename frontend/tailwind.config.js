/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#07080C',
          900: '#0B0C10',
          850: '#0E101A',
          800: '#12141D',
          700: '#191C2C',
          600: '#232742',
        },
        amethyst: {
          300: '#C79BFF',
          400: '#9D4EDD',
          500: '#7B2CBF',
          600: '#5A189A',
          700: '#3C096C',
        },
        champagne: {
          300: '#F7DFA0',
          400: '#F4C430',
          500: '#D4AF37',
          600: '#A9862A',
        },
        ink: {
          100: '#F8FAFC',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      backdropBlur: {
        xl: '24px',
      },
      boxShadow: {
        glass: '0 24px 60px -24px rgba(0, 0, 0, 0.85)',
        violet: '0 0 40px -8px rgba(157, 78, 221, 0.45)',
        gold: '0 0 32px -8px rgba(212, 175, 55, 0.4)',
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
      },
      animation: {
        'scan-sweep': 'scan-sweep 2.2s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
