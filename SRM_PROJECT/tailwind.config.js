/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', //(ADDED THIS LINE FOR THE DARK THEME)
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 12px 28px rgba(15, 23, 42, 0.08)',
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
        },
      },
    },
  },
  plugins: [],
};
