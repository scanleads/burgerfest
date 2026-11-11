/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './admin.html', './resultados.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Las familias salen de variables CSS: el tema "brasa" (publico) y el "clasico" (admin) usan fuentes distintas.
        display: ['var(--fuente-display)', 'Inter', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"Courier Prime"', '"Courier New"', 'monospace'],
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
        hard: 'var(--sombra-hard)',
        'hard-sm': 'var(--sombra-hard-sm)',
        'hard-secondary': 'var(--sombra-hard-secondary)',
        'hard-dorado': 'var(--sombra-hard-dorado)',
      },
    },
  },
  plugins: [],
};
