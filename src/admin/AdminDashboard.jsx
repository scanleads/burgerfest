import { useState } from 'react';
import { supabase } from '../lib/supabase.js';
import ControlEvento from './ControlEvento.jsx';
import ExportarLeads from './ExportarLeads.jsx';
import GestionBurgers from './GestionBurgers.jsx';
import Metricas from './Metricas.jsx';
import RankingVivo from './RankingVivo.jsx';

// Oculto a pedido del cliente: no debe poder descargar leads crudos desde el panel.
// Los leads los entrega Samuel al final, procesados. Reactivar poniendo esto en true.
const MOSTRAR_EXPORT_LEADS = false;

export default function AdminDashboard({ session }) {
  const [signOutError, setSignOutError] = useState('');
  const email = session?.user?.email || 'admin';

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
            <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-dorado">
              BurgerFest Admin
            </p>
            <h1 className="mt-1 font-display text-5xl font-extrabold uppercase leading-none text-crema md:text-6xl">
              Operacion en vivo
            </h1>
            <p className="mt-2 text-sm font-semibold text-texto-suave">{email}</p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            {signOutError ? <p className="text-sm font-semibold text-dorado">{signOutError}</p> : null}
            <button
              className="border-2 border-vino-oscuro bg-crema px-4 py-2 font-display text-xl font-extrabold uppercase text-vino-oscuro shadow-hard-sm transition hover:-translate-y-0.5"
              type="button"
              onClick={handleSignOut}
            >
              Cerrar sesion
            </button>
          </div>
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.55fr)]">
          <section className="space-y-6">
            <RankingVivo />
            <GestionBurgers />
          </section>
          <aside className="space-y-6">
            <ControlEvento />
            <Metricas />
            {MOSTRAR_EXPORT_LEADS ? <ExportarLeads /> : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
