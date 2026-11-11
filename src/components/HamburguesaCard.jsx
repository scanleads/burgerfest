import { useState } from 'react';
import { IconoCheck } from './Iconos.jsx';

export default function HamburguesaCard({ burger, selected, disabled, onSelect }) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = Boolean(burger.foto_url) && !imageFailed;

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-vino-oscuro transition duration-200 ${
        selected ? 'elegida border-dorado shadow-hard-dorado' : 'border-white/10'
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
              <span className="break-words font-display text-xl font-extrabold uppercase leading-none text-white drop-shadow sm:text-3xl">
                {burger.nombre}
              </span>
            </div>
          )}
        </div>
        <div className="space-y-2 p-2 sm:space-y-3 sm:p-4">
          <div>
            <h3 className="break-words font-display text-lg font-extrabold uppercase leading-[1.05] text-white sm:text-2xl">
              {burger.nombre}
            </h3>
            <p className="mt-1 break-words text-xs font-semibold text-dorado sm:text-sm">
              {burger.restaurante}
            </p>
          </div>
          <span
            className={`block rounded-xl border px-2 py-2.5 text-center text-xs font-extrabold uppercase transition sm:px-3 sm:py-3 sm:text-sm ${
              selected
                ? 'border-dorado bg-dorado text-vino-oscuro'
                : 'border-white/30 bg-transparent text-crema'
            }`}
          >
            {selected ? (
              <span className="inline-flex items-center justify-center gap-1">
                <IconoCheck className="h-3.5 w-3.5" />
                Seleccionada
              </span>
            ) : (
              'Seleccionar'
            )}
          </span>
        </div>
      </button>
    </article>
  );
}
