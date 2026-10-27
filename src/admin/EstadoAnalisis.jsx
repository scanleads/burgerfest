import { useCallback, useEffect, useRef, useState } from 'react';
import { aMs } from '../lib/evento.js';
import { supabase } from '../lib/supabase.js';

// Badge del analisis automatico (job de pg_cron cada 5 min en el servidor).
// "Ultimo analisis hace X" se muestra SIEMPRE; va en rojo cuando el servidor dice "atrasado"
// (votacion abierta y mas de sistema.minutos_atraso sin analisis). Nada depende del reloj del telefono.

const REFRESCO_MS = 60000;
// Plan B: si el job no corre, este admin abierto (y visible) re-analiza como maximo cada 5 minutos.
const PLAN_B_MS = 5 * 60 * 1000;

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

function textoHace(minutos) {
  if (minutos === null || minutos === undefined) return 'aun no se ha analizado este evento';
  if (minutos < 1) return 'ultimo analisis hace menos de 1 min';
  if (minutos < 60) return `ultimo analisis hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  return `ultimo analisis hace ${horas} h ${minutos % 60} min`;
}

export default function EstadoAnalisis({ evento, version, onAnalizado }) {
  const [estado, setEstado] = useState(null);
  const [error, setError] = useState('');
  // performance.now() (reloj monotono): un cambio de hora del telefono no bloquea el plan B (M7)
  const ultimoPlanB = useRef(null);
  // Momento (reloj monotono) en que llego el ultimo estado bueno, para decir "dato de hace..." sin conexion (M6)
  const recibido = useRef(null);
  const [, setTick] = useState(0);

  const cargar = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc('estado_analisis', { p_evento: evento.id });

    if (rpcError || !data?.ok) {
      setError('Sin conexion con el servidor');
      setTick((n) => n + 1);
      return;
    }

    setError('');
    setEstado(data);
    recibido.current = performance.now();

    const ahora = performance.now();
    if (
      data.atrasado &&
      !document.hidden &&
      (ultimoPlanB.current === null || ahora - ultimoPlanB.current > PLAN_B_MS)
    ) {
      ultimoPlanB.current = ahora;
      const { error: reError } = await supabase.rpc('reanalizar_evento', { p_evento: evento.id });
      if (!reError) {
        onAnalizado?.();
      }
    }
  }, [evento.id, onAnalizado]);

  useEffect(() => {
    cargar();
    // Con la pestana oculta no se consulta (M8)
    const timer = window.setInterval(() => {
      if (!document.hidden) cargar();
    }, REFRESCO_MS);

    return () => window.clearInterval(timer);
  }, [cargar, version]);

  if (error && !estado) {
    return (
      <p className="mt-6 border border-dorado bg-vino-oscuro px-3 py-2 text-sm font-semibold text-crema">
        {error}: no pudimos leer el estado del analisis automatico.
      </p>
    );
  }

  if (!estado) {
    return null;
  }

  const atrasado = Boolean(estado.atrasado);
  const ultimo = aMs(estado.ultimo_analisis);
  const minutosDato = recibido.current === null ? 0 : Math.floor((performance.now() - recibido.current) / 60000);

  return (
    <section
      className={`mt-6 flex flex-col gap-2 border-2 px-4 py-3 shadow-hard-sm md:flex-row md:items-center md:justify-between ${
        atrasado ? 'border-crema bg-red-700 text-crema' : 'border-vino-oscuro bg-vino-oscuro text-crema'
      }`}
    >
      <div className="flex flex-wrap items-center gap-3 font-display text-lg font-extrabold uppercase">
        <span className={estado.nuevas_rojas > 0 ? 'bg-dorado px-2 text-vino-oscuro' : ''}>
          {estado.nuevas_rojas} rojas
        </span>
        <span>{estado.nuevas_amarillas} amarillas</span>
        <span className="text-sm font-bold text-texto-suave">nuevas · {estado.total} alertas en total</span>
      </div>
      <div className="text-sm font-semibold md:text-right">
        <p className={atrasado ? 'font-extrabold uppercase' : ''}>
          {atrasado ? 'ATRASADO: ' : ''}
          {textoHace(estado.minutos_desde)}
          {ultimo !== null ? ` (${formatoHora(ultimo, evento.zona_horaria)}, ${estado.ultimo_origen === 'cron' ? 'automatico' : 'manual'})` : ''}
        </p>
        {error ? (
          <p className="text-xs font-bold uppercase text-dorado">
            {error}: dato de hace {minutosDato < 1 ? 'menos de 1 min' : `${minutosDato} min`}
          </p>
        ) : null}
        {atrasado ? (
          <p className="text-xs">
            La votacion esta abierta y el analisis automatico no corre desde hace mas de {estado.minutos_atraso} min. Este
            admin re-analiza cada 5 min mientras siga abierto; avisa a Direccion.
          </p>
        ) : null}
        {estado.ultimo_error ? <p className="text-xs text-dorado">El ultimo analisis fallo: {estado.ultimo_error}</p> : null}
      </div>
    </section>
  );
}
