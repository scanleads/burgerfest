import { useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function AdminLogin({ initialError = '' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (loginError) {
      setError('No pudimos iniciar sesion. Revisa el email y la contrasena.');
    }

    setBusy(false);
  }

  return (
    <main className="min-h-screen bg-vino-fondo px-4 py-8 text-texto-suave">
      <section className="mx-auto flex min-h-[78vh] max-w-md flex-col justify-center">
        <div className="border-2 border-vino-oscuro bg-vino/45 p-6 shadow-hard">
          <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-dorado">
            Panel de administracion
          </p>
          <h1 className="mt-2 font-display text-5xl font-extrabold uppercase leading-none text-crema">
            BurgerFest
          </h1>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-bold uppercase text-crema">Email</span>
              <input
                className="mt-2 w-full border-2 border-vino-oscuro bg-blanco px-4 py-3 text-vino-oscuro outline-none focus:border-dorado"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold uppercase text-crema">Contrasena</span>
              <input
                className="mt-2 w-full border-2 border-vino-oscuro bg-blanco px-4 py-3 text-vino-oscuro outline-none focus:border-dorado"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            {error ? (
              <p className="border border-dorado bg-vino-oscuro px-4 py-3 text-sm font-semibold text-crema">
                {error}
              </p>
            ) : null}
            <button
              className="w-full border-2 border-vino-oscuro bg-dorado px-5 py-3 font-display text-2xl font-extrabold uppercase text-vino-oscuro shadow-hard-sm transition hover:-translate-y-0.5 disabled:opacity-60"
              type="submit"
              disabled={busy}
            >
              {busy ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
