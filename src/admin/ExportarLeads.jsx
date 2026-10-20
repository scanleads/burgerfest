import { useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { fueraDeZona } from '../lib/zonaHoraria.js';

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

// Columnas extra del CSV interno (Scanleads). Nunca van en el CSV del cliente.
const INTERNAL_COLUMNS = [...CSV_COLUMNS, 'ip', 'pais', 'zona_horaria', 'revision', 'cuenta_en_ranking'];

// Excel convierte "1-2" y "3-4" en fechas; en ambos CSV se escriben como texto.
const PROBADAS_CLIENTE = { '1-2': '1 a 2', '3-4': '3 a 4', '5+': '5 o más' };

const PAGE_SIZE = 1000;

async function fetchAllRows(buildQuery) {
  const rows = [];
  let from = 0;

  while (true) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);

    if (error) {
      return { data: null, error };
    }

    const page = data || [];
    rows.push(...page);

    if (page.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return { data: rows, error: null };
}

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

// Misma regla que la vista ranking_hamburguesas.
function cuentaEnRanking(lead, filtroZonaActivo) {
  if (lead.revision === 'excluido') return 'cuarentena';
  if (lead.revision === 'valido') return 'si';
  if (lead.revision == null && filtroZonaActivo && fueraDeZona(lead.zona_horaria)) return 'cuarentena';
  return 'si';
}

export default function ExportarLeads({ evento }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleDownload(interno = false) {
    setBusy(true);
    setError('');
    setMessage('');

    const leadSelect = interno ? [...LEAD_COLUMNS, 'ip', 'pais', 'zona_horaria', 'revision'] : LEAD_COLUMNS;

    const [leadsResult, votosResult, hamburguesasResult] = await Promise.all([
      fetchAllRows(() =>
        supabase
          .from('participantes')
          .select(['id', ...leadSelect].join(', '))
          .eq('evento_id', evento.id)
          .order('registrado_en', { ascending: true })
          .order('id', { ascending: true })
      ),
      fetchAllRows(() =>
        supabase
          .from('votos')
          .select('id, participante_id, hamburguesa_id, categoria')
          .eq('evento_id', evento.id)
          .order('id', { ascending: true })
      ),
      fetchAllRows(() =>
        supabase.from('hamburguesas').select('id, nombre, restaurante').eq('evento_id', evento.id).order('id', { ascending: true })
      ),
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

    // El interruptor del filtro vive en el evento (eventos.filtro_zona_horaria)
    const filtroZonaActivo = Boolean(evento.filtro_zona_horaria);

    const filas = leads.map((lead) => {
      const voto8 = votoColumnas(lead.id, '8_dolares');
      const voto10 = votoColumnas(lead.id, '10_dolares');
      return {
        ...lead,
        hamburguesas_probadas: PROBADAS_CLIENTE[lead.hamburguesas_probadas] ?? lead.hamburguesas_probadas,
        voto_8_hamburguesa: voto8.hamburguesa,
        voto_8_local: voto8.local,
        voto_10_hamburguesa: voto10.hamburguesa,
        voto_10_local: voto10.local,
        cuenta_en_ranking: interno ? cuentaEnRanking(lead, filtroZonaActivo) : '',
      };
    });

    const columns = interno ? INTERNAL_COLUMNS : CSV_COLUMNS;
    const header = columns.join(',');
    const rows = filas.map((row) => columns.map((column) => escapeCsv(row[column])).join(','));
    const csv = `\uFEFF${[header, ...rows].join('\r\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = interno
      ? `burgerfest-leads-INTERNO-antifraude-${evento.slug}-${date}.csv`
      : `burgerfest-leads-${evento.slug}-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setMessage(`CSV${interno ? ' interno' : ''} generado con ${leads.length} leads.`);
    setBusy(false);
  }

  return (
    <section className="border-2 border-vino-oscuro bg-vino/45 p-5 shadow-hard">
      <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-crema">
        Exportar leads
      </p>
      <h2 className="mt-1 font-display text-3xl font-extrabold uppercase text-crema">
        CSV para cliente
      </h2>
      <button
        className="mt-5 w-full border-2 border-vino-oscuro bg-dorado px-4 py-3 font-display text-xl font-extrabold uppercase text-vino-oscuro shadow-hard-sm transition hover:-translate-y-0.5 disabled:opacity-60"
        type="button"
        onClick={() => handleDownload(false)}
        disabled={busy}
      >
        {busy ? 'Preparando CSV...' : 'Descargar leads CSV'}
      </button>
      <button
        className="mt-3 w-full border-2 border-dorado bg-transparent px-4 py-3 font-display text-base font-extrabold uppercase text-dorado transition hover:bg-vino-oscuro disabled:opacity-60"
        type="button"
        onClick={() => handleDownload(true)}
        disabled={busy}
      >
        Descargar CSV interno (antifraude) — NO enviar al cliente
      </button>
      {message ? <p className="mt-3 text-sm font-semibold text-crema">{message}</p> : null}
      {error ? <p className="mt-3 border border-dorado bg-vino-oscuro px-3 py-2 text-sm font-semibold text-crema">{error}</p> : null}
    </section>
  );
}
