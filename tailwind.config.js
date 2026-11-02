/** @type {import('tailwindcss').Config} */
// Paleta: laranja vívido como cor de ação + neutros quentes (substituem o "slate" em todo o app).
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#FFF5EF', 100: '#FFE8DA', 200: '#FFCDB0', 300: '#FFA97A', 400: '#FF7D3F',
          500: '#FF5F15', 600: '#EE4A06', 700: '#C53A08', 800: '#9C300F', 900: '#7E2A10', 950: '#441205',
        },
        slate: {
          50: '#FAFAF9', 100: '#F4F3F1', 200: '#E9E7E4', 300: '#D8D5D1', 400: '#A9A49F',
          500: '#78726C', 600: '#58534D', 700: '#433E39', 800: '#2A2622', 900: '#1C1916', 950: '#110F0D',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(28,25,22,0.04), 0 1px 1px rgba(28,25,22,0.03)',
        lift: '0 8px 24px -8px rgba(28,25,22,0.14), 0 2px 6px -2px rgba(28,25,22,0.06)',
        pop: '0 20px 48px -12px rgba(28,25,22,0.28)',
      },
      keyframes: {
        'slide-up': { from: { transform: 'translateY(12px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        'slide-up': 'slide-up .2s cubic-bezier(.2,.8,.2,1)',
        'fade-in': 'fade-in .15s ease-out',
      },
    },
  },
  plugins: [],
};
