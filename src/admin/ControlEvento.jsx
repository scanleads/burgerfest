import { useState } from 'react';
import { aMs, ahoraServidor, useAhoraServidor } from '../lib/evento.js';
import { supabase } from '../lib/supabase.js';

// Duraciones permitidas para "Forzar abierto" (el servidor exige hasta futuro y maximo 6 horas)
const DURACIONES = [
  { minutos: 30, label: '30 minutos' },
  { minutos: 60, label: '1 hora' },
  { minutos: 120, label: '2 horas' },
  { minutos: 180, label: '3 horas' },
  { minutos: 240, label: '4 horas' },
  { minutos: 360, label: '6 horas' },
];

const ERRORES = {
  no_autorizado: 'No tienes permiso para hacer este cambio.',
  evento_no_encontrado: 'El evento ya no existe. Refresca la pagina.',
  modo_invalido: 'Modo no valido.',
  hasta_invalido: 'La hora limite debe ser futura y de maximo 6 horas.',
  ventana_invalida: 'La ventana no es valida: revisa que abra antes de cerrar y que las dos fechas esten completas.',
  ventana_pasada: 'La ventana debe abrir en el futuro. Para abrir ya, usa "Forzar abierto".',
  ventana_iniciada: 'Esa ventana ya empezo: no se puede modificar ni borrar. Usa "Forzar cerrado" si hay que parar la votacion.',
  ventana_solapada: 'La ventana se solapa con otra del mismo evento.',
  ventana_no_encontrada: 'La ventana ya no existe. Refresca la pagina.',
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

function formatoFalta(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const dias = Math.floor(total / 86400);
  const horas = Math.floor((total % 86400) / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = total % 60;

  if (dias > 0) return `${dias} d ${horas} h`;
  if (horas > 0) return `${horas} h ${minutos} min`;
  return `${minutos} min ${segundos} s`;
}

// Desfase (ms) de una zona respecto a UTC en un instante dado: hora local de la zona - hora UTC
function desfaseZona(zona, ms) {
  const partes = {};
  for (const p of new Intl.DateTimeFormat('en-US', {
    timeZone: zona,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(ms))) {
    partes[p.type] = p.value;
  }
  const comoUtc = Date.UTC(
    Number(partes.year),
    Number(partes.month) - 1,
    Number(partes.day),
    Number(partes.hour),
    Number(partes.minute),
    Number(partes.second),
  );
  return comoUtc - Math.floor(ms / 1000) * 1000;
}

// "2026-11-14T18:00" escrito como hora de la zona del evento -> instante UTC (ISO). null si no es valido.
function horaDeZonaAUtc(valor, zona) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(valor || '');
  if (!m) return null;
  const comoUtc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  let ms = comoUtc - desfaseZona(zona, comoUtc);
  ms = comoUtc - desfaseZona(zona, ms);
  return new Date(ms).toISOString();
}

function textoEstado(evento, ahora) {
  const zona = evento.zona_horaria;
  const hasta = aMs(evento.modo_hasta);
  const modoVigente = hasta === null || hasta > ahora;

  if (evento.modo_votacion === 'forzar_cerrado' && modoVigente) {
    return { abierto: false, texto: 'FORZADA CERRADA', detalle: hasta !== null ? `hasta ${formatoHora(hasta, zona)}` : 'hasta que la pongas en Automatico' };
  }
  if (evento.modo_votacion === 'forzar_abierto' && hasta !== null && hasta > ahora) {
    return { abierto: true, texto: `FORZADA ABIERTA hasta ${formatoHora(hasta, zona)}`, detalle: 'despues vuelve sola a Automatico' };
  }

  const abre = aMs(evento.abre_en);
  const cierra = aMs(evento.cierra_en);

  if (evento.abierto) {
    return { abierto: true, texto: `ABIERTA · cierra ${formatoHora(cierra, zona)}`, detalle: cierra !== null ? `faltan ${formatoFalta(cierra - ahora)}` : '' };
  }
  if (evento.fase === 'antes' && abre !== null) {
    return { abierto: false, texto: `CERRADA · abre en ${formatoFalta(abre - ahora)}`, detalle: formatoHora(abre, zona) };
  }
  if (evento.fase === 'despues') {
    return { abierto: false, texto: 'CERRADA · ventanas terminadas', detalle: '' };
  }
  return { abierto: false, texto: 'CERRADA · sin ventanas', detalle: 'Agrega una ventana o usa "Forzar abierto"' };
}

// evento: un elemento de eventos_admin(). onCambio: vuelve a pedir la lista de eventos.
export default function ControlEvento({ evento, onCambio }) {
  const ahora = useAhoraServidor(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [duracion, setDuracion] = useState(120);
  const [ventana, setVentana] = useState({ etiqueta: '', abre: '', cierra: '' });

  const estado = textoEstado(evento, ahora);
  const zona = evento.zona_horaria;
  const hastaForzado = formatoHora(ahoraServidor() + duracion * 60000, zona);

  async function ejecutar(accion, textoOk) {
    setSaving(true);
    setError('');
    setMensaje('');

    const { error: rpcError } = await accion();

    if (rpcError) {
      setError(mensajeError(rpcError));
    } else {
      setMensaje(textoOk);
    }

    await onCambio();
    setSaving(false);
    return !rpcError;
  }

  function fijarModo(modo, hasta, textoOk) {
    return ejecutar(
      () => supabase.rpc('fijar_modo_votacion', { p_evento: evento.id, p_modo: modo, p_hasta: hasta }),
      textoOk,
    );
  }

  function handleAutomatico() {
    fijarModo('auto', null, 'Modo automatico: la votacion sigue las ventanas.');
  }

  function handleForzarCerrado() {
    if (!window.confirm('Vas a cerrar la votacion YA. Nadie podra votar hasta que la pongas en Automatico o la abras.')) {
      return;
    }
    fijarModo('forzar_cerrado', null, 'Votacion forzada a CERRADA.');
  }

  function handleForzarAbierto() {
    const hasta = new Date(ahoraServidor() + duracion * 60000).toISOString();
    if (!window.confirm(`Vas a abrir la votacion YA, hasta las ${hastaForzado} (hora del evento). Despues vuelve sola a Automatico.`)) {
      return;
    }
    fijarModo('forzar_abierto', hasta, `Votacion forzada a ABIERTA hasta ${hastaForzado}.`);
  }

  async function handleAgregarVentana(event) {
    event.preventDefault();
    const abre = horaDeZonaAUtc(ventana.abre, zona);
    const cierra = horaDeZonaAUtc(ventana.cierra, zona);

    if (!abre || !cierra) {
      setError(ERRORES.ventana_invalida);
      return;
    }

    const ok = await ejecutar(
      () =>
        supabase.rpc('guardar_ventana', {
          p_evento: evento.id,
          p_abre: abre,
          p_cierra: cierra,
          p_etiqueta: ventana.etiqueta.trim() || null,
          p_id: null,
        }),
      'Ventana agregada.',
    );

    if (ok) {
      setVentana({ etiqueta: '', abre: '', cierra: '' });
    }
  }

  function handleBorrarVentana(item) {
    if (!window.confirm(`Borrar la ventana ${item.etiqueta || ''} (${formatoHora(aMs(item.abre), zona)} - ${formatoHora(aMs(item.cierra), zona)})?`)) {
      return;
    }
    ejecutar(() => supabase.rpc('borrar_ventana', { p_id: item.id }), 'Ventana borrada.');
  }

  const botonBase =
    'border-2 border-vino-oscuro px-3 py-3 font-display text-lg font-extrabold uppercase text-vino-oscuro shadow-hard-sm disabled:opacity-50';
  const campo = 'mt-1 w-full border-2 border-vino-oscuro bg-vino-fondo px-2 py-2 text-sm font-semibold text-crema outline-none';

  return (
    <section className="border-2 border-vino-oscuro bg-vino/45 p-5 shadow-hard">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-crema">
            Control del evento
          </p>
          <h2 className="mt-1 font-display text-3xl font-extrabold uppercase text-crema">Estado</h2>
          <p className="mt-1 text-xs font-semibold text-texto-suave">
            {evento.nombre}
            {evento.es_prueba ? ' · PRUEBA' : ''} · hora de {zona}
          </p>
        </div>
        <button
          className="border border-vino-oscuro bg-vino-oscuro px-3 py-1 text-xs font-bold uppercase text-crema"
          type="button"
          onClick={() => onCambio()}
          disabled={saving}
        >
          Refrescar
        </button>
      </div>

      <div
        className={`mt-5 border-2 px-4 py-5 text-center ${
          estado.abierto ? 'border-dorado bg-dorado text-vino-oscuro' : 'border-vino-oscuro bg-vino-oscuro text-crema'
        }`}
      >
        <p className="font-display text-3xl font-extrabold uppercase leading-tight">{estado.texto}</p>
        {estado.detalle ? <p className="mt-1 text-sm font-semibold">{estado.detalle}</p> : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          className={`${botonBase} col-span-2 bg-crema ${evento.modo_votacion === 'auto' ? 'ring-4 ring-dorado' : ''}`}
          type="button"
          onClick={handleAutomatico}
          disabled={saving}
        >
          Automatico (ventanas)
        </button>
        <button className={`${botonBase} bg-crema`} type="button" onClick={handleForzarCerrado} disabled={saving}>
          Forzar cerrado
        </button>
        <button className={`${botonBase} bg-dorado`} type="button" onClick={handleForzarAbierto} disabled={saving}>
          Forzar abierto
        </button>
      </div>
      <label className="mt-3 block text-xs font-bold uppercase text-crema">
        Forzar abierto durante
        <select className={campo} value={duracion} onChange={(event) => setDuracion(Number(event.target.value))} disabled={saving}>
          {DURACIONES.map((d) => (
            <option key={d.minutos} value={d.minutos}>
              {d.label}
            </option>
          ))}
        </select>
        <span className="mt-1 block normal-case text-texto-suave">Hora limite: {hastaForzado}</span>
      </label>

      <div className="mt-6">
        <p className="text-xs font-bold uppercase text-crema">Ventanas de votacion</p>
        {evento.ventanas.length === 0 ? (
          <p className="mt-2 border border-vino-oscuro bg-vino-oscuro px-3 py-2 text-sm font-semibold text-texto-suave">
            Sin ventanas.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {evento.ventanas.map((item) => (
              <li
                className="flex items-center justify-between gap-2 border border-vino-oscuro bg-vino-oscuro px-3 py-2 text-sm text-crema"
                key={item.id}
              >
                <span>
                  <span className="font-bold">{item.etiqueta || 'Ventana'}</span>
                  <br />
                  {formatoHora(aMs(item.abre), zona)} → {formatoHora(aMs(item.cierra), zona)}
                  {item.iniciada ? <span className="ml-2 text-xs font-bold uppercase text-dorado">iniciada</span> : null}
                </span>
                {item.iniciada ? null : (
                  <button
                    className="border border-dorado px-2 py-1 text-xs font-bold uppercase text-dorado disabled:opacity-50"
                    type="button"
                    onClick={() => handleBorrarVentana(item)}
                    disabled={saving}
                  >
                    Borrar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <form className="mt-3 space-y-2" onSubmit={handleAgregarVentana}>
          <label className="block text-xs font-bold uppercase text-crema">
            Nombre (opcional)
            <input
              className={campo}
              value={ventana.etiqueta}
              onChange={(event) => setVentana((actual) => ({ ...actual, etiqueta: event.target.value }))}
              placeholder="Dia 1"
              disabled={saving}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-bold uppercase text-crema">
              Abre
              <input
                className={campo}
                type="datetime-local"
                value={ventana.abre}
                onChange={(event) => setVentana((actual) => ({ ...actual, abre: event.target.value }))}
                disabled={saving}
                required
              />
            </label>
            <label className="block text-xs font-bold uppercase text-crema">
              Cierra
              <input
                className={campo}
                type="datetime-local"
                value={ventana.cierra}
                onChange={(event) => setVentana((actual) => ({ ...actual, cierra: event.target.value }))}
                disabled={saving}
                required
              />
            </label>
          </div>
          <p className="text-xs font-semibold text-texto-suave">Las horas se escriben en hora de {zona}.</p>
          <button
            className="w-full border-2 border-vino-oscuro bg-dorado px-3 py-2 font-display text-lg font-extrabold uppercase text-vino-oscuro shadow-hard-sm disabled:opacity-50"
            type="submit"
            disabled={saving}
          >
            Agregar ventana
          </button>
        </form>
      </div>

      {saving ? <p className="mt-3 text-sm font-semibold text-crema">Guardando cambio...</p> : null}
      {mensaje ? <p className="mt-3 text-sm font-semibold text-crema">{mensaje}</p> : null}
      {error ? <p className="mt-3 border border-dorado bg-vino-oscuro px-3 py-2 text-sm font-semibold text-crema">{error}</p> : null}
    </section>
  );
}
