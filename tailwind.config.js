/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tint colors
        tint: {
          1: 'var(--tint-1)',
          2: 'var(--tint-2)',
          3: 'var(--tint-3)',
          4: 'var(--tint-4)',
          5: 'var(--tint-5)',
          6: 'var(--tint-6)',
          7: 'var(--tint-7)',
          8: 'var(--tint-8)',
          9: 'var(--tint-9)',
          10: 'var(--tint-10)',
          11: 'var(--tint-11)',
          ash: 'var(--tint-ash)',
        },
        // Primary colors
        primary: {
          1: 'var(--primary-1)',
          2: 'var(--primary-2)',
          3: 'var(--primary-3)',
          4: 'var(--primary-4)',
          5: 'var(--primary-5)',
        },
        // Status colors
        danger: 'var(--danger)',
        success: 'var(--success)',
        warn: 'var(--warn)',
      },
    },
  },
  plugins: [],
} 