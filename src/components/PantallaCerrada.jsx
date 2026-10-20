import { aMs, useAhoraServidor } from '../lib/evento.js';
import PantallaBienvenida from './PantallaBienvenida.jsx';
import PieProductora from './PieProductora.jsx';

// estado: 'ok' | 'no_disponible' | 'error' (resultado de evento_actual). evento: JSON de evento_actual (null si no hay).
export default function PantallaCerrada({ evento, estado = 'ok', onVerMenu }) {
  const fase = evento?.fase;
  const abreMs = aMs(evento?.abre_en);
  const cuentaRegresiva = fase === 'antes' && abreMs !== null;
  const ahora = useAhoraServidor(cuentaRegresiva);

  if (estado === 'ok' && (cuentaRegresiva || fase === 'pausada')) {
    return (
      <PantallaBienvenida
        evento={evento}
        fase={cuentaRegresiva ? 'antes' : 'pausada'}
        falta={cuentaRegresiva ? Math.max(0, abreMs - ahora) : 0}
        onVerMenu={onVerMenu}
      />
    );
  }

  let mensaje = evento?.mensaje_cierre || 'La votacion no esta abierta en este momento.';
  if (estado === 'error') {
    mensaje = 'No pudimos verificar si la votacion esta abierta. Intenta de nuevo en unos minutos.';
  } else if (estado === 'no_disponible') {
    mensaje = 'Este evento no esta disponible.';
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-full max-w-md text-center">
        {evento?.ciudad ? (
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-crema">{evento.ciudad}</p>
        ) : null}
        <h1 className="mt-4 font-display text-5xl font-extrabold uppercase leading-none text-white">
          {evento?.nombre || 'Burger Fest'}
        </h1>
        <div className="mx-auto mt-6 h-1 w-24 bg-gradient-to-r from-vino to-dorado" />
        <p className="mt-7 border-2 border-vino bg-vino-oscuro px-5 py-5 text-base leading-7 text-texto-suave shadow-hard">
          {mensaje}
        </p>
        {onVerMenu ? (
          <button
            type="button"
            onClick={onVerMenu}
            className="mt-6 w-full border-2 border-vino-oscuro bg-dorado px-4 py-4 font-display text-2xl font-extrabold uppercase text-vino-oscuro shadow-hard transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-hard-sm"
          >
            VER MENÚ
          </button>
        ) : null}

        <PieProductora />
      </section>
    </main>
  );
}
