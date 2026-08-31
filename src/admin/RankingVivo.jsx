import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';

const CATEGORIES = [
  { id: '8_dolares', label: 'Mejor hamburguesa de $8' },
  { id: '10_dolares', label: 'Mejor hamburguesa de $10' },
];

function CategoryRanking({ category, rows }) {
  const sortedRows = [...rows].sort((a, b) => Number(b.total_votos) - Number(a.total_votos));
  const total = sortedRows.reduce((sum, row) => sum + Number(row.total_votos || 0), 0);
  const maxVotes = Math.max(...sortedRows.map((row) => Number(row.total_votos || 0)), 0);

  return (
    <div className="border-2 border-vino-oscuro bg-vino/35 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h3 className="font-display text-2xl font-extrabold uppercase text-crema">
          {category.label}
        </h3>
        <p className="font-display text-xl font-bold uppercase text-dorado">
          Total: {total} votos
        </p>
      </div>

      <div className="mt-4 space-y-4">
        {sortedRows.length === 0 ? (
          <p className="border border-vino-oscuro bg-vino-oscuro px-4 py-3 text-sm font-semibold text-crema">
            No hay hamburguesas activas en esta categoria.
          </p>
        ) : (
          sortedRows.map((row, index) => {
            const votes = Number(row.total_votos || 0);
            const percent = total > 0 ? Math.round((votes / total) * 100) : 0;
            const width = maxVotes > 0 ? Math.max((votes / maxVotes) * 100, votes > 0 ? 8 : 0) : 0;
            const leader = index === 0 && votes > 0;

            return (
              <article
                className={`border-2 p-3 ${leader ? 'border-dorado bg-vino-oscuro' : 'border-vino-oscuro bg-vino/30'}`}
                key={row.id}
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-display text-xl font-extrabold uppercase text-crema">
                      {leader ? 'Lider - ' : ''}{row.nombre}
                    </p>
                    <p className="text-sm font-semibold text-texto-suave">{row.restaurante}</p>
                  </div>
                  <p className="font-display text-2xl font-extrabold text-dorado">
                    {votes} <span className="text-base text-crema">({percent}%)</span>
                  </p>
                </div>
                <div className="mt-3 h-5 overflow-hidden border-2 border-vino-oscuro bg-vino-fondo">
                  <div
                    className={`h-full transition-all duration-700 ${leader ? 'bg-dorado' : 'bg-crema'}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function RankingVivo() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  async function loadRanking(showLoader = false) {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError('');

    const { data, error: rankingError } = await supabase
      .from('ranking_hamburguesas')
      .select('id, nombre, restaurante, categoria, foto_url, total_votos')
      .order('categoria', { ascending: true })
      .order('total_votos', { ascending: false });

    if (rankingError) {
      setError('No pudimos cargar el ranking en vivo.');
    } else {
      setRows(data || []);
      setLastUpdated(new Date());
    }

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadRanking(true);
    const timer = window.setInterval(() => loadRanking(false), 12000);

    return () => window.clearInterval(timer);
  }, []);

  const rowsByCategory = useMemo(() => {
    return CATEGORIES.reduce((acc, category) => {
      acc[category.id] = rows.filter((row) => row.categoria === category.id);
      return acc;
    }, {});
  }, [rows]);

  return (
    <section className="border-2 border-vino-oscuro bg-vino/45 p-5 shadow-hard">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-dorado">
            Resultados en vivo
          </p>
          <h2 className="mt-1 font-display text-4xl font-extrabold uppercase text-crema">
            Ranking por categoria
          </h2>
        </div>
        <div className="text-sm font-semibold text-texto-suave">
          {refreshing ? 'Actualizando...' : lastUpdated ? `Actualizado ${lastUpdated.toLocaleTimeString('es-VE')}` : ''}
        </div>
      </div>

      {loading ? <p className="mt-5 font-semibold text-texto-suave">Cargando ranking...</p> : null}
      {error ? <p className="mt-5 border border-dorado bg-vino-oscuro px-4 py-3 text-sm font-semibold text-crema">{error}</p> : null}

      {!loading ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {CATEGORIES.map((category) => (
            <CategoryRanking
              category={category}
              key={category.id}
              rows={rowsByCategory[category.id] || []}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
