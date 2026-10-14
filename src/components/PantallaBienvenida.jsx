import logoBurgerFest from '../assets/logo-burgerfest.png';

const FECHA_Y_LUGAR = '17 y 18 de octubre · Terraza Hotel Trinitaria Suites';

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
    <div className="mt-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-dorado">
        Cuenta regresiva para el 17 de octubre
      </p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {unidades.map(({ etiqueta, valor }) => (
          <div key={etiqueta} className="border-2 border-vino bg-vino-oscuro px-1 py-3 shadow-hard">
            <p className="font-display text-4xl font-extrabold leading-none text-white sm:text-5xl">
              {pad(valor)}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase text-texto-suave">{etiqueta}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// fase: 'antes' (cuenta regresiva) | 'durante' (votacion cerrada, abre en breve)
export default function PantallaBienvenida({ config, fase, falta, onVerMenu }) {
  const ciudad = config?.ciudad_activa || 'Barquisimeto';

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-full max-w-md text-center">
        <img
          src={logoBurgerFest}
          alt="Burger Fest"
          className="mx-auto h-[163px] w-auto max-w-full sm:h-[222px]"
        />
        <h1 className="mt-4 font-display text-5xl font-extrabold uppercase leading-none text-white">
          Burger Fest {ciudad} 2026
        </h1>
        <div className="mx-auto mt-5 h-1 w-24 bg-gradient-to-r from-vino to-dorado" />
        <p className="mt-5 text-base font-semibold text-crema">{FECHA_Y_LUGAR}</p>

        {fase === 'antes' ? (
          <Cuenta milisegundos={falta} />
        ) : (
          <div className="mt-6 border-2 border-vino bg-vino-oscuro px-5 py-5 shadow-hard">
            <p className="font-display text-3xl font-extrabold uppercase leading-none text-dorado">
              La votación abre en breve
            </p>
            <p className="mt-3 text-base leading-7 text-texto-suave">Actualiza la página cuando abra</p>
          </div>
        )}

        {onVerMenu ? (
          <button
            type="button"
            onClick={onVerMenu}
            className="mt-7 w-full border-2 border-vino-oscuro bg-dorado px-4 py-4 font-display text-2xl font-extrabold uppercase text-vino-oscuro shadow-hard transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-hard-sm"
          >
            VER MENÚ
          </button>
        ) : null}
      </section>
    </main>
  );
}
