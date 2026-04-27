/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#1337EC',
        'background-light': '#F9FAFB',
        'background-dark': '#0F172A',
        'text-light': '#111827',
        'text-dark': '#F3F4F6',
        'sidebar-light': '#FFFFFF',
        'sidebar-dark': '#101322',
        'border-light': '#E5E7EB',
        'border-dark': '#232948',
        'muted-light': '#6B7280',
        'muted-dark': '#94A3B8',
      }
    },
  },
  plugins: [],
}