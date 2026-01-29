/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        luxury: {
          gold: '#d4af37',
          'gold-light': '#f4d03f',
        },
      },
    },
  },
  plugins: [],
}
