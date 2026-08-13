/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          accent: 'var(--brand-accent)',
          surface: 'var(--brand-surface)',
          muted: 'var(--brand-muted)',
        },
        phosphor: 'var(--phosphor)',
      },
      boxShadow: {
        card: '0 0 40px -12px var(--brand-glow)',
      },
    },
  },
  plugins: [],
}
