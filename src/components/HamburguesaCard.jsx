export default function HamburguesaCard({ burger, selected, disabled, onSelect }) {
  const hasImage = Boolean(burger.foto_url);

  return (
    <article
      className={`overflow-hidden border-2 bg-vino-oscuro transition ${
        selected ? 'border-dorado shadow-hard-dorado' : 'border-vino/50'
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(burger)}
        disabled={disabled}
        className="tap-highlight-none block w-full text-left"
        aria-pressed={selected}
      >
        <div className="aspect-[4/3] w-full bg-gradient-to-br from-vino/40 via-vino/25 to-dorado/30">
          {hasImage ? (
            <img
              src={burger.foto_url}
              alt={`${burger.nombre} de ${burger.restaurante}`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-5 text-center">
              <span className="font-display text-4xl font-extrabold uppercase leading-none text-white drop-shadow">
                {burger.nombre}
              </span>
            </div>
          )}
        </div>
        <div className="space-y-3 p-4">
          <div>
            <h3 className="font-display text-3xl font-extrabold uppercase leading-none text-white">
              {burger.nombre}
            </h3>
            <p className="mt-1 text-sm font-semibold text-dorado">
              {burger.restaurante}
            </p>
          </div>
          <span
            className={`block border-2 px-3 py-3 text-center text-sm font-extrabold uppercase transition ${
              selected
                ? 'border-vino-oscuro bg-dorado text-vino-oscuro'
                : 'border-crema bg-transparent text-crema'
            }`}
          >
            {selected ? 'Seleccionada' : 'Seleccionar'}
          </span>
        </div>
      </button>
    </article>
  );
}
