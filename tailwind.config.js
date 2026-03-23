/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Lusha brand colors (from lusha-design-system)
        primary: {
          DEFAULT: '#6f45ff',
          50:  '#f3efff',
          100: '#e6dcff',
          200: '#ccb9ff',
          300: '#b396ff',
          400: '#9973ff',
          500: '#6f45ff',
          600: '#5c35e0',
          700: '#4a28c0',
          800: '#381da0',
          900: '#261480',
        },
        // Neutral palette
        neutral: {
          0:    '#ffffff',
          50:   '#f9f9f9',
          100:  '#f2f2f2',
          200:  '#e5e5e5',
          300:  '#d4d4d4',
          400:  '#a3a3a3',
          500:  '#737373',
          600:  '#525252',
          700:  '#404040',
          800:  '#262626',
          900:  '#171717',
          1000: '#000000',
        },
        // Semantic colors
        positive: {
          DEFAULT: '#10b981',
          light: '#d1fae5',
        },
        negative: {
          DEFAULT: '#f43f5e',
          light: '#ffe4e6',
        },
        warning: {
          DEFAULT: '#f97316',
          light: '#ffedd5',
        },
        // Background tokens
        bg: {
          main: '#f2f2f2',
          surface: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Inter_400Regular', 'sans-serif'],
        'sans-medium': ['Inter_500Medium', 'sans-serif'],
        'sans-semibold': ['Inter_600SemiBold', 'sans-serif'],
        'sans-bold': ['Inter_700Bold', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
