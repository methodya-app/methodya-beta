/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Montserrat', 'sans-serif'],
      },
      colors: {
        cognitiveTeal: {
          DEFAULT: '#0D9488',
          hover: '#0B7A70',
          light: '#CCFBF1',
          deep: '#115E59',
        },
        warmAmber: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
          light: '#FEF3C7',
        },
        deepViolet: {
          DEFAULT: '#4C1D95',
          hover: '#3B1675',
          light: '#EDE9FE',
          bg: '#1E152A',
        },
        empatheticLinen: {
          DEFAULT: '#FFFBEB',
          darker: '#FEF3C7',
        },
        activeMint: '#10B981',
      },
    },
  },
  plugins: [],
};
