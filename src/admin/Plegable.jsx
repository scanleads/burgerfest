import { useState } from 'react';

// Estado plegado/desplegado de una seccion del admin, recordado en localStorage por seccion.
// Si localStorage falla (modo privado, bloqueado), se usa el estado inicial.
function leerEstado(nombre, abiertoInicial) {
  try {
    const guardado = window.localStorage.getItem(`admin-seccion-${nombre}`);
    if (guardado === 'abierta') return true;
    if (guardado === 'plegada') return false;
  } catch {
    // sin localStorage: estado inicial
  }
  return abiertoInicial;
}

export function useSeccionPlegable(nombre, abiertoInicial) {
  const [abierta, setAbierta] = useState(() => leerEstado(nombre, abiertoInicial));

  function alternar() {
    const siguiente = !abierta;
    setAbierta(siguiente);

    try {
      window.localStorage.setItem(`admin-seccion-${nombre}`, siguiente ? 'abierta' : 'plegada');
    } catch {
      // sin localStorage: el estado vale solo para esta sesion
    }
  }

  return [abierta, alternar];
}

export function BotonPlegar({ abierta, onClick, controla }) {
  return (
    <button
      className="border border-vino-oscuro bg-vino-oscuro px-3 py-2 text-xs font-bold uppercase text-crema"
      type="button"
      onClick={onClick}
      aria-expanded={abierta}
      aria-controls={controla}
    >
      {abierta ? 'Plegar' : 'Desplegar'}
    </button>
  );
}
