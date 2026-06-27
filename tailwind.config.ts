import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#18201d',
        moss: '#49694d',
        reed: '#78906e',
        clay: '#b45641',
        pollen: '#e8b95b',
        paper: '#f7f3ea',
        cloud: '#eef4ef',
      },
      boxShadow: {
        panel: '0 18px 48px rgba(32, 48, 39, 0.12)',
      },
      fontFamily: {
        sans: ['Pretendard', 'Aptos', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
