import { useState } from 'react';
import { supabase } from '../lib/supabase.js';

// Umbrales (editar aqui). Una fila se resalta en rojo cuando llega al umbral.
const RAFAGA_MOSTRAR = 5; // se muestra desde N votos al mismo local en el mismo minuto
const RAFAGA_ALERTA = 10; // rojo desde N votos en el minuto
const DOMINIO_ALERTA = 3; // registros con el mismo dominio no comun
const HORA_TOP = 10; // filas mostradas en concentracion por hora
const HORA_PCT_ALERTA = 40; // rojo si el local tiene >= este % de los votos de esa hora...
const HORA_MIN_VOTOS = 20; // ...Y al menos estos votos
const DISPOSITIVO_MOSTRAR = 2; // se muestra un device_id con MAS de N registros
const DISPOSITIVO_ALERTA = 10; // rojo desde N registros
const DEVICE_CHARS = 12; // caracteres del device_id que se muestran
const MAX_FILAS = 30; // filas mostradas en las demas senales

const DOMINIOS_COMUNES = [
  'gmail.com',
  'hotmail.com',
  'hotmail.es',
  'outlook.com',
  'outlook.es',
  'yahoo.com',
  'yahoo.es',
  'icloud.com',
  'live.com',
  'me.com',
];

const ZONA = 'America/Caracas';
const PAGE_SIZE = 1000;

const partsFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZONA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const lastRunFormatter = new Intl.DateTimeFormat('es-VE', {
  timeZone: ZONA,
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

function partsVenezuela(iso) {
  const parts = {};
  for (const part of partsFormatter.formatToParts(new Date(iso))) {
    parts[part.type] = part.value;
  }
  return parts;
}

function minutoKey(iso) {
  const p = partsVenezuela(iso);
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

function horaKey(iso) {
  const p = partsVenezuela(iso);
  return `${p.year}-${p.month}-${p.day} ${p.hour}:00`;
}

// "2026-10-13 15:32" -> "13/10 15:32"
function mostrarKey(key) {
  const [fecha, hora] = key.split(' ');
  const [, mes, dia] = fecha.split('-');
  return `${dia}/${mes} ${hora}`;
}

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

function contar(items, keyFn) {
  const counts = new Map();
  for (const item of items) {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function TablaSenal({ titulo, ayuda, columnas, filas }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-dorado">{titulo}</p>
      <p className="text-xs text-texto-suave">{ayuda}</p>
      {filas.length === 0 ? (
        <p className="mt-2 border-2 border-vino-oscuro bg-vino-oscuro px-3 py-2 text-sm font-semibold text-texto-suave">
          Sin alertas
        </p>
      ) : (
        <div className="mt-2 overflow-x-auto border-2 border-vino-oscuro">
          <table className="w-full text-left text-xs">
            <thead className="bg-vino-oscuro text-texto-suave">
              <tr>
                {columnas.map((columna) => (
                  <th key={columna} className="px-2 py-1.5 font-bold uppercase">
                    {columna}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr
                  key={fila.key}
                  className={
                    fila.alerta
                      ? 'bg-red-900/70 font-bold text-white'
                      : 'border-t border-vino-oscuro text-crema'
                  }
                >
                  {fila.celdas.map((celda, index) => (
                    <td key={index} className="whitespace-nowrap px-2 py-1.5">
                      {celda}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AlertasFraude() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lastRun, setLastRun] = useState('');
  const [senales, setSenales] = useState(null);

  async function handleAnalizar() {
    setBusy(true);
    setError('');

    const [votosResult, hamburguesasResult, dominiosResult, dispositivosResult] = await Promise.all([
      fetchAllRows(() =>
        supabase
          .from('votos')
          .select('id, participante_id, hamburguesa_id, votado_en')
          .order('id', { ascending: true })
      ),
      fetchAllRows(() =>
        supabase.from('hamburguesas').select('id, restaurante').order('id', { ascending: true })
      ),
      // Los dominios comunes se excluyen en el servidor para traer solo correos no comunes.
      fetchAllRows(() => {
        let query = supabase.from('participantes').select('id, correo');
        for (const dominio of DOMINIOS_COMUNES) {
          query = query.not('correo', 'ilike', `%@${dominio}`);
        }
        return query.order('id', { ascending: true });
      }),
      fetchAllRows(() =>
        supabase
          .from('participantes')
          .select('id, device_id')
          .not('device_id', 'is', null)
          .order('id', { ascending: true })
      ),
    ]);

    const failed =
      votosResult.error || hamburguesasResult.error || dominiosResult.error || dispositivosResult.error;

    if (failed) {
      setError('No pudimos analizar los datos. Revisa tu sesion de admin e intenta de nuevo.');
      setBusy(false);
      return;
    }

    const restaurantePorId = new Map(hamburguesasResult.data.map((h) => [h.id, h.restaurante]));
    const votosTodos = votosResult.data.map((voto) => ({
      participante_id: voto.participante_id,
      restaurante: restaurantePorId.get(voto.hamburguesa_id) || 'Sin local',
      votado_en: voto.votado_en,
    }));
    const votos = votosTodos.filter((voto) => voto.votado_en);

    const rafagas = [...contar(votos, (v) => `${v.restaurante}|${minutoKey(v.votado_en)}`)]
      .map(([key, total]) => {
        const [restaurante, minuto] = key.split('|');
        return { key, restaurante, minuto, total };
      })
      .filter((row) => row.total >= RAFAGA_MOSTRAR)
      .sort((a, b) => b.total - a.total)
      .slice(0, MAX_FILAS)
      .map((row) => ({
        key: row.key,
        alerta: row.total >= RAFAGA_ALERTA,
        celdas: [row.restaurante, mostrarKey(row.minuto), row.total],
      }));

    const dominios = [
      ...contar(dominiosResult.data, (p) => (p.correo || '').toLowerCase().split('@')[1] || '(sin dominio)'),
    ]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_FILAS)
      .map(([dominio, total]) => ({
        key: dominio,
        alerta: total >= DOMINIO_ALERTA,
        celdas: [dominio, total],
      }));

    const totalPorHora = contar(votos, (v) => horaKey(v.votado_en));
    const horas = [...contar(votos, (v) => `${v.restaurante}|${horaKey(v.votado_en)}`)]
      .map(([key, total]) => {
        const [restaurante, hora] = key.split('|');
        const pct = (total / totalPorHora.get(hora)) * 100;
        return { key, restaurante, hora, total, pct };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, HORA_TOP)
      .map((row) => ({
        key: row.key,
        alerta: row.pct >= HORA_PCT_ALERTA && row.total >= HORA_MIN_VOTOS,
        celdas: [row.restaurante, mostrarKey(row.hora), row.total, `${Math.round(row.pct)}%`],
      }));

    // Cruce device_id -> participantes -> votos -> restaurante
    const deviceDeParticipante = new Map(dispositivosResult.data.map((p) => [p.id, p.device_id]));
    const votosPorDispositivo = new Map();
    for (const voto of votosTodos) {
      const deviceId = deviceDeParticipante.get(voto.participante_id);
      if (!deviceId) continue;
      if (!votosPorDispositivo.has(deviceId)) votosPorDispositivo.set(deviceId, []);
      votosPorDispositivo.get(deviceId).push(voto.restaurante);
    }

    function localMasVotado(deviceId) {
      const restaurantes = votosPorDispositivo.get(deviceId) || [];
      if (restaurantes.length === 0) return '-';
      const [local, total] = [...contar(restaurantes, (r) => r)].sort((a, b) => b[1] - a[1])[0];
      return `${local} (${Math.round((total / restaurantes.length) * 100)}%)`;
    }

    const dispositivos = [...contar(dispositivosResult.data, (p) => p.device_id)]
      .filter(([, total]) => total > DISPOSITIVO_MOSTRAR)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_FILAS)
      .map(([deviceId, total]) => ({
        key: deviceId,
        alerta: total >= DISPOSITIVO_ALERTA,
        celdas: [`${deviceId.slice(0, DEVICE_CHARS)}…`, total, localMasVotado(deviceId)],
      }));

    setSenales({ rafagas, dominios, horas, dispositivos });
    setLastRun(lastRunFormatter.format(new Date()));
    setBusy(false);
  }

  return (
    <section className="border-2 border-vino-oscuro bg-vino/45 p-5 shadow-hard">
      <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-dorado">
        Antifraude
      </p>
      <h2 className="mt-1 font-display text-3xl font-extrabold uppercase text-crema">Alertas</h2>

      <button
        className="mt-5 w-full border-2 border-vino-oscuro bg-dorado px-4 py-3 font-display text-xl font-extrabold uppercase text-vino-oscuro shadow-hard-sm transition hover:-translate-y-0.5 disabled:opacity-60"
        type="button"
        onClick={handleAnalizar}
        disabled={busy}
      >
        {busy ? 'Analizando...' : 'Analizar ahora'}
      </button>
      <p className="mt-2 text-xs font-semibold text-texto-suave">
        {lastRun ? `Ultimo analisis: ${lastRun} (hora de Venezuela)` : 'Aun no se ha analizado.'}
      </p>
      {error ? (
        <p className="mt-3 border border-dorado bg-vino-oscuro px-3 py-2 text-sm font-semibold text-crema">{error}</p>
      ) : null}

      {senales ? (
        <div className="mt-5 space-y-5">
          <TablaSenal
            titulo="Rafagas"
            ayuda={`Desde ${RAFAGA_MOSTRAR} votos al mismo local en un minuto; rojo desde ${RAFAGA_ALERTA}`}
            columnas={['Local', 'Minuto', 'Votos']}
            filas={senales.rafagas}
          />
          <TablaSenal
            titulo="Dominios no comunes"
            ayuda={`Rojo desde ${DOMINIO_ALERTA} registros`}
            columnas={['Dominio', 'Registros']}
            filas={senales.dominios}
          />
          <TablaSenal
            titulo="Concentracion por hora"
            ayuda={`Top ${HORA_TOP}; rojo si el local tiene ${HORA_PCT_ALERTA}% o mas de los votos de la hora y ${HORA_MIN_VOTOS}+ votos`}
            columnas={['Local', 'Hora', 'Votos', '% de la hora']}
            filas={senales.horas}
          />
          <TablaSenal
            titulo="Dispositivos repetidos"
            ayuda={`Mas de ${DISPOSITIVO_MOSTRAR} registros con el mismo dispositivo; rojo desde ${DISPOSITIVO_ALERTA}`}
            columnas={['Dispositivo', 'Registros', 'Local mas votado']}
            filas={senales.dispositivos}
          />
        </div>
      ) : null}
    </section>
  );
}
