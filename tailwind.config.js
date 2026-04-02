/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#030712',
          900: '#050A14',
          800: '#0A1220',
          700: '#0D1526',
          600: '#132035',
          500: '#1C2D4A',
          400: '#243A60',
        },
        gold: {
          300: '#FFD060',
          400: '#F5B800',
          500: '#E0A000',
          600: '#C07800',
        },
        slate: {
          text: '#E2EAF4',
          muted: '#6B8AAA',
          dim: '#3A526A',
        },
      },
      fontFamily: {
        display: ['var(--font-syne)', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
        mono: ['var(--font-ibm-mono)', 'monospace'],
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'scan': 'scan 3s linear infinite',
        'count-up': 'countUp 1.5s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(240, 165, 0, 0.2)' },
          '50%': { boxShadow: '0 0 0 12px rgba(240, 165, 0, 0)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(28,45,74,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(28,45,74,0.4) 1px, transparent 1px)`,
        'gold-gradient': 'linear-gradient(135deg, #F5B800 0%, #E0A000 100%)',
        'navy-gradient': 'linear-gradient(180deg, #050A14 0%, #0D1526 100%)',
      },
      backgroundSize: {
        'grid': '48px 48px',
      },
    },
  },
  plugins: [],
};
