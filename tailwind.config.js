/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dde6ff',
          200: '#c3d0ff',
          300: '#9db0ff',
          400: '#7585fc',
          500: '#5461f7',
          600: '#3f43ec',
          700: '#3333d1',
          800: '#2b2ca8',
          900: '#292d85',
          950: '#1a1b50',
        },
      },
    },
  },
  plugins: [],
}
