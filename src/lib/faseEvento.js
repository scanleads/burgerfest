import { useEffect, useState } from 'react';

// Fase del evento segun config.inicio_evento / config.fin_evento (ISO con zona).
// Si faltan o no son validas, la fase es null y la app se comporta como siempre.

function parseFecha(valor) {
  if (!valor) return null;
  const ms = Date.parse(String(valor));
  return Number.isNaN(ms) ? null : ms;
}

// Solo en desarrollo (npm run dev) se pueden simular fechas desde la URL:
//   ?ahora=2026-10-10T12:00:00-04:00  &inicio=...  &fin=...
// En el build de produccion este bloque se elimina.
function parametroDev(nombre) {
  if (!import.meta.env.DEV || typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(nombre);
}

export function fechasEvento(config) {
  const inicio = parseFecha(parametroDev('inicio') ?? config?.inicio_evento);
  const fin = parseFecha(parametroDev('fin') ?? config?.fin_evento);

  if (inicio === null || fin === null || inicio >= fin) {
    return null;
  }

  return { inicio, fin };
}

const desfaseDev = (() => {
  const simulada = parseFecha(parametroDev('ahora'));
  return simulada === null ? 0 : simulada - Date.now();
})();

export function ahoraMs() {
  return Date.now() + desfaseDev;
}

export function faseEvento(fechas, ahora) {
  if (!fechas) return null;
  if (ahora < fechas.inicio) return 'antes';
  if (ahora <= fechas.fin) return 'durante';
  return 'despues';
}

// Reloj que se actualiza cada segundo solo mientras el evento no ha terminado.
export function useAhora(fechas) {
  const [ahora, setAhora] = useState(ahoraMs);
  const activo = Boolean(fechas) && ahora <= fechas.fin;

  useEffect(() => {
    if (!activo) return undefined;
    const id = setInterval(() => setAhora(ahoraMs()), 1000);
    return () => clearInterval(id);
  }, [activo]);

  return ahora;
}
