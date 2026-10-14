import { useState } from 'react';

export default function HamburguesaCard({ burger, selected, disabled, onSelect }) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = Boolean(burger.foto_url) && !imageFailed;

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
              <span className="break-words font-display text-2xl font-extrabold uppercase leading-none text-white drop-shadow sm:text-4xl">
                {burger.nombre}
              </span>
            </div>
          )}
        </div>
        <div className="space-y-2 p-2 sm:space-y-3 sm:p-4">
          <div>
            <h3 className="break-words font-display text-xl font-extrabold uppercase leading-tight text-white sm:text-3xl sm:leading-none">
              {burger.nombre}
            </h3>
            <p className="mt-1 break-words text-xs font-semibold text-dorado sm:text-sm">
              {burger.restaurante}
            </p>
          </div>
          <span
            className={`block border-2 px-2 py-2.5 text-center text-xs font-extrabold uppercase transition sm:px-3 sm:py-3 sm:text-sm ${
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
