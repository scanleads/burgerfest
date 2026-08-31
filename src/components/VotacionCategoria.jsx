import HamburguesaCard from './HamburguesaCard.jsx';

const categoryLabels = {
  '8_dolares': {
    short: '$8',
    title: 'Mejor hamburguesa de $8',
    confirm: 'Continuar a $10',
  },
  '10_dolares': {
    short: '$10',
    title: 'Mejor hamburguesa de $10',
    confirm: 'Revisar mi voto',
  },
};

export default function VotacionCategoria({
  categoria,
  hamburguesas,
  selectedId,
  existingVote,
  onSelect,
  onConfirm,
  onChangeCategory,
  canOpenCategory,
  busy,
  error,
}) {
  const label = categoryLabels[categoria];
  const selectedBurger = hamburguesas.find((burger) => burger.id === selectedId);

  return (
    <main className="min-h-screen px-4 py-5">
      <section className="mx-auto w-full max-w-3xl">
        <div className="sticky top-0 z-10 -mx-4 border-b-2 border-vino-oscuro bg-vino-fondo px-4 pb-3 pt-2">
          <div className="grid grid-cols-2 gap-2 border-2 border-vino-oscuro bg-vino-oscuro p-1">
            {Object.entries(categoryLabels).map(([key, item]) => {
              const active = categoria === key;

              return (
                <button
                  key={key}
                  type="button"
                  disabled={!canOpenCategory(key)}
                  onClick={() => onChangeCategory(key)}
                  className={`tap-highlight-none border-2 px-3 py-3 font-display text-xl font-extrabold uppercase transition ${
                    active
                      ? 'border-vino-oscuro bg-dorado text-vino-oscuro'
                      : 'border-transparent text-texto-suave disabled:text-texto-suave/40'
                  }`}
                >
                  {item.short}
                </button>
              );
            })}
          </div>
        </div>

        <header className="mb-5 mt-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-dorado">
            BurgerFest
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold uppercase leading-none text-white sm:text-5xl">
            {label.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-texto-suave">
            Elige una opcion y confirma. Debes completar ambas categorias.
          </p>
        </header>

        {existingVote && (
          <div className="mb-4 border-2 border-dorado bg-vino-oscuro px-4 py-3 text-sm text-crema">
            Ya registramos tu voto en esta categoria. Puedes continuar con la siguiente.
          </div>
        )}

        {error && (
          <div className="mb-4 border-2 border-red-300/50 bg-red-500/20 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {hamburguesas.length === 0 ? (
          <div className="border-2 border-vino-oscuro bg-vino-oscuro px-4 py-8 text-center text-texto-suave">
            No hay hamburguesas activas en esta categoria.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {hamburguesas.map((burger) => (
              <HamburguesaCard
                key={burger.id}
                burger={burger}
                selected={selectedId === burger.id || existingVote?.hamburguesa_id === burger.id}
                disabled={Boolean(existingVote) || busy}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}

        <div className="sticky bottom-0 -mx-4 mt-5 border-t-2 border-vino-oscuro bg-vino-fondo px-4 py-3">
          <button
            type="button"
            disabled={busy || (!selectedBurger && !existingVote)}
            onClick={onConfirm}
            className="w-full border-2 border-vino-oscuro bg-crema px-4 py-4 font-display text-2xl font-extrabold uppercase text-vino-oscuro shadow-hard transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-hard-sm disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-hard"
          >
            {busy
              ? 'Continuando...'
              : existingVote
                ? categoria === '8_dolares'
                  ? 'Continuar a $10'
                  : 'Revisar mi voto'
                : label.confirm}
          </button>
        </div>
      </section>
    </main>
  );
}
