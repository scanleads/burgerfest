import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

const EMPTY_DISTRIBUTION = { '1-2': 0, '3-4': 0, '5+': 0 };

export default function Metricas() {
  const [metrics, setMetrics] = useState({
    participantes: 0,
    votos8: 0,
    votos10: 0,
    distribucion: EMPTY_DISTRIBUTION,
    marketing: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadMetrics() {
    setLoading(true);
    setError('');

    const [
      participantesResult,
      votos8Result,
      votos10Result,
    ] = await Promise.all([
      supabase
        .from('participantes')
        .select('hamburguesas_probadas, acepta_marketing'),
      supabase
        .from('votos')
        .select('id', { count: 'exact', head: true })
        .eq('categoria', '8_dolares'),
      supabase
        .from('votos')
        .select('id', { count: 'exact', head: true })
        .eq('categoria', '10_dolares'),
    ]);

    if (participantesResult.error || votos8Result.error || votos10Result.error) {
      setError('No pudimos cargar las metricas del panel.');
      setLoading(false);
      return;
    }

    const participantes = participantesResult.data || [];
    const distribucion = participantes.reduce(
      (acc, row) => {
        const bucket = row.hamburguesas_probadas;

        if (bucket && acc[bucket] !== undefined) {
          acc[bucket] += 1;
        }

        return acc;
      },
      { ...EMPTY_DISTRIBUTION },
    );

    setMetrics({
      participantes: participantes.length,
      votos8: votos8Result.count || 0,
      votos10: votos10Result.count || 0,
      distribucion,
      marketing: participantes.filter((row) => row.acepta_marketing === true).length,
    });
    setLoading(false);
  }

  useEffect(() => {
    loadMetrics();
  }, []);

  return (
    <section className="border-2 border-vino-oscuro bg-vino/45 p-5 shadow-hard">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-dorado">
            Metricas rapidas
          </p>
          <h2 className="mt-1 font-display text-3xl font-extrabold uppercase text-crema">
            Resumen
          </h2>
        </div>
        <button
          className="border border-vino-oscuro bg-vino-oscuro px-3 py-1 text-xs font-bold uppercase text-crema"
          type="button"
          onClick={loadMetrics}
          disabled={loading}
        >
          Refrescar
        </button>
      </div>

      {loading ? <p className="mt-5 font-semibold text-texto-suave">Cargando metricas...</p> : null}
      {error ? <p className="mt-5 border border-dorado bg-vino-oscuro px-3 py-2 text-sm font-semibold text-crema">{error}</p> : null}

      {!loading && !error ? (
        <div className="mt-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="border-2 border-vino-oscuro bg-vino-oscuro p-3">
              <p className="text-xs font-bold uppercase text-texto-suave">Participantes</p>
              <p className="font-display text-4xl font-extrabold text-dorado">{metrics.participantes}</p>
            </div>
            <div className="border-2 border-vino-oscuro bg-vino-oscuro p-3">
              <p className="text-xs font-bold uppercase text-texto-suave">Marketing</p>
              <p className="font-display text-4xl font-extrabold text-dorado">{metrics.marketing}</p>
            </div>
            <div className="border-2 border-vino-oscuro bg-vino-oscuro p-3">
              <p className="text-xs font-bold uppercase text-texto-suave">Votos $8</p>
              <p className="font-display text-4xl font-extrabold text-crema">{metrics.votos8}</p>
            </div>
            <div className="border-2 border-vino-oscuro bg-vino-oscuro p-3">
              <p className="text-xs font-bold uppercase text-texto-suave">Votos $10</p>
              <p className="font-display text-4xl font-extrabold text-crema">{metrics.votos10}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-dorado">Hamburguesas probadas</p>
            <div className="mt-2 space-y-2">
              {Object.entries(metrics.distribucion).map(([label, value]) => (
                <div className="flex items-center justify-between border border-vino-oscuro bg-vino-oscuro px-3 py-2" key={label}>
                  <span className="font-semibold text-crema">{label}</span>
                  <span className="font-display text-2xl font-bold text-dorado">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
