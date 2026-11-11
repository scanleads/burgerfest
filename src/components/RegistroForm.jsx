import { useEffect, useRef, useState } from 'react';
import LogoEvento from './LogoEvento.jsx';
import PieProductora from './PieProductora.jsx';
import { sugerirCorreo } from '../lib/sugerirCorreo.js';

const tastedOptions = ['1-2', '3-4', '5+'];

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function RegistroForm({ onSubmit, busy, error, onVerMenu, evento }) {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    edad: '',
    hamburguesas_probadas: '',
    acepta_marketing: false,
  });
  const [localError, setLocalError] = useState('');
  const [sugerenciaCorreo, setSugerenciaCorreo] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    if (formOpen) {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [formOpen]);

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

    if (!form.acepta_marketing) {
      setLocalError('Para votar necesitas aceptar recibir información. Marca la casilla y continúa.');
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
      <section className="entrada mx-auto w-full max-w-md">
        <header className="mb-7 text-center">
          <p className="pastilla-viva">Votación abierta</p>
          <p className="mt-3 text-sm font-semibold text-crema">
            El festival de hamburguesas{evento?.ciudad ? ` · ${evento.ciudad}` : ''}
          </p>
          <LogoEvento
            evento={evento}
            variante="blanco"
            className="mx-auto mt-3 h-[163px] w-auto max-w-full sm:h-[222px]"
            claseTexto="mt-3 text-6xl sm:text-7xl"
          />
          <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-texto-suave">
            Registrate una vez y elige tu hamburguesa favorita en cada categoria.
          </p>
          <button
            type="button"
            onClick={onVerMenu}
            className="btn btn-oro mt-6"
          >
            Ver menú completo
          </button>

          {!formOpen && (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="btn btn-crema mt-3"
            >
              Registrarme y votar
            </button>
          )}
        </header>

        {formOpen && (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="panel entrada space-y-4 p-4"
        >
          <label className="block">
            <span className="text-sm font-semibold text-crema">Nombre</span>
            <input
              value={form.nombre}
              onChange={(event) => updateField('nombre', event.target.value)}
              className="campo"
              autoComplete="given-name"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-crema">Apellido</span>
            <input
              value={form.apellido}
              onChange={(event) => updateField('apellido', event.target.value)}
              className="campo"
              autoComplete="family-name"
              required
            />
          </label>

          <div>
            <label className="block">
              <span className="text-sm font-semibold text-crema">Correo</span>
              <input
                type="email"
                value={form.correo}
                onChange={(event) => {
                  updateField('correo', event.target.value);
                  setSugerenciaCorreo(null);
                }}
                onBlur={() => setSugerenciaCorreo(sugerirCorreo(form.correo))}
                className="campo"
                autoComplete="email"
                inputMode="email"
                required
              />
            </label>
            {sugerenciaCorreo ? (
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-crema">
                <span>¿Quisiste decir {sugerenciaCorreo}?</span>
                <button
                  type="button"
                  onClick={() => {
                    updateField('correo', sugerenciaCorreo);
                    setSugerenciaCorreo(null);
                  }}
                  className="rounded-full bg-dorado px-3 py-1 text-xs font-extrabold uppercase text-vino-oscuro"
                >
                  Sí, corregir
                </button>
              </p>
            ) : null}
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-crema">Edad</span>
            <input
              type="number"
              min="1"
              max="120"
              value={form.edad}
              onChange={(event) => updateField('edad', event.target.value)}
              className="campo"
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
                    className={`tap-highlight-none rounded-xl border px-3 py-3 font-bold transition ${
                      selected
                        ? 'border-dorado bg-dorado text-vino-oscuro'
                        : 'border-white/20 bg-transparent text-texto-suave'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-white/15 bg-vino-fondo p-3">
            <input
              type="checkbox"
              checked={form.acepta_marketing}
              onChange={(event) => updateField('acepta_marketing', event.target.checked)}
              className="mt-1 h-5 w-5 accent-dorado"
            />
            <span className="text-sm leading-6 text-texto-suave">
              Acepto recibir información sobre promociones y novedades de Burger Fest y sus aliados. Es necesario para votar.
            </span>
          </label>

          {(localError || error) && (
            <p className="aviso" role="alert">
              {localError || error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn btn-crema"
          >
            {busy ? 'Guardando...' : 'Continuar a votar'}
          </button>
        </form>
        )}
      </section>

      <PieProductora />
    </main>
  );
}
