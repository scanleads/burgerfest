import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

const INITIAL_FORM = {
  nombre: '',
  restaurante: '',
  categoria: '8_dolares',
  foto_url: '',
};

function categoryLabel(category) {
  return category === '10_dolares' ? '$10' : '$8';
}

export default function GestionBurgers() {
  const [burgers, setBurgers] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadBurgers() {
    setLoading(true);
    setError('');

    const { data, error: burgersError } = await supabase
      .from('hamburguesas')
      .select('id, nombre, restaurante, categoria, foto_url, orden, activa, creada_en')
      .order('categoria', { ascending: true })
      .order('orden', { ascending: true })
      .order('creada_en', { ascending: true });

    if (burgersError) {
      setError('No pudimos cargar las hamburguesas.');
    } else {
      setBurgers(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadBurgers();
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    const payload = {
      nombre: form.nombre.trim(),
      restaurante: form.restaurante.trim(),
      categoria: form.categoria,
      foto_url: form.foto_url.trim() || null,
      activa: true,
    };

    const { error: insertError } = await supabase
      .from('hamburguesas')
      .insert(payload);

    if (insertError) {
      setError('No pudimos crear la hamburguesa. Revisa los campos y las politicas RLS.');
    } else {
      setForm(INITIAL_FORM);
      setMessage('Hamburguesa creada.');
      await loadBurgers();
    }

    setSaving(false);
  }

  async function toggleActive(burger) {
    setError('');
    setMessage('');

    const { error: updateError } = await supabase
      .from('hamburguesas')
      .update({ activa: !burger.activa })
      .eq('id', burger.id);

    if (updateError) {
      setError('No pudimos actualizar la hamburguesa.');
      return;
    }

    setBurgers((current) =>
      current.map((item) => (item.id === burger.id ? { ...item, activa: !item.activa } : item)),
    );
    setMessage(`${burger.nombre} quedo ${burger.activa ? 'inactiva' : 'activa'}.`);
  }

  return (
    <section className="border-2 border-vino-oscuro bg-vino/45 p-5 shadow-hard">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-dorado">
            Gestion de hamburguesas
          </p>
          <h2 className="mt-1 font-display text-4xl font-extrabold uppercase text-crema">
            Competidores
          </h2>
        </div>
        <button
          className="border border-vino-oscuro bg-vino-oscuro px-3 py-2 text-xs font-bold uppercase text-crema"
          type="button"
          onClick={loadBurgers}
          disabled={loading}
        >
          Refrescar
        </button>
      </div>

      <form className="mt-5 grid gap-3 border-2 border-vino-oscuro bg-vino/35 p-4 md:grid-cols-5" onSubmit={handleSubmit}>
        <input
          className="border-2 border-vino-oscuro bg-blanco px-3 py-2 text-vino-oscuro outline-none focus:border-dorado"
          type="text"
          placeholder="Nombre"
          value={form.nombre}
          onChange={(event) => updateField('nombre', event.target.value)}
          required
        />
        <input
          className="border-2 border-vino-oscuro bg-blanco px-3 py-2 text-vino-oscuro outline-none focus:border-dorado"
          type="text"
          placeholder="Restaurante"
          value={form.restaurante}
          onChange={(event) => updateField('restaurante', event.target.value)}
          required
        />
        <select
          className="border-2 border-vino-oscuro bg-blanco px-3 py-2 text-vino-oscuro outline-none focus:border-dorado"
          value={form.categoria}
          onChange={(event) => updateField('categoria', event.target.value)}
        >
          <option value="8_dolares">$8</option>
          <option value="10_dolares">$10</option>
        </select>
        <input
          className="border-2 border-vino-oscuro bg-blanco px-3 py-2 text-vino-oscuro outline-none focus:border-dorado"
          type="url"
          placeholder="Foto URL"
          value={form.foto_url}
          onChange={(event) => updateField('foto_url', event.target.value)}
        />
        <button
          className="border-2 border-vino-oscuro bg-dorado px-3 py-2 font-display text-xl font-extrabold uppercase text-vino-oscuro shadow-hard-sm disabled:opacity-60"
          type="submit"
          disabled={saving}
        >
          {saving ? 'Creando...' : 'Crear'}
        </button>
      </form>

      {loading ? <p className="mt-5 font-semibold text-texto-suave">Cargando hamburguesas...</p> : null}
      {message ? <p className="mt-4 text-sm font-semibold text-dorado">{message}</p> : null}
      {error ? <p className="mt-4 border border-dorado bg-vino-oscuro px-4 py-3 text-sm font-semibold text-crema">{error}</p> : null}

      {!loading ? (
        <div className="mt-5 overflow-x-auto border-2 border-vino-oscuro">
          <table className="min-w-full border-collapse bg-vino/35 text-left text-sm">
            <thead className="bg-vino-oscuro text-xs uppercase text-dorado">
              <tr>
                <th className="px-3 py-3">Categoria</th>
                <th className="px-3 py-3">Nombre</th>
                <th className="px-3 py-3">Restaurante</th>
                <th className="px-3 py-3">Foto</th>
                <th className="px-3 py-3">Estado</th>
                <th className="px-3 py-3">Accion</th>
              </tr>
            </thead>
            <tbody>
              {burgers.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 font-semibold text-crema" colSpan="6">
                    No hay hamburguesas cargadas.
                  </td>
                </tr>
              ) : (
                burgers.map((burger) => (
                  <tr className="border-t border-vino-oscuro" key={burger.id}>
                    <td className="px-3 py-3 font-display text-xl font-bold text-dorado">
                      {categoryLabel(burger.categoria)}
                    </td>
                    <td className="px-3 py-3 font-semibold text-crema">{burger.nombre}</td>
                    <td className="px-3 py-3 text-texto-suave">{burger.restaurante}</td>
                    <td className="max-w-[14rem] truncate px-3 py-3 text-texto-suave">
                      {burger.foto_url || '-'}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`border px-2 py-1 text-xs font-bold uppercase ${burger.activa ? 'border-dorado text-dorado' : 'border-crema text-crema'}`}>
                        {burger.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        className="border border-vino-oscuro bg-crema px-3 py-2 text-xs font-bold uppercase text-vino-oscuro"
                        type="button"
                        onClick={() => toggleActive(burger)}
                      >
                        {burger.activa ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
