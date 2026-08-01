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
        walnut: '#4A3527',
        accent: '#C65D2B',
        teal: {
          DEFAULT: '#2F6F68',
          dark: '#245651',
          light: '#E6F0EF'
        },
        olive: '#6E7653',
        warning: {
          DEFAULT: '#C86A3B',
          text: '#A34D20',
          light: '#FDF1EC'
        },
        danger: {
          DEFAULT: '#A94442',
          light: '#FDF0F0'
        },
        border: '#D8D1C3',
        'border-dark': '#C4BBA8',
      },
      fontFamily: {
        serif: ['"Fraunces"', '"Georgia"', 'serif'],
        display: ['"Fraunces"', '"Georgia"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      boxShadow: {
        card: '0 1px 2px rgba(30, 39, 38, 0.05)',
        'card-hover': '0 2px 8px rgba(30, 39, 38, 0.08)',
      },
      transitionTimingFunction: {
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },
      keyframes: {
        'rise': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'rise': 'rise 0.5s cubic-bezier(0.25, 1, 0.5, 1) both',
        'fade-in': 'fade-in 0.4s ease-out both',
      },
    },
  },
  plugins: [],
}
