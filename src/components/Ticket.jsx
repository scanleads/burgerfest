// Ticket de factura: papel beige con bordes dentados (CSS en index.css) y tipografia monoespaciada.
export default function Ticket({ children, className = '' }) {
  return (
    <div className={`ticket ${className}`}>
      <div className="ticket-papel px-5 py-6 font-mono text-[13px] leading-snug sm:px-7 sm:text-sm">
        {children}
      </div>
    </div>
  );
}

export function Separador({ className = 'my-4' }) {
  return <hr className={`border-0 border-t-2 border-dashed border-[#1a1a1a]/60 ${className}`} />;
}

// Renglon con puntos guia: "1x VOTO ........ GRATIS"
export function Renglon({ izq, der, className = '' }) {
  return (
    <div className={`flex items-baseline gap-1.5 ${className}`}>
      <span className="shrink-0 font-bold uppercase">{izq}</span>
      <span
        aria-hidden="true"
        className="min-w-[1rem] flex-1 border-b-2 border-dotted border-[#1a1a1a]/60"
      />
      <span className="min-w-0 max-w-[58%] break-words text-right font-bold uppercase">{der}</span>
    </div>
  );
}
