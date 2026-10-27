import { useCallback, useEffect, useState } from 'react';
import PieProductora from '../components/PieProductora.jsx';
import { registrarHoraServidor } from '../lib/evento.js';
import { supabase } from '../lib/supabase.js';
import Actas from './Actas.jsx';
import AlertasFraude from './AlertasFraude.jsx';
import ControlEvento from './ControlEvento.jsx';
import EstadoAnalisis from './EstadoAnalisis.jsx';
import ExportarLeads from './ExportarLeads.jsx';
import GestionBurgers from './GestionBurgers.jsx';
import Metricas from './Metricas.jsx';
import RankingVivo from './RankingVivo.jsx';

// Ahora lo opera Samuel y su socio (dueños de la data), no el cliente.
const MOSTRAR_EXPORT_LEADS = true;

const REFRESCO_EVENTOS_MS = 30000; // el estado calculado (abierto / cerrado) cambia solo con las ventanas

function etiquetaEvento(evento) {
  return `${evento.nombre}${evento.activo ? ' · ACTIVO' : ''}${evento.es_prueba ? ' · PRUEBA' : ''}`;
}

export default function AdminDashboard({ session }) {
  const [signOutError, setSignOutError] = useState('');
  const [eventos, setEventos] = useState([]);
  const [eventoId, setEventoId] = useState(null);
  const [cargandoEventos, setCargandoEventos] = useState(true);
  const [eventosError, setEventosError] = useState('');
  const [versionAnalisis, setVersionAnalisis] = useState(0);
  const email = session?.user?.email || 'admin';

  // Un re-analisis (boton o plan B del badge) refresca el badge y la lista de alertas
  const handleAnalizado = useCallback(() => setVersionAnalisis((version) => version + 1), []);

  const cargarEventos = useCallback(async () => {
    const { data, error } = await supabase.rpc('eventos_admin');

    if (error || !data?.ok) {
      setEventosError('No pudimos cargar los eventos. Revisa tu sesion de admin e intenta de nuevo.');
      setCargandoEventos(false);
      return;
    }

    registrarHoraServidor(data.ahora_ms);
    const lista = data.eventos || [];
    setEventosError('');
    setEventos(lista);
    // El evento elegido se conserva; la primera vez se usa el activo
    setEventoId((actual) =>
      actual && lista.some((evento) => evento.id === actual)
        ? actual
        : (lista.find((evento) => evento.activo) || lista[0])?.id ?? null,
    );
    setCargandoEventos(false);
  }, []);

  useEffect(() => {
    cargarEventos();
    const timer = window.setInterval(cargarEventos, REFRESCO_EVENTOS_MS);

    return () => window.clearInterval(timer);
  }, [cargarEventos]);

  const evento = eventos.find((item) => item.id === eventoId) || null;

  async function handleSignOut() {
    setSignOutError('');
    const { error } = await supabase.auth.signOut();

    if (error) {
      setSignOutError('No pudimos cerrar sesion. Intenta de nuevo.');
    }
  }

  return (
    <main className="min-h-screen bg-vino-fondo px-4 py-6 text-texto-suave sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b-2 border-vino-oscuro pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-crema">
              BurgerFest Admin
            </p>
            <h1 className="mt-1 font-display text-5xl font-extrabold uppercase leading-none text-crema md:text-6xl">
              Operacion en vivo
            </h1>
            <p className="mt-2 text-sm font-semibold text-texto-suave">{email}</p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            {eventos.length > 0 ? (
              <label className="block text-xs font-bold uppercase text-crema">
                Evento
                <select
                  className="mt-1 block w-full border-2 border-vino-oscuro bg-vino-fondo px-2 py-2 text-sm font-semibold normal-case text-crema outline-none sm:min-w-[16rem]"
                  value={eventoId || ''}
                  onChange={(event) => setEventoId(event.target.value)}
                >
                  {eventos.map((item) => (
                    <option key={item.id} value={item.id}>
                      {etiquetaEvento(item)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {signOutError ? <p className="text-sm font-semibold text-crema">{signOutError}</p> : null}
            <button
              className="border-2 border-vino-oscuro bg-crema px-4 py-2 font-display text-xl font-extrabold uppercase text-vino-oscuro shadow-hard-sm transition hover:-translate-y-0.5"
              type="button"
              onClick={handleSignOut}
            >
              Cerrar sesion
            </button>
          </div>
        </header>

        {cargandoEventos ? (
          <p className="mt-6 font-display text-2xl font-extrabold uppercase text-crema">Cargando eventos...</p>
        ) : null}
        {eventosError ? (
          <p className="mt-6 border border-dorado bg-vino-oscuro px-3 py-2 text-sm font-semibold text-crema">
            {eventosError}
          </p>
        ) : null}

        {evento ? (
          <EstadoAnalisis
            key={`estado-${evento.id}`}
            evento={evento}
            version={versionAnalisis}
            onAnalizado={handleAnalizado}
          />
        ) : null}

        {evento ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.55fr)]">
            <section className="space-y-6">
              <RankingVivo key={`ranking-${evento.id}`} evento={evento} />
              <GestionBurgers key={`burgers-${evento.id}`} evento={evento} />
            </section>
            <aside className="space-y-6">
              <ControlEvento evento={evento} onCambio={cargarEventos} />
              <Metricas key={`metricas-${evento.id}`} evento={evento} />
              <AlertasFraude
                key={`alertas-${evento.id}`}
                evento={evento}
                version={versionAnalisis}
                onAnalizado={handleAnalizado}
              />
              <Actas key={`actas-${evento.id}`} evento={evento} />
              {MOSTRAR_EXPORT_LEADS ? <ExportarLeads key={`leads-${evento.id}`} evento={evento} /> : null}
            </aside>
          </div>
        ) : null}

        <PieProductora className="mt-8 scale-75 opacity-70" />
      </div>
    </main>
  );
}
