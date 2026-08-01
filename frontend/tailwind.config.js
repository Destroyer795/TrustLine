/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F4F0E6',
        surface: '#FFFCF5',
        ink: '#1E2726',
        'muted-ink': '#5F6966',
        teal: {
          DEFAULT: '#2F6F68',
          dark: '#245651',
          light: '#E6F0EF'
        },
        olive: '#6E7653',
        warning: {
          DEFAULT: '#C86A3B',
          light: '#FDF1EC'
        },
        danger: {
          DEFAULT: '#A94442',
          light: '#FDF0F0'
        },
        border: '#D8D1C3'
      },
      fontFamily: {
        serif: ['"Geist Sans"', 'sans-serif'],
        sans: ['"Geist Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    },
  },
  plugins: [],
}
