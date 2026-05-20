/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta KFC principal
        'kfc': {
          red: '#E4002B',
          'red-dark': '#B3001E',
          'red-light': '#FF1A1A',
          white: '#FFFFFF',
          black: '#202020',
          gray: '#F5F5F5',
          'gray-dark': '#333333',
        },
        // Variantes de rojo KFC
        'kfc-red': {
          DEFAULT: '#E4002B',
          50: '#FFF5F5',
          100: '#FFE5E5',
          200: '#FFB3B3',
          300: '#FF8080',
          400: '#FF4D4D',
          500: '#E4002B',
          600: '#B3001E',
          700: '#800015',
          800: '#4D000D',
          900: '#1A0004',
        },
        // Blancos KFC
        'kfc-white': {
          DEFAULT: '#FFFFFF',
          off: '#FFF5F5',
        },
        // Sistema de colores para componentes
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#E4002B',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F5F5F5',
          foreground: '#202020',
        },
        destructive: {
          DEFAULT: '#B3001E',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F5F5F5',
          foreground: '#333333',
        },
        accent: {
          DEFAULT: '#FFE5E5',
          foreground: '#E4002B',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#202020',
        },
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      boxShadow: {
        'kfc': '0 8px 20px -6px rgba(228, 0, 43, 0.15)',
        'card': '0 2px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
        'card-hover': '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.02)',
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}