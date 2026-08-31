import { useState } from 'react';
import { supabase } from '../lib/supabase.js';

const COLUMNS = [
  'nombre',
  'apellido',
  'correo',
  'edad',
  'hamburguesas_probadas',
  'acepta_marketing',
  'ciudad',
  'registrado_en',
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

    const { data, error: leadsError } = await supabase
      .from('participantes')
      .select(COLUMNS.join(', '))
      .order('registrado_en', { ascending: true });

    if (leadsError) {
      setError('No pudimos descargar los leads. Revisa acceso authenticated/RLS.');
      setBusy(false);
      return;
    }

    const header = COLUMNS.join(',');
    const rows = (data || []).map((row) => COLUMNS.map((column) => escapeCsv(row[column])).join(','));
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

    setMessage(`CSV generado con ${(data || []).length} leads.`);
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
