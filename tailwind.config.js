/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        serif: ['Instrument Serif', 'serif'],
      },
      colors: {
        bg: '#0c0c0f',
        surface: '#131317',
        surface2: '#1a1a20',
        surface3: '#222229',
        border: '#2a2a35',
        border2: '#363644',
        muted: '#72728a',
        accent: '#5b8ef0',
        accent2: '#c084fc',
        green: '#34d88a',
        amber: '#f59e0b',
        red: '#f05b5b',
      },
    },
  },
  plugins: [],
}
