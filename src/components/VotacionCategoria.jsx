import HamburguesaCard from './HamburguesaCard.jsx';
import PieProductora from './PieProductora.jsx';

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
        <div className="barra-fija sticky top-0 z-10 -mx-4 border-b px-4 pb-3 pt-2">
          <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-vino-oscuro p-1">
            {Object.entries(categoryLabels).map(([key, item]) => {
              const active = categoria === key;

              return (
                <button
                  key={key}
                  type="button"
                  disabled={!canOpenCategory(key)}
                  onClick={() => onChangeCategory(key)}
                  className={`tap-highlight-none rounded-xl px-3 py-2.5 font-display text-xl font-extrabold uppercase transition duration-200 ${
                    active
                      ? 'bg-dorado text-vino-oscuro'
                      : 'text-texto-suave disabled:text-texto-suave/40'
                  }`}
                >
                  {item.short}
                </button>
              );
            })}
          </div>
        </div>

        <header key={categoria} className="entrada mb-5 mt-6">
          <p className="text-xs font-semibold text-dorado">
            BurgerFest
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold uppercase leading-[0.95] text-white sm:text-5xl">
            {label.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-texto-suave">
            Elige una opcion y confirma. Debes completar ambas categorias.
          </p>
        </header>

        {existingVote && (
          <div className="aviso mb-4">
            Ya registramos tu voto en esta categoria. Puedes continuar con la siguiente.
          </div>
        )}

        {error && (
          <div className="aviso mb-4" role="alert">
            {error}
          </div>
        )}

        {hamburguesas.length === 0 ? (
          <div className="panel px-4 py-8 text-center text-texto-suave">
            No hay hamburguesas activas en esta categoria.
          </div>
        ) : (
          <div key={categoria} className="entrada grid grid-cols-2 gap-3 sm:gap-4">
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

        <PieProductora />

        <div className="barra-fija sticky bottom-0 -mx-4 mt-5 border-t px-4 py-3">
          <button
            type="button"
            disabled={busy || (!selectedBurger && !existingVote)}
            onClick={onConfirm}
            className="btn btn-oro"
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
