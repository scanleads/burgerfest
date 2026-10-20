import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase.js';

// Evento activo (o de prueba, con ?e=<slug>) y hora del servidor.
// Toda la pantalla publica sale de la RPC evento_actual; nada se lee de config.

const REFRESCO_MS = 60000; // refresco mientras la pagina este abierta
const RETRASO_MAX_MS = 5000; // retraso aleatorio al llegar a una apertura/cierre (evita miles de pedidos a la vez)
const ESPERA_MAX_MS = 60 * 60 * 1000; // mas lejos que esto lo cubre el refresco de 60 s


// Desfase entre el reloj del servidor y el del dispositivo: servidor - dispositivo
let desfaseMs = 0;

export function ahoraServidor() {
  return Date.now() + desfaseMs;
}

// El admin recibe la hora del servidor en eventos_admin(): se usa para el mismo desfase
export function registrarHoraServidor(ahoraMs) {
  const servidor = Number(ahoraMs);
  if (Number.isFinite(servidor)) {
    desfaseMs = servidor - Date.now();
  }
}

export function aMs(iso) {
  if (!iso) return null;
  const ms = Date.parse(String(iso));
  return Number.isNaN(ms) ? null : ms;
}

// ?e=<slug> (eventos de prueba); sin parametro = evento activo
export function slugDeUrl() {
  try {
    const valor = new URLSearchParams(window.location.search).get('e');
    return valor && valor.trim() ? valor.trim() : null;
  } catch {
    return null;
  }
}

// Devuelve { estado: 'ok' | 'no_disponible' | 'error', evento, motivo }
export async function cargarEvento(slug) {
  const { data, error } = await supabase.rpc('evento_actual', { p_slug: slug });

  if (error || !data) {
    return { estado: 'error', evento: null, motivo: null };
  }

  const servidor = Number(data.ahora_ms);
  if (Number.isFinite(servidor)) {
    desfaseMs = servidor - Date.now();
  }

  if (!data.ok) {
    return { estado: 'no_disponible', evento: null, motivo: data.error || null };
  }

  return { estado: 'ok', evento: data, motivo: null };
}

// Proximo instante (hora del servidor) en que el estado puede cambiar: apertura, cierre o fin de un modo forzado.
function proximoCambioMs(evento) {
  const ahora = ahoraServidor();
  const candidatos = [evento.abierto ? aMs(evento.cierra_en) : aMs(evento.abre_en), aMs(evento.modo_hasta)];
  const futuros = candidatos.filter((ms) => ms !== null && ms > ahora);
  return futuros.length ? Math.min(...futuros) : null;
}

// Estado del evento: 'loading' | 'ok' | 'no_disponible' | 'error'.
// Se refresca cada 60 s y al llegar a la apertura/cierre (con un retraso aleatorio de 0 a 5 s).
export function useEventoActual(slug) {
  const [estado, setEstado] = useState('loading');
  const [evento, setEvento] = useState(null);
  const [motivo, setMotivo] = useState(null);
  const vivo = useRef(true);

  const refrescar = useCallback(async () => {
    const resultado = await cargarEvento(slug);
    if (!vivo.current) return;

    if (resultado.estado === 'error') {
      // Con un evento ya cargado, un fallo de red no lo borra: se conserva el ultimo estado conocido.
      setEstado((previo) => (previo === 'ok' ? 'ok' : 'error'));
      return;
    }

    setEstado(resultado.estado);
    setEvento(resultado.evento);
    setMotivo(resultado.motivo);
  }, [slug]);

  useEffect(() => {
    vivo.current = true;
    refrescar();
    const timer = setInterval(refrescar, REFRESCO_MS);

    return () => {
      vivo.current = false;
      clearInterval(timer);
    };
  }, [refrescar]);

  useEffect(() => {
    if (!evento) return undefined;

    const objetivo = proximoCambioMs(evento);
    if (objetivo === null) return undefined;

    const espera = Math.max(0, objetivo - ahoraServidor());
    if (espera > ESPERA_MAX_MS) return undefined;

    const timer = setTimeout(refrescar, espera + Math.random() * RETRASO_MAX_MS);
    return () => clearTimeout(timer);
  }, [evento, refrescar]);

  return { estado, evento, motivo, refrescar };
}

// Reloj con la hora del servidor, actualizado cada segundo mientras 'activo' sea true.
export function useAhoraServidor(activo) {
  const [ahora, setAhora] = useState(ahoraServidor);

  useEffect(() => {
    setAhora(ahoraServidor());
    if (!activo) return undefined;

    const id = setInterval(() => setAhora(ahoraServidor()), 1000);
    return () => clearInterval(id);
  }, [activo]);

  return ahora;
}
