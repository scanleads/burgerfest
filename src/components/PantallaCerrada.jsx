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
      <section className="entrada w-full max-w-md text-center">
        {evento?.ciudad ? (
          <p className="text-sm font-semibold text-dorado">{evento.ciudad}</p>
        ) : null}
        <h1 className="mt-4 font-display text-4xl font-extrabold uppercase leading-[0.95] text-white sm:text-5xl">
          {evento?.nombre || 'Burger Fest'}
        </h1>
        <div className="mx-auto mt-6 h-1 w-24 rounded-full bg-gradient-to-r from-vino to-dorado" />
        <p className="panel mt-7 px-5 py-5 text-base leading-7 text-texto-suave">
          {mensaje}
        </p>
        {onVerMenu ? (
          <button
            type="button"
            onClick={onVerMenu}
            className="btn btn-oro mt-6"
          >
            VER MENÚ
          </button>
        ) : null}

        <PieProductora />
      </section>
    </main>
  );
}
