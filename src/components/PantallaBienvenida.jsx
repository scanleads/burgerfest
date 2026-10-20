import logoBurgerFestColor from '../assets/logo-burgerfest-color.png';
import PieProductora from './PieProductora.jsx';
import Ticket, { Renglon, Separador } from './Ticket.jsx';

function pad(numero) {
  return String(numero).padStart(2, '0');
}

function Cuenta({ milisegundos }) {
  const total = Math.max(0, Math.floor(milisegundos / 1000));
  const unidades = [
    { etiqueta: 'Días', valor: Math.floor(total / 86400) },
    { etiqueta: 'Horas', valor: Math.floor((total % 86400) / 3600) },
    { etiqueta: 'Min', valor: Math.floor((total % 3600) / 60) },
    { etiqueta: 'Seg', valor: total % 60 },
  ];

  return (
    <div>
      <p className="text-center text-xs font-bold uppercase tracking-[0.15em]">
        La votación abre en
      </p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {unidades.map(({ etiqueta, valor }) => (
          <div key={etiqueta} className="border-2 border-dashed border-[#1a1a1a]/60 px-1 py-2 text-center">
            <p className="text-3xl font-bold leading-none sm:text-4xl">{pad(valor)}</p>
            <p className="mt-1 text-[11px] font-bold uppercase">{etiqueta}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// evento: JSON de evento_actual (ciudad, lema, lugar, fecha_texto).
// fase: 'antes' (cuenta regresiva, falta = milisegundos) | 'pausada' (votacion en pausa, abre en breve)
export default function PantallaBienvenida({ evento, fase, falta, onVerMenu }) {

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-full max-w-md text-center">
        {evento?.lema ? (
          <h1 className="font-display text-6xl font-extrabold uppercase leading-[0.9] text-white sm:text-7xl">
            {evento.lema}
          </h1>
        ) : null}

        <Ticket className="mt-7 text-left">
          <img
            src={logoBurgerFestColor}
            alt="Burger Fest"
            className="mx-auto h-28 w-auto max-w-full sm:h-36"
          />
          {evento?.ciudad ? (
            <p className="mt-3 text-center text-sm font-bold uppercase tracking-[0.15em]">
              Edición {evento.ciudad}
            </p>
          ) : null}
          {evento?.fecha_texto ? <p className="mt-1 text-center font-bold">{evento.fecha_texto}</p> : null}
          {evento?.lugar ? <p className="text-center text-xs font-bold">{evento.lugar}</p> : null}

          <Separador />

          <div className="space-y-1.5">
            <Renglon izq="1x JURADO OFICIAL" der="TÚ" />
            <Renglon izq="1x VOTO" der="GRATIS" />
            <Renglon izq="1x LA MEJOR BURGER" der="¿?" />
          </div>

          <Separador />

          {fase === 'antes' ? (
            <Cuenta milisegundos={falta} />
          ) : (
            <div className="text-center">
              <p className="font-display text-3xl font-extrabold uppercase leading-none">
                La votación abre en breve
              </p>
              <p className="mt-2 text-xs font-bold uppercase">Esta página se actualiza sola cuando abra</p>
            </div>
          )}
        </Ticket>

        {onVerMenu ? (
          <button
            type="button"
            onClick={onVerMenu}
            className="mt-7 w-full border-2 border-vino-oscuro bg-dorado px-4 py-4 font-display text-2xl font-extrabold uppercase text-vino-oscuro shadow-hard transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-hard-sm"
          >
            VER MENÚ
          </button>
        ) : null}

        <PieProductora />
      </section>
    </main>
  );
}
