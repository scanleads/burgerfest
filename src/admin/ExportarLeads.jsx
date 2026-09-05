import { useState } from 'react';
import { supabase } from '../lib/supabase.js';

const LEAD_COLUMNS = [
  'nombre',
  'apellido',
  'correo',
  'edad',
  'hamburguesas_probadas',
  'acepta_marketing',
  'ciudad',
  'registrado_en',
];

const CSV_COLUMNS = [
  ...LEAD_COLUMNS,
  'voto_8_hamburguesa',
  'voto_8_local',
  'voto_10_hamburguesa',
  'voto_10_local',
];

function escapeCsv(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const text = String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export default function ExportarLeads() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleDownload() {
    setBusy(true);
    setError('');
    setMessage('');

    const [leadsResult, votosResult, hamburguesasResult] = await Promise.all([
      supabase
        .from('participantes')
        .select(['id', ...LEAD_COLUMNS].join(', '))
        .order('registrado_en', { ascending: true }),
      supabase.from('votos').select('participante_id, hamburguesa_id, categoria'),
      supabase.from('hamburguesas').select('id, nombre, restaurante'),
    ]);

    const leadsError = leadsResult.error || votosResult.error || hamburguesasResult.error;

    if (leadsError) {
      setError('No pudimos descargar los leads. Revisa acceso authenticated/RLS.');
      setBusy(false);
      return;
    }

    const leads = leadsResult.data || [];
    const votos = votosResult.data || [];
    const hamburguesasPorId = new Map((hamburguesasResult.data || []).map((h) => [h.id, h]));

    const votosPorParticipante = new Map();
    for (const voto of votos) {
      if (!votosPorParticipante.has(voto.participante_id)) {
        votosPorParticipante.set(voto.participante_id, {});
      }
      votosPorParticipante.get(voto.participante_id)[voto.categoria] = voto.hamburguesa_id;
    }

    function votoColumnas(participanteId, categoria) {
      const hamburguesaId = votosPorParticipante.get(participanteId)?.[categoria];
      const hamburguesa = hamburguesaId ? hamburguesasPorId.get(hamburguesaId) : null;
      return {
        hamburguesa: hamburguesa?.nombre ?? '',
        local: hamburguesa?.restaurante ?? '',
      };
    }

    const filas = leads.map((lead) => {
      const voto8 = votoColumnas(lead.id, '8_dolares');
      const voto10 = votoColumnas(lead.id, '10_dolares');
      return {
        ...lead,
        voto_8_hamburguesa: voto8.hamburguesa,
        voto_8_local: voto8.local,
        voto_10_hamburguesa: voto10.hamburguesa,
        voto_10_local: voto10.local,
      };
    });

    const header = CSV_COLUMNS.join(',');
    const rows = filas.map((row) => CSV_COLUMNS.map((column) => escapeCsv(row[column])).join(','));
    const csv = `\uFEFF${[header, ...rows].join('\r\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `burgerfest-leads-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setMessage(`CSV generado con ${leads.length} leads.`);
    setBusy(false);
  }

  return (
    <section className="border-2 border-vino-oscuro bg-vino/45 p-5 shadow-hard">
      <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-dorado">
        Exportar leads
      </p>
      <h2 className="mt-1 font-display text-3xl font-extrabold uppercase text-crema">
        CSV para cliente
      </h2>
      <button
        className="mt-5 w-full border-2 border-vino-oscuro bg-dorado px-4 py-3 font-display text-xl font-extrabold uppercase text-vino-oscuro shadow-hard-sm transition hover:-translate-y-0.5 disabled:opacity-60"
        type="button"
        onClick={handleDownload}
        disabled={busy}
      >
        {busy ? 'Preparando CSV...' : 'Descargar leads CSV'}
      </button>
      {message ? <p className="mt-3 text-sm font-semibold text-dorado">{message}</p> : null}
      {error ? <p className="mt-3 border border-dorado bg-vino-oscuro px-3 py-2 text-sm font-semibold text-crema">{error}</p> : null}
    </section>
  );
}
