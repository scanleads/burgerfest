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
    <main className="flex min-h-screen items-center justify-center px-4 text-texto-suave">
      <form
        className="panel w-full max-w-sm p-6"
        onSubmit={handleSubmit}
      >
        <h1 className="font-display text-3xl font-extrabold uppercase text-crema">
          Resultados en vivo
        </h1>
        <p className="mt-1 text-sm font-semibold text-texto-suave">
          Ingresa la clave para ver el ranking.
        </p>
        <input
          className="campo mt-4 font-semibold"
          type="password"
          value={clave}
          onChange={(event) => setClave(event.target.value)}
          placeholder="Clave"
        />
        {error ? <p className="mt-2 text-sm font-semibold text-crema">{error}</p> : null}
        <button
          className="btn btn-oro mt-4 py-3"
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
