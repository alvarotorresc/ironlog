/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#3291FF',
          red: '#F43F5E',
        },
        theme: {
          slate: '#64748B',
          'slate-bright': '#94A3B8',
        },
      },
    },
  },
  plugins: [],
};
