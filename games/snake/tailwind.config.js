/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        film: ['"Special Elite"', 'monospace'],
        ui: ['Rajdhani', 'system-ui', 'sans-serif'],
      },
      colors: {
        phosphor: {
          DEFAULT: '#39ff14',
          dim: '#1a8a0a',
          glow: '#7fff5c',
        },
        amber: {
          film: '#ffb000',
        },
      },
    },
  },
  plugins: [],
}
