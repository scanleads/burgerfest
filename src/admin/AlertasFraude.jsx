import { useCallback, useEffect, useRef, useState } from 'react';
import { aMs } from '../lib/evento.js';
import { supabase } from '../lib/supabase.js';

// Las alertas las calcula el SERVIDOR (analizar_evento, cada 5 min por pg_cron) y se guardan en la tabla alertas.
// Este panel solo las lee (RPC alertas_evento), las marca (marcar_alerta) y pide un re-analisis (reanalizar_evento).
// Los umbrales viven en la tabla umbrales_alerta (se cambian por SQL, sin deploy): los textos de ayuda los leen de
// estado_analisis. Las alertas son de OBSERVACION: nunca ponen a nadie en cuarentena.

const PAGE_SIZE = 1000;
const REFRESCO_MS = 60000;
const DEVICE_CHARS = 12; // caracteres del device_id que se muestran

const ERRORES = {
  no_autorizado: 'No tienes permiso para esta accion.',
  evento_no_encontrado: 'El evento ya no existe. Refresca la pagina.',
  estado_invalido: 'Estado no valido.',
};

function mensajeError(error, defecto) {
  const texto = String(error?.message || '');
  const codigo = Object.keys(ERRORES).find((clave) => texto.includes(clave));
  return codigo ? ERRORES[codigo] : defecto;
}

