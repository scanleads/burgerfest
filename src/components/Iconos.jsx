// Iconos propios en SVG (sin emojis ni librerias): heredan el color del texto y no descargan nada.
function Base({ className = 'h-6 w-6', children, relleno = false }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={relleno ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function IconoBurger({ className }) {
  return (
    <Base className={className}>
      <path d="M4 10.5C4 6.9 7.6 4 12 4s8 2.9 8 6.5H4z" />
      <path d="M3 14h18" />
      <path d="M5 17.5h14v1a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 18.5v-1z" />
    </Base>
  );
}

export function IconoCorona({ className }) {
  return (
    <Base className={className} relleno>
      <path d="M4.5 17 3 7.5l5.5 4L12 5l3.5 6.5 5.5-4-1.5 9.5z" />
      <path d="M5 20.5h14" />
    </Base>
  );
}

export function IconoCheck({ className }) {
  return (
    <Base className={className}>
      <path d="M5 12.5l4.5 4.5L19 7.5" strokeWidth="3" />
    </Base>
  );
}

// Sello animado del "voto registrado": disco dorado que aparece, check que se dibuja y un destello de chispas.
// Todo es SVG + CSS (index.css, bloque "sello"): no pesa ni usa red. Con "reducir movimiento" queda fijo.
const CHISPAS = [
  [0, -52, 'c'], [37, -37, 'd'], [52, 0, 'c'], [37, 37, 'r'], [0, 52, 'd'], [-37, 37, 'c'], [-52, 0, 'r'], [-37, -37, 'd'],
  [20, -48, 'r'], [-22, -47, 'c'], [48, 21, 'd'], [-48, 20, 'd'],
];
const COLOR_CHISPA = { d: '#fbc72b', c: '#faf6ed', r: '#b02c1e' };

export function SelloVoto({ className = 'h-28 w-28' }) {
  return (
    <svg className={`sello ${className}`} viewBox="0 0 120 120" role="img" aria-label="Voto registrado">
      <circle className="sello-onda" cx="60" cy="60" r="30" fill="none" stroke="#fbc72b" strokeWidth="2" />
      {CHISPAS.map(([dx, dy, color], i) => (
        <rect
          key={i}
          className="sello-chispa"
          x="57.5"
          y="57.5"
          width="5"
          height="5"
          rx={i % 2 ? 2.5 : 1}
          fill={COLOR_CHISPA[color]}
          style={{ '--dx': `${dx}px`, '--dy': `${dy}px`, animationDelay: `${0.42 + (i % 4) * 0.04}s` }}
        />
      ))}
      <circle className="sello-disco" cx="60" cy="60" r="30" fill="#fbc72b" />
      <path
        className="sello-check"
        d="M46 61.5l9.5 9.5L75 50.5"
        fill="none"
        stroke="#1f1614"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="100"
      />
    </svg>
  );
}
