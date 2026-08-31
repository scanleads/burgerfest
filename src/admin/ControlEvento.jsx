import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function ControlEvento() {
  const [estado, setEstado] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadEstado() {
    setLoading(true);
    setError('');

    const { data, error: loadError } = await supabase
      .from('config')
      .select('valor')
      .eq('clave', 'estado')
      .single();

    if (loadError) {
      setError('No pudimos leer el estado del evento.');
    } else {
      setEstado(data?.valor || 'cerrado');
    }

    setLoading(false);
  }

  useEffect(() => {
    loadEstado();
  }, []);

  async function changeEstado(nextEstado) {
    if (nextEstado === 'cerrado') {
      const confirmed = window.confirm('Vas a cerrar la votacion. Nadie podra votar hasta que la abras otra vez.');

      if (!confirmed) {
        return;
      }
    }

    setSaving(true);
    setError('');

    const { error: updateError } = await supabase
      .from('config')
      .update({ valor: nextEstado })
      .eq('clave', 'estado');

    if (updateError) {
      setError('No pudimos actualizar el estado. Revisa las politicas RLS de admin.');
    } else {
      setEstado(nextEstado);
    }

    setSaving(false);
  }

  const isOpen = estado === 'abierto';

  return (
    <section className="border-2 border-vino-oscuro bg-vino/45 p-5 shadow-hard">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-dorado">
            Control del evento
          </p>
          <h2 className="mt-1 font-display text-3xl font-extrabold uppercase text-crema">
            Estado
          </h2>
        </div>
        <button
          className="border border-vino-oscuro bg-vino-oscuro px-3 py-1 text-xs font-bold uppercase text-crema"
          type="button"
          onClick={loadEstado}
          disabled={loading || saving}
        >
          Refrescar
        </button>
      </div>

      {loading ? (
        <p className="mt-5 font-semibold text-texto-suave">Cargando estado...</p>
      ) : (
        <div className="mt-5">
          <div
            className={`border-2 px-4 py-5 text-center ${
              isOpen
                ? 'border-dorado bg-dorado text-vino-oscuro'
                : 'border-vino-oscuro bg-vino-oscuro text-crema'
            }`}
          >
            <p className="font-display text-5xl font-extrabold uppercase leading-none">
              {isOpen ? 'Abierto' : 'Cerrado'}
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              className="border-2 border-vino-oscuro bg-dorado px-4 py-3 font-display text-xl font-extrabold uppercase text-vino-oscuro shadow-hard-sm disabled:opacity-50"
              type="button"
              onClick={() => changeEstado('abierto')}
              disabled={saving || isOpen}
            >
              Abrir
            </button>
            <button
              className="border-2 border-vino-oscuro bg-crema px-4 py-3 font-display text-xl font-extrabold uppercase text-vino-oscuro shadow-hard-sm disabled:opacity-50"
              type="button"
              onClick={() => changeEstado('cerrado')}
              disabled={saving || !isOpen}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {saving ? <p className="mt-3 text-sm font-semibold text-dorado">Guardando cambio...</p> : null}
      {error ? <p className="mt-3 border border-dorado bg-vino-oscuro px-3 py-2 text-sm font-semibold text-crema">{error}</p> : null}
    </section>
  );
}
