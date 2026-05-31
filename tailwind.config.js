import tailwindcssForms from '@tailwindcss/forms';
import tailwindcssContainerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#f4258c",
        "primary-soft": "#fdf2f8",
        "primary-dark": "#d11572",
        "background-light": "#fcf8fa",
        "background-dark": "#221019",
        "surface-light": "#ffffff",
        "surface-dark": "#2d1b24",
        "text-main": "#1c0d14",
        "text-muted": "#9c4973",
        "text-sub": "#9c4973",
        "success": "#10b981",
        "success-bg": "#ecfdf5",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg": "0.75rem",
        "xl": "1rem",
        "2xl": "1.5rem",
        "full": "9999px"
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(244, 37, 140, 0.1)',
        'glow': '0 8px 32px -4px rgba(244, 37, 140, 0.35)',
        'modal': '0 -10px 40px -10px rgba(0,0,0,0.1)'
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.3s ease-out forwards',
      }
    },
  },
  plugins: [
    tailwindcssForms,
    tailwindcssContainerQueries,
  ],
}
