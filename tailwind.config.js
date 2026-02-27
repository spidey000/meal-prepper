/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3fbf7',
          100: '#d7f3e6',
          200: '#b4e6cf',
          300: '#82d2b0',
          400: '#4bb78d',
          500: '#1f9c70',
          600: '#13835c',
          700: '#10694b',
          800: '#0f523c',
          900: '#0d4432'
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5f5',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a'
        }
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 10px 25px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
}
