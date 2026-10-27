import { useCallback, useEffect, useState } from 'react';
import { aMs } from '../lib/evento.js';
import { supabase } from '../lib/supabase.js';

// Actas del evento (tabla actas: inmutable, sin UPDATE ni DELETE para nadie).
// - cierre_ventana: la genera sola el job al cerrar cada ventana (o "Generar acta ahora"). Es PROVISIONAL:
//   el hash de los contados cambia si despues se pone o quita gente de cuarentena.
// - final: la sella SOLO el dueno, con la votacion cerrada y sin ventanas pendientes.
// - importada: la de Barquisimeto (migracion V2-1a).

const PAGE_SIZE = 1000;
const REFRESCO_MS = 60000;

const TIPOS = {
  cierre_ventana: 'Cierre de ventana (provisional)',
  final: 'FINAL (sellada por el dueno)',
  importada: 'Importada',
};

const ERRORES = {
  no_autorizado: 'No tienes permiso para esta accion.',
  evento_no_encontrado: 'El evento ya no existe. Refresca la pagina.',
  ventana_no_encontrada: 'La ventana ya no existe. Refresca la pagina.',
  ventana_no_cerrada: 'La ventana todavia no cerro o cerro hace menos de 1 minuto (margen para los votos en curso).',
  acta_ya_existe: 'Esa ventana ya tiene su acta.',
  evento_no_cerrado:
    'Para sellar el acta final la votacion debe estar cerrada, sin ventanas pendientes y con la ultima cerrada hace al menos 1 minuto.',
  tipo_invalido: 'Tipo de acta no valido.',
  ventana_no_aplica: 'El acta final no lleva ventana.',
};

function mensajeError(error) {
  const texto = String(error?.message || '');
  const codigo = Object.keys(ERRORES).find((clave) => texto.includes(clave));
  return codigo ? ERRORES[codigo] : 'No pudimos completar la accion. Intenta de nuevo.';
}

