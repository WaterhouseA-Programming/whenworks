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
        // Theme-aware via CSS variables (no opacity modifier needed for these)
        bg:      'var(--bg)',
        surface: 'var(--s1)',
        surface2:'var(--s2)',
        surface3:'var(--s3)',
        border:  'var(--b)',
        border2: 'var(--b2)',
        muted:   'var(--m)',
        // Accent / status colours — hardcoded so opacity modifiers (bg-green/10 etc.) work
        accent:  '#5b8ef0',
        accent2: '#c084fc',
        green:   '#34d88a',
        amber:   '#f59e0b',
        red:     '#f05b5b',
      },
    },
  },
  plugins: [],
}
