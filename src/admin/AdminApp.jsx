import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import AdminDashboard from './AdminDashboard.jsx';
import AdminLogin from './AdminLogin.jsx';

export default function AdminApp() {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (sessionError) {
        setError('No pudimos validar la sesion de administrador.');
        setSession(null);
      } else {
        setSession(data.session);
      }

      setStatus('ready');
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setStatus('ready');
      setError('');
    });

    loadSession();

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-vino-fondo px-4 py-8 text-texto-suave">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center">
          <p className="font-display text-3xl font-bold uppercase text-crema">
            Validando acceso...
          </p>
        </div>
      </main>
    );
  }

  if (!session) {
    return <AdminLogin initialError={error} />;
  }

  return <AdminDashboard session={session} />;
}
