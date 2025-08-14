/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        frost: {
          50: '#F0F7FF',
          100: '#E0EFFE',
          200: '#BAE0FE',
          300: '#8CCBFD',
          400: '#4AA6FA',
          500: '#2186F5',
          600: '#0967D2',
          700: '#0552B5',
          800: '#03449E',
          900: '#01337D',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.1)',
          DEFAULT: 'rgba(255, 255, 255, 0.2)',
          dark: 'rgba(0, 0, 0, 0.1)',
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-glass': 'linear-gradient(145deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05))',
        'gradient-glass-dark': 'linear-gradient(145deg, rgba(20, 24, 44, 0.5), rgba(10, 14, 34, 0.2))',
        'winter-light': 'linear-gradient(to bottom, #E0EFFE, #F0F7FF)',
        'winter-dark': 'linear-gradient(to bottom, #0B1221, #162037)',
      },
    },
  },
  plugins: [],
}