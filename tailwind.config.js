/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0f0f0f',
        surface: '#161616',
        'surface-2': '#1a1a1a',
        border: '#2a2a2a',
        accent: '#6366f1',
        'accent-hover': '#4f46e5',
        'text-primary': '#f5f5f5',
        'text-secondary': '#a1a1aa',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444'
      }
    }
  },
  plugins: []
}
