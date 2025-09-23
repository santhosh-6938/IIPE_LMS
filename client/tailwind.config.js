/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brandBlue: '#1F4D8F',
        brandNavy: '#0B3C7A',
        brandOrange: '#F28C28',
        brandGreen: '#2F9E44',
        brandGold: '#F4C430'
      },
      boxShadow: {
        brand: '0 10px 25px -5px rgba(31,77,143,0.15), 0 10px 10px -5px rgba(242,140,40,0.1)'
      }
    },
  },
  plugins: [],
}
