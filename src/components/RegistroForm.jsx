import { useState } from 'react';

const tastedOptions = ['1-2', '3-4', '5+'];

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function RegistroForm({ onSubmit, busy, error }) {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    edad: '',
    hamburguesas_probadas: '',
    acepta_marketing: false,
  });
  const [localError, setLocalError] = useState('');

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.nombre.trim() || !form.apellido.trim() || !form.correo.trim()) {
      setLocalError('Nombre, apellido y correo son obligatorios.');
      return;
    }

    if (!isValidEmail(form.correo.trim())) {
      setLocalError('Escribe un correo valido para continuar.');
      return;
    }

    setLocalError('');
    onSubmit({
      ...form,
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      correo: form.correo.trim().toLowerCase(),
      edad: form.edad ? Number(form.edad) : null,
      hamburguesas_probadas: form.hamburguesas_probadas || null,
      acepta_marketing: Boolean(form.acepta_marketing),
    });
  }

  return (
    <main className="min-h-screen px-4 py-6">
      <section className="mx-auto w-full max-w-md">
        <header className="mb-7">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-dorado">
            Maracaibo 2026
          </p>
          <h1 className="mt-2 font-display text-5xl font-extrabold uppercase leading-none text-white">
            Vota tu burger favorita
          </h1>
          <p className="mt-3 text-sm leading-6 text-texto-suave">
            Registrate una vez y elige una hamburguesa en cada categoria.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 border-2 border-vino bg-vino-oscuro p-4 shadow-hard">
          <label className="block">
            <span className="text-sm font-semibold text-crema">Nombre</span>
            <input
              value={form.nombre}
              onChange={(event) => updateField('nombre', event.target.value)}
              className="mt-2 w-full border-2 border-vino bg-vino-fondo px-4 py-3 text-white outline-none transition focus:border-dorado"
              autoComplete="given-name"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-crema">Apellido</span>
            <input
              value={form.apellido}
              onChange={(event) => updateField('apellido', event.target.value)}
              className="mt-2 w-full border-2 border-vino bg-vino-fondo px-4 py-3 text-white outline-none transition focus:border-dorado"
              autoComplete="family-name"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-crema">Correo</span>
            <input
              type="email"
              value={form.correo}
              onChange={(event) => updateField('correo', event.target.value)}
              className="mt-2 w-full border-2 border-vino bg-vino-fondo px-4 py-3 text-white outline-none transition focus:border-dorado"
              autoComplete="email"
              inputMode="email"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-crema">Edad</span>
            <input
              type="number"
              min="1"
              max="120"
              value={form.edad}
              onChange={(event) => updateField('edad', event.target.value)}
              className="mt-2 w-full border-2 border-vino bg-vino-fondo px-4 py-3 text-white outline-none transition focus:border-dorado"
              inputMode="numeric"
              placeholder="Opcional"
            />
          </label>

          <div>
            <p className="text-sm font-semibold text-crema">
              Cuantas hamburguesas probaste
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {tastedOptions.map((option) => {
                const selected = form.hamburguesas_probadas === option;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateField('hamburguesas_probadas', selected ? '' : option)}
                    className={`tap-highlight-none border-2 px-3 py-3 font-bold transition ${
                      selected
                        ? 'border-vino-oscuro bg-dorado text-vino-oscuro'
                        : 'border-crema/40 bg-transparent text-texto-suave'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-start gap-3 border-2 border-vino bg-vino-fondo p-3">
            <input
              type="checkbox"
              checked={form.acepta_marketing}
              onChange={(event) => updateField('acepta_marketing', event.target.checked)}
              className="mt-1 h-5 w-5 accent-dorado"
            />
            <span className="text-sm leading-6 text-texto-suave">
              Acepto recibir informacion sobre promociones y novedades
            </span>
          </label>

          {(localError || error) && (
            <p className="border-2 border-red-300/50 bg-red-500/20 px-3 py-2 text-sm text-red-100">
              {localError || error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full border-2 border-vino-oscuro bg-crema px-4 py-4 font-display text-2xl font-extrabold uppercase text-vino-oscuro shadow-hard transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-hard-sm disabled:opacity-60 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-hard"
          >
            {busy ? 'Guardando...' : 'Continuar a votar'}
          </button>
        </form>
      </section>
    </main>
  );
}
