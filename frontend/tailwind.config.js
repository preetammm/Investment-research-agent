/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#FAFAF7',
        ink: {
          DEFAULT: '#14161A',
          soft: '#4A4E57',
          faint: '#8A8D96',
        },
        slate: {
          DEFAULT: '#3B4A63',
          light: '#E7EAF0',
        },
        invest: {
          DEFAULT: '#B8873D',
          soft: '#F3E8D5',
        },
        pass: {
          DEFAULT: '#A6503D',
          soft: '#F2E1DC',
        },
        watch: {
          DEFAULT: '#5B6B4F',
          soft: '#E7EBDF',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
