import { useMemo, useState } from 'react';

const categoryLabels = {
  '8_dolares': '$8',
  '10_dolares': '$10',
};

function descripcionVisible(descripcion) {
  return descripcion || 'Menú por confirmar';
}

function FichaBurger({ burger, isOpen, onToggle }) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = Boolean(burger.foto_url) && !imageFailed;
  const description = descripcionVisible(burger.descripcion);
  const isPending = description === 'Menú por confirmar';

  return (
    <div className="border-2 border-vino bg-vino-fondo">
      <div className="aspect-[4/5] w-full bg-gradient-to-br from-vino/40 via-vino/25 to-dorado/30">
        {hasImage ? (
          <img
            src={burger.foto_url}
            alt={`${burger.nombre} de ${burger.restaurante}`}
            width="640"
            height="800"
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-3 text-center">
            <span className="break-words font-display text-2xl font-extrabold uppercase leading-none text-white drop-shadow">
              {burger.nombre}
            </span>
          </div>
        )}
      </div>
      <div className="p-2 sm:p-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-dorado">
          {categoryLabels[burger.categoria] || burger.categoria}
        </p>
        <h3 className="mt-1 break-words font-display text-xl font-extrabold uppercase leading-tight text-white sm:text-2xl">
          {burger.nombre}
        </h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className="tap-highlight-none mt-2 w-full border-2 border-dorado bg-transparent px-2 py-2 text-xs font-extrabold uppercase text-dorado transition hover:translate-x-[2px] hover:translate-y-[2px] sm:text-sm"
        >
          Ingredientes
        </button>
        {isOpen && (
          <p className={`mt-3 text-sm leading-6 ${isPending ? 'italic text-texto-suave' : 'text-crema'}`}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export default function MenuCompleto({ hamburguesas, onVolver, votacionAbierta = true }) {
  const [openById, setOpenById] = useState({});

  const restaurantes = useMemo(() => {
    const grouped = hamburguesas.reduce((acc, burger) => {
      const restaurante = burger.restaurante || '';

      if (!acc[restaurante]) {
        acc[restaurante] = [];
      }

      acc[restaurante].push(burger);
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b, 'es'))
      .map(([restaurante, burgers]) => ({
        restaurante,
        burgers: [...burgers].sort((a, b) => {
          if (a.categoria === b.categoria) {
            return a.nombre.localeCompare(b.nombre, 'es');
          }

          return a.categoria === '8_dolares' ? -1 : 1;
        }),
      }));
  }, [hamburguesas]);

  function toggleBurger(id) {
    setOpenById((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }

  return (
    <main className="min-h-screen px-4 py-5">
      <section className="mx-auto w-full max-w-3xl">
        <header className="mb-5 mt-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-dorado">
            BurgerFest
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold uppercase leading-none text-white sm:text-5xl">
            Menú completo
          </h1>
          <p className="mt-3 text-sm leading-6 text-texto-suave">
            Revisa las propuestas participantes antes de registrar tu voto.
          </p>
        </header>

        <div className="space-y-5">
          {restaurantes.map(({ restaurante, burgers }) => (
            <article
              key={restaurante}
              className="overflow-hidden border-2 border-vino/50 bg-vino-oscuro p-3 sm:p-4"
            >
              <h2 className="font-display text-3xl font-extrabold uppercase leading-none text-white">
                {restaurante}
              </h2>
              <div className="mt-3 grid grid-cols-2 items-start gap-3">
                {burgers.map((burger) => (
                  <FichaBurger
                    key={burger.id}
                    burger={burger}
                    isOpen={Boolean(openById[burger.id])}
                    onToggle={() => toggleBurger(burger.id)}
                  />
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="sticky bottom-0 -mx-4 mt-5 border-t-2 border-vino-oscuro bg-vino-fondo px-4 py-3">
          <button
            type="button"
            onClick={onVolver}
            className="w-full border-2 border-vino-oscuro bg-crema px-4 py-4 font-display text-2xl font-extrabold uppercase text-vino-oscuro shadow-hard transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-hard-sm"
          >
            {votacionAbierta ? 'YA VI EL MENÚ, QUIERO VOTAR' : 'VOLVER'}
          </button>
        </div>
      </section>
    </main>
  );
}
