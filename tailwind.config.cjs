/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'drby-green': {
          50: '#f0f7f2',
          100: '#d9efdf',
          200: '#b3dfb8',
          300: '#8cc98f',
          400: '#66b066',
          500: '#4A895C',
          600: '#3A6A4A',
          700: '#2A4B38',
          800: '#1A2C26',
          900: '#0A0D14',
        },
      },
    },
  },
  plugins: [],
}