function formatoHora(ms, zona) {
  if (ms === null) return '-';
  return new Intl.DateTimeFormat('es-VE', {
    timeZone: zona,
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(ms));
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

function Top5({ top5 }) {
  const filas = Array.isArray(top5) ? top5 : [];
  if (filas.length === 0) return null;
  const categorias = [...new Set(filas.map((fila) => fila.categoria))];

  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-xs font-bold uppercase text-crema">Top 5</summary>
      {categorias.map((categoria) => (
        <div key={categoria} className="mt-1">
          <p className="text-xs font-bold text-dorado">{categoria === '8_dolares' ? '$8' : categoria === '10_dolares' ? '$10' : categoria}</p>
          <ol className="text-xs text-crema">
            {filas
              .filter((fila) => fila.categoria === categoria)
              .map((fila) => (
                <li key={`${categoria}-${fila.puesto}`}>
                  {fila.puesto}. {fila.nombre} ({fila.restaurante}) - {fila.votos}
                </li>
              ))}
          </ol>
        </div>
      ))}
    </details>
  );
}

export default function Actas({ evento }) {
  const [actas, setActas] = useState(null);
  const [pendientes, setPendientes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const zona = evento.zona_horaria;

  const cargar = useCallback(async () => {
    const [actasResult, pendResult] = await Promise.all([
      fetchAllRows(() =>
        supabase
          .from('actas')
          .select(
            'id, ventana_id, tipo, generada_en, generada_por, participantes, votantes, votos_totales, votos_validos, votos_cuarentena, detalle, hash_todos, hash_contados, reglas',
          )
          .eq('evento_id', evento.id)
          .order('generada_en', { ascending: false })
          .order('id', { ascending: true }),
      ),
      supabase.rpc('actas_pendientes', { p_evento: evento.id }),
    ]);

    if (actasResult.error || pendResult.error || !pendResult.data?.ok) {
      setError('No pudimos leer las actas. Revisa tu sesion de admin e intenta de nuevo.');
      return;
    }

    setError('');
    setActas(actasResult.data);
    setPendientes(pendResult.data);
  }, [evento.id]);

  useEffect(() => {
    cargar();
    // Con la pestana oculta no se consulta (M8)
    const timer = window.setInterval(() => {
      if (!document.hidden) cargar();
    }, REFRESCO_MS);

    return () => window.clearInterval(timer);
  }, [cargar]);

  async function generar(ventanaId, tipo, textoOk) {
    setBusy(true);
    setError('');
    setMensaje('');

    const { error: rpcError } = await supabase.rpc('generar_acta', { p_evento: evento.id, p_ventana: ventanaId, p_tipo: tipo });

    if (rpcError) {
      setError(mensajeError(rpcError));
    } else {
      setMensaje(textoOk);
    }

    await cargar();
    setBusy(false);
  }

  function handleGenerar(ventana) {
    generar(ventana.id, 'cierre_ventana', `Acta de "${ventana.etiqueta || 'ventana'}" generada.`);
  }

  function handleSellar() {
    const ok = window.confirm(
      'Vas a SELLAR el acta final del evento. Es inmutable: no se puede editar ni borrar. Si despues cambia la cuarentena, habra que sellar otra. ¿Continuar?',
    );
    if (ok) {
      generar(null, 'final', 'Acta final sellada.');
    }
  }

  const ultimaProvisional = (actas || []).find((acta) => acta.tipo === 'cierre_ventana');
  const ultimaFinal = (actas || []).find((acta) => acta.tipo === 'final');
  const difiere =
    ultimaProvisional && ultimaFinal && ultimaProvisional.hash_contados !== ultimaFinal.hash_contados
      ? ultimaFinal.votos_validos - ultimaProvisional.votos_validos
      : null;

  return (
    <section className="border-2 border-vino-oscuro bg-vino/45 p-5 shadow-hard">
      <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-crema">Auditoria</p>
      <h2 className="mt-1 font-display text-3xl font-extrabold uppercase text-crema">Actas</h2>
      <p className="mt-1 text-xs font-semibold text-texto-suave">
        Se genera una sola al cerrar cada ventana. Son inmutables. La final la sella el dueno.
      </p>

      {pendientes?.pendientes?.length ? (
        <ul className="mt-4 space-y-2">
          {pendientes.pendientes.map((ventana) => (
            <li
              key={ventana.id}
              className="flex items-center justify-between gap-2 border border-vino-oscuro bg-vino-oscuro px-3 py-2 text-sm text-crema"
            >
              <span>
                <span className="font-bold">{ventana.etiqueta || 'Ventana'}</span> sin acta · cerro {formatoHora(aMs(ventana.cierra), zona)}
              </span>
              <button
                className="border border-dorado px-2 py-1 text-xs font-bold uppercase text-dorado disabled:opacity-50"
                type="button"
                onClick={() => handleGenerar(ventana)}
                disabled={busy}
              >
                Generar acta ahora
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {pendientes?.es_dueno ? (
        <button
          className="mt-4 w-full border-2 border-vino-oscuro bg-crema px-4 py-3 font-display text-xl font-extrabold uppercase text-vino-oscuro shadow-hard-sm transition hover:-translate-y-0.5 disabled:opacity-50"
          type="button"
          onClick={handleSellar}
          disabled={busy || !pendientes.puede_sellar}
          title={pendientes.puede_sellar ? '' : 'La votacion debe estar cerrada y todas las ventanas cerradas deben tener su acta'}
        >
          Sellar acta final
        </button>
      ) : null}

      {mensaje ? <p className="mt-3 text-sm font-semibold text-crema">{mensaje}</p> : null}
      {error ? (
        <p className="mt-3 border border-dorado bg-vino-oscuro px-3 py-2 text-sm font-semibold text-crema">{error}</p>
      ) : null}
      {difiere !== null ? (
        <p className="mt-3 border border-dorado px-3 py-2 text-xs font-semibold text-crema">
          La final difiere de la ultima provisional en los votos contados ({difiere > 0 ? '+' : ''}
          {difiere}): hubo cambios de cuarentena o votos posteriores al cierre.
        </p>
      ) : null}

      {actas && actas.length === 0 ? (
        <p className="mt-4 border-2 border-vino-oscuro bg-vino-oscuro px-3 py-2 text-sm font-semibold text-texto-suave">
          Aun no hay actas.
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        {(actas || []).map((acta) => (
          <article
            key={acta.id}
            className={`border-2 px-3 py-2 text-xs text-crema ${acta.tipo === 'final' ? 'border-dorado' : 'border-vino-oscuro bg-vino-oscuro'}`}
          >
            <p className="font-bold uppercase">
              {TIPOS[acta.tipo] || acta.tipo}
              {acta.detalle?.ventana?.etiqueta ? ` · ${acta.detalle.ventana.etiqueta}` : ''}
            </p>
            <p className="text-texto-suave">
              {formatoHora(aMs(acta.generada_en), zona)} · {acta.generada_por === 'cron' ? 'automatica' : 'manual'}
            </p>
            <p className="mt-1">
              {acta.participantes} participantes · {acta.votantes} votantes · {acta.votos_totales} votos · {acta.votos_validos}{' '}
              contados · {acta.votos_cuarentena} en cuarentena
            </p>
            <p className="mt-1 break-all font-mono">Todos: {acta.hash_todos || '-'}</p>
            <p className="break-all font-mono">Contados: {acta.hash_contados || '-'}</p>
            <Top5 top5={acta.detalle?.top5} />
          </article>
        ))}
      </div>
    </section>
  );
}
