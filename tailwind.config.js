/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ginger: {
          50: '#fdf6ee',
          100: '#fbe9d6',
          200: '#f6cfac',
          300: '#efae78',
          400: '#e88c4a',
          500: '#e0732a', // primary ginger orange
          600: '#c95a1e',
          700: '#a6441a',
          800: '#85381a',
          900: '#6c3018',
        },
        charcoal: {
          50: '#f5f6f7',
          100: '#e7e9ec',
          200: '#c9cdd3',
          300: '#a4abb5',
          400: '#7b8490',
          500: '#5b6573',
          600: '#47505d',
          700: '#3a414c',
          800: '#2f353e',
          900: '#23282f',
          950: '#191c21',
        },
        cream: {
          50: '#fefdfa',
          100: '#fdfaf2',
          200: '#faf3e3',
        },
      },
      fontFamily: {
        sans: ['"Nunito"', 'system-ui', 'sans-serif'],
        display: ['"Baloo 2"', '"Nunito"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px -6px rgba(47, 53, 62, 0.12)',
        card: '0 2px 12px -2px rgba(47, 53, 62, 0.10)',
      },
      keyframes: {
        pawPop: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(40px)', opacity: '0' },
        },
        flashBanner: {
          '0%, 100%': { backgroundColor: '#dc2626', color: '#fff' },
          '50%': { backgroundColor: '#fbbf24', color: '#1f2937' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        floatUp: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-30px)', opacity: '0' },
        },
      },
      animation: {
        pawPop: 'pawPop 0.35s ease-out',
        slideRight: 'slideRight 0.4s ease-in forwards',
        flashBanner: 'flashBanner 1s ease-in-out infinite',
        wiggle: 'wiggle 0.5s ease-in-out',
        floatUp: 'floatUp 0.8s ease-out forwards',
      },
    },
  },
  plugins: [],
};
