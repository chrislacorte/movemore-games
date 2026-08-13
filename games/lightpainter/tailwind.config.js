/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Baloo 2"', 'cursive'],
        ui: ['Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        night: {
          DEFAULT: '#070718',
          deep: '#03030c',
        },
      },
    },
  },
  plugins: [],
}
