/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef4ff', 100: '#dae6ff', 200: '#bdd3ff', 300: '#90b6ff', 400: '#5c8eff',
          500: '#3766f6', 600: '#2149eb', 700: '#1a39d8', 800: '#1c31af', 900: '#1d2f8a', 950: '#161e54',
        },
      },
      keyframes: {
        'slide-up': { from: { transform: 'translateY(16px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        pop: { '0%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.12)' }, '100%': { transform: 'scale(1)' } },
      },
      animation: {
        'slide-up': 'slide-up .18s ease-out',
        'fade-in': 'fade-in .15s ease-out',
        pop: 'pop .3s ease-out',
      },
    },
  },
  plugins: [],
};
