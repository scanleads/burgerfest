import logoIkaika from '../assets/logo-ikaika.png';

export default function PieProductora({ className = 'mt-10' }) {
  return (
    <footer className={`flex flex-col items-center gap-2 pb-2 text-center ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-texto-suave/70">
        Una producción de
      </p>
      <img src={logoIkaika} alt="IKAIKA" className="h-20 w-auto max-w-full opacity-80 sm:h-24" />
    </footer>
  );
}