const lastRunFormatter = (zona) =>
  new Intl.DateTimeFormat('es-VE', {
    timeZone: zona,
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

// "2026-10-13 15:32" -> "13/10 15:32" (las claves de minuto y hora ya vienen en la hora del evento)
function mostrarKey(key) {
  if (!key) return '-';
  const [fecha, hora] = key.split(' ');
  const [, mes, dia] = fecha.split('-');
  return `${dia}/${mes} ${hora.length === 2 ? `${hora}:00` : hora}`;
}

function corto(valor) {
  const texto = String(valor || '');
  return texto.length > DEVICE_CHARS ? `${texto.slice(0, DEVICE_CHARS)}…` : texto;
}

function pct(valor) {
  return valor === null || valor === undefined ? '-' : `${Math.round(Number(valor))}%`;
}

function localTop(d) {
  return d.local_top ? `${d.local_top} (${pct(d.pct_top)})` : '-';
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

// Una tabla por senal: titulo, ayuda (con los umbrales del servidor), columnas y celdas desde detalle
const SENALES = [
  {
    senal: 'rafaga',
    titulo: 'Rafagas',
    ayuda: (u) => `Desde ${u['rafaga.mostrar']} votos al mismo local en un minuto; rojo desde ${u['rafaga.roja']}`,
    columnas: ['Local', 'Minuto', 'Votos'],
    celdas: (d) => [d.local, mostrarKey(d.minuto), d.votos],
  },
  {
    senal: 'concentracion_hora',
    titulo: 'Concentracion por hora',
    ayuda: (u) =>
      `Rojo si el local tiene ${u['concentracion_hora.pct_roja']}% o mas de los votos de la hora y ${u['concentracion_hora.min_votos']}+ votos`,
    columnas: ['Local', 'Hora', 'Votos', '% de la hora'],
    celdas: (d) => [d.local, mostrarKey(d.hora), d.votos, pct(d.pct)],
  },
  {
    senal: 'dominio_raro',
    titulo: 'Dominios no comunes',
    ayuda: (u) => `Rojo desde ${u['dominio_raro.roja']} registros con un dominio que no esta en la lista de comunes`,
    columnas: ['Dominio', 'Registros'],
    celdas: (d) => [d.dominio, d.registros],
  },
  {
    senal: 'dispositivo',
    titulo: 'Dispositivos repetidos',
    ayuda: (u) =>
      `Mas de ${u['dispositivo.mostrar']} registros con el mismo dispositivo; amarilla desde ${u['dispositivo.amarilla']} registros y ${u['dispositivo.pct_amarilla']}% o mas de sus votos al mismo local (registro asistido en los stands: no es fraude por si solo)`,
    columnas: ['Dispositivo', 'Registros', 'Local mas votado'],
    celdas: (d) => [corto(d.device_id), d.registros, localTop(d)],
  },
  {
    senal: 'ubicacion',
    titulo: 'Ubicacion',
    ayuda: (u) =>
      `Fuera de zona = zona horaria fuera de las permitidas del evento (los rescatados no cuentan); pais distinto de VE es solo informativo (VPN). Rojo desde ${u['ubicacion.roja_votos']} votos fuera de zona y ${u['ubicacion.roja_pct']}% o mas de los votos del local`,
    columnas: ['Local', 'Fuera de zona', 'Pais distinto de VE', 'Votos del local', '% fuera de zona'],
    celdas: (d) => [d.local, d.fuera_zona, d.fuera_pais, d.votos, pct(d.pct_fuera_zona)],
  },
  {
    senal: 'velocidad',
    titulo: 'Velocidad',
    ayuda: (u) =>
      `Mas de ${u['velocidad.registros']} registros de una misma IP o dispositivo en ${u['velocidad.minutos']} minutos; rojo si ademas ${u['velocidad.pct_roja']}% o mas de esos votos van a un local`,
    columnas: ['Tipo', 'IP / dispositivo', 'Registros en la ventana', 'Local mas votado'],
    celdas: (d) => [d.tipo === 'ip' ? 'IP' : 'Dispositivo', d.tipo === 'ip' ? d.valor : corto(d.valor), d.max_registros, localTop(d)],
  },
  {
    senal: 'ip_exclusiva',
    titulo: 'IP exclusiva de un local',
    ayuda: (u) =>
      `Desde ${u['ip_exclusiva.min_registros']} registros de una IP con ${u['ip_exclusiva.pct']}% o mas de sus votos a un local; rojo con ${u['ip_exclusiva.roja_registros']}+ registros o todos en menos de ${u['ip_exclusiva.roja_minutos']} min. El wifi de un hotel reparte sus votos y no sale`,
    columnas: ['IP', 'Registros', 'Votos', 'Local', 'Duracion'],
    celdas: (d) => [d.ip, d.registros, d.votos, localTop(d), d.duracion_min === null ? '-' : `${Math.round(Number(d.duracion_min))} min`],
  },
  {
    senal: 'doble_local',
    titulo: 'Indice de movilizacion por local',
    ayuda: (u) =>
      `% de los votantes del local que voto ese mismo local en todas las categorias. Amarilla desde la mediana del evento + ${u['doble_local.puntos_sobre_mediana']} puntos; rojo si ademas tiene ${u['doble_local.min_votantes_roja']}+ votantes (a) o si mas del ${u['doble_local.pct_concentracion']}% de sus ${u['doble_local.min_dobles_b']}+ "dobles" se registro en una misma hora o IP (b). Con menos de ${u['doble_local.min_locales_mediana']} locales, solo informativo`,
    columnas: ['Local', 'Votantes', 'Mismo local', 'Indice', 'Mediana', 'Motivo'],
    celdas: (d) => [
      d.local,
      d.base,
      d.dobles,
      pct(d.indice),
      pct(d.mediana),
      [d.cond_a ? '(a)' : '', d.cond_b ? `(b) hora ${pct(d.pct_misma_hora)} / IP ${pct(d.pct_misma_ip)}` : ''].filter(Boolean).join(' ') || '-',
    ],
  },
];

function claseFila(alerta) {
  const base = alerta.estado === 'descartada' ? 'opacity-50 ' : '';
  if (alerta.severidad === 'roja') return `${base}bg-dorado font-bold text-vino-oscuro`;
  if (alerta.severidad === 'amarilla') return `${base}border-t border-vino-oscuro border-l-4 border-l-dorado text-crema`;
  return `${base}border-t border-vino-oscuro text-crema`;
}

function TablaSenal({ titulo, ayuda, columnas, filas, celdas, onMarcar, busy }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-crema">{titulo}</p>
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
                <th className="px-2 py-1.5 font-bold uppercase">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((alerta) => (
                <tr key={alerta.id} className={claseFila(alerta)}>
                  {celdas(alerta.detalle || {}).map((celda, index) => (
                    <td key={index} className="whitespace-nowrap px-2 py-1.5">
                      {celda ?? '-'}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-2 py-1.5">
                    {alerta.estado === 'nueva' ? (
                      <span className="flex gap-1">
                        <button
                          className="border border-current px-1.5 py-0.5 font-bold uppercase disabled:opacity-50"
                          type="button"
                          onClick={() => onMarcar(alerta, 'vista')}
                          disabled={busy}
                        >
                          Vista
                        </button>
                        <button
                          className="border border-current px-1.5 py-0.5 font-bold uppercase disabled:opacity-50"
                          type="button"
                          onClick={() => onMarcar(alerta, 'descartada')}
                          disabled={busy}
                        >
                          Descartar
                        </button>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <span className="uppercase">{alerta.estado}</span>
                        <button
                          className="border border-current px-1.5 py-0.5 font-bold uppercase disabled:opacity-50"
                          type="button"
                          onClick={() => onMarcar(alerta, 'nueva')}
                          disabled={busy}
                        >
                          Reabrir
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AlertasFraude({ evento, version, onAnalizado }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [alertas, setAlertas] = useState(null);
  const [umbrales, setUmbrales] = useState({});
  const [ultimo, setUltimo] = useState(null);
  const [soloNuevas, setSoloNuevas] = useState(false);

  // Numero de la ultima carga pedida: una respuesta que llega tarde (desordenada) se descarta (M8)
  const ultimaCarga = useRef(0);

  const cargar = useCallback(async () => {
    ultimaCarga.current += 1;
    const esta = ultimaCarga.current;
    const [alertasResult, estadoResult] = await Promise.all([
      fetchAllRows(() => supabase.rpc('alertas_evento', { p_evento: evento.id, p_estado: null })),
      supabase.rpc('estado_analisis', { p_evento: evento.id }),
    ]);

    if (esta !== ultimaCarga.current) {
      return;
    }

    if (alertasResult.error || estadoResult.error || !estadoResult.data?.ok) {
      setError('No pudimos leer las alertas. Revisa tu sesion de admin e intenta de nuevo.');
      return;
    }

    setError('');
    setAlertas(alertasResult.data);
    setUmbrales(estadoResult.data.umbrales || {});
    setUltimo(aMs(estadoResult.data.ultimo_analisis));
  }, [evento.id]);

  useEffect(() => {
    cargar();
    // Con la pestana oculta no se consulta (M8)
    const timer = window.setInterval(() => {
      if (!document.hidden) cargar();
    }, REFRESCO_MS);

    return () => window.clearInterval(timer);
  }, [cargar, version]);

  async function handleReanalizar() {
    setBusy(true);
    setError('');
    setMensaje('');

    const { data, error: rpcError } = await supabase.rpc('reanalizar_evento', { p_evento: evento.id });

    if (rpcError) {
      setError(mensajeError(rpcError, 'No pudimos re-analizar. Intenta de nuevo.'));
    } else if (!data?.ok) {
      setError(`El analisis fallo en el servidor: ${data?.error || 'error desconocido'}`);
    } else {
      setMensaje(`Analisis listo: ${data.total} alertas (${data.nuevas} nuevas).`);
    }

    // onAnalizado cambia "version": eso recarga esta lista y el badge (una sola carga, M8)
    onAnalizado?.();
    setBusy(false);
  }

  async function handleMarcar(alerta, estado) {
    setBusy(true);
    setError('');
    setMensaje('');

    const { error: rpcError } = await supabase.rpc('marcar_alerta', { p_id: alerta.id, p_estado: estado });

    if (rpcError) {
      setError(mensajeError(rpcError, 'No pudimos marcar la alerta. Intenta de nuevo.'));
    }

    onAnalizado?.();
    setBusy(false);
  }

  const visibles = (alertas || []).filter((alerta) => !soloNuevas || alerta.estado === 'nueva');

  return (
    <section className="border-2 border-vino-oscuro bg-vino/45 p-5 shadow-hard">
      <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-crema">
        Antifraude
      </p>
      <h2 className="mt-1 font-display text-3xl font-extrabold uppercase text-crema">Alertas</h2>
      <p className="mt-1 text-xs font-semibold text-texto-suave">
        Se analizan solas cada 5 minutos con la votacion abierta. Son de observacion: no ponen a nadie en cuarentena.
      </p>

      <button
        className="mt-5 w-full border-2 border-vino-oscuro bg-dorado px-4 py-3 font-display text-xl font-extrabold uppercase text-vino-oscuro shadow-hard-sm transition hover:-translate-y-0.5 disabled:opacity-60"
        type="button"
        onClick={handleReanalizar}
        disabled={busy}
      >
        {busy ? 'Analizando...' : 'Re-analizar'}
      </button>
      <p className="mt-2 text-xs font-semibold text-texto-suave">
        {ultimo !== null
          ? `Ultimo analisis: ${lastRunFormatter(evento.zona_horaria).format(new Date(ultimo))} (hora del evento)`
          : 'Aun no se ha analizado este evento.'}
      </p>
      <label className="mt-2 flex items-center gap-2 text-xs font-bold uppercase text-crema">
        <input type="checkbox" checked={soloNuevas} onChange={(event) => setSoloNuevas(event.target.checked)} />
        Solo nuevas
      </label>
      {mensaje ? <p className="mt-3 text-sm font-semibold text-crema">{mensaje}</p> : null}
      {error ? (
        <p className="mt-3 border border-dorado bg-vino-oscuro px-3 py-2 text-sm font-semibold text-crema">{error}</p>
      ) : null}

      {alertas ? (
        <div className="mt-5 space-y-5">
          {SENALES.map((def) => (
            <TablaSenal
              key={def.senal}
              titulo={def.titulo}
              ayuda={def.ayuda(umbrales)}
              columnas={def.columnas}
              celdas={def.celdas}
              filas={visibles.filter((alerta) => alerta.senal === def.senal)}
              onMarcar={handleMarcar}
              busy={busy}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
