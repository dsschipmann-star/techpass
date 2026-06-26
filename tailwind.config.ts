import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        tech: {
          black: '#050505',
          panel: '#111312',
          line: '#242824',
          neon: '#8DFF2A',
          ink: '#F8FAF7',
          muted: '#9BA39A',
        },
      },
      boxShadow: {
        neon: '0 0 24px rgba(141, 255, 42, 0.22)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
