import { useState } from 'react';
import ResultadosPage from './ResultadosPage.jsx';

// Puerta latente: si en algun momento se necesita restringir el acceso publico
// a resultados (ej. antes de anunciar al publico), poner esto en true y
// definir la clave real. Con false, la pagina es publica y directa.
const REQUERIR_CLAVE = false;
const CLAVE_RESULTADOS = 'burgerfest2026';

function PuertaClave({ onDesbloquear }) {
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();

    if (clave === CLAVE_RESULTADOS) {
      onDesbloquear();
    } else {
      setError('Clave incorrecta.');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-vino-fondo px-4 text-texto-suave">
      <form
        className="w-full max-w-sm border-2 border-vino-oscuro bg-vino/45 p-6 shadow-hard"
        onSubmit={handleSubmit}
      >
        <h1 className="font-display text-3xl font-extrabold uppercase text-crema">
          Resultados en vivo
        </h1>
        <p className="mt-1 text-sm font-semibold text-texto-suave">
          Ingresa la clave para ver el ranking.
        </p>
        <input
          className="mt-4 w-full border-2 border-vino-oscuro bg-vino-fondo px-3 py-2 font-semibold text-crema outline-none"
          type="password"
          value={clave}
          onChange={(event) => setClave(event.target.value)}
          placeholder="Clave"
        />
        {error ? <p className="mt-2 text-sm font-semibold text-dorado">{error}</p> : null}
        <button
          className="mt-4 w-full border-2 border-vino-oscuro bg-dorado px-4 py-2 font-display text-xl font-extrabold uppercase text-vino-oscuro shadow-hard-sm transition hover:-translate-y-0.5"
          type="submit"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}

export default function ResultadosApp() {
  const [desbloqueado, setDesbloqueado] = useState(!REQUERIR_CLAVE);

  if (!desbloqueado) {
    return <PuertaClave onDesbloquear={() => setDesbloqueado(true)} />;
  }

  return <ResultadosPage />;
}
