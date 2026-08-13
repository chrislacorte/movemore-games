/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        ui: ['Rajdhani', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
