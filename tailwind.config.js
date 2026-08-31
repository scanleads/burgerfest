/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Barlow Condensed"', 'Inter', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'vino-fondo': 'rgb(var(--vino-fondo) / <alpha-value>)',
        'vino-oscuro': 'rgb(var(--vino-oscuro) / <alpha-value>)',
        vino: 'rgb(var(--vino) / <alpha-value>)',
        dorado: 'rgb(var(--dorado) / <alpha-value>)',
        crema: 'rgb(var(--crema) / <alpha-value>)',
        blanco: 'rgb(var(--blanco) / <alpha-value>)',
        'texto-suave': 'rgb(var(--texto-suave) / <alpha-value>)',
      },
      boxShadow: {
        hard: '4px 4px 0 0 #5c1622',
        'hard-sm': '2px 2px 0 0 #5c1622',
        'hard-secondary': '3px 3px 0 0 #5c1622',
        'hard-dorado': '4px 4px 0 0 #f2c065',
      },
    },
  },
  plugins: [],
};
