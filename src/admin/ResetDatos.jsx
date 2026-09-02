import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

const PALABRA_CONFIRMACION = 'BORRAR';

export default function ResetDatos({ onResetDone }) {
  const [counts, setCounts] = useState({ votos: 0, participantes: 0 });
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [countsError, setCountsError] = useState('');

  const [step, setStep] = useState(0); // 0 = cerrado, 1 = confirmar, 2 = escribir palabra
  const [confirmText, setConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function loadCounts() {
    setLoadingCounts(true);
    setCountsError('');

    const [votosResult, participantesResult] = await Promise.all([
      supabase.from('votos').select('id', { count: 'exact', head: true }),
      supabase.from('participantes').select('id', { count: 'exact', head: true }),
    ]);

    if (votosResult.error || participantesResult.error) {
      setCountsError('No pudimos leer los conteos actuales.');
    } else {
      setCounts({
        votos: votosResult.count || 0,
        participantes: participantesResult.count || 0,
      });
    }

    setLoadingCounts(false);
  }

  useEffect(() => {
    loadCounts();
  }, []);

  function openStep1() {
    setSuccessMessage('');
    setResetError('');
    setConfirmText('');
    setStep(1);
  }

  function goToStep2() {
    setResetError('');
    setConfirmText('');
    setStep(2);
  }

  function closeModal() {
    setStep(0);
    setConfirmText('');
    setResetError('');
    setResetting(false);
  }

  async function handleConfirmedReset() {
    if (confirmText !== PALABRA_CONFIRMACION) {
      return;
    }

    setResetting(true);
    setResetError('');

    const { error: votosError } = await supabase
      .from('votos')
      .delete()
      .not('id', 'is', null);

    if (votosError) {
      setResetError('No pudimos borrar los votos. Revisa los permisos DELETE del admin en Supabase.');
      setResetting(false);
      return;
    }

    const { error: participantesError } = await supabase
      .from('participantes')
      .delete()
      .not('id', 'is', null);

    if (participantesError) {
      setResetError('Los votos se borraron, pero no pudimos borrar los participantes. Revisa los permisos DELETE del admin en Supabase.');
      setResetting(false);
      return;
    }

    setResetting(false);
    setStep(0);
    setConfirmText('');
    setSuccessMessage('Datos reiniciados. 0 votos, 0 participantes.');
    await loadCounts();
    onResetDone?.();
  }

  const canConfirmFinal = confirmText === PALABRA_CONFIRMACION && !resetting;

  return (
    <section className="border-2 border-red-700 bg-red-950/40 p-5 shadow-hard">
      <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-red-400">
        Zona de peligro
      </p>
      <h2 className="mt-1 font-display text-3xl font-extrabold uppercase text-crema">
        Reiniciar votacion
      </h2>
      <p className="mt-2 text-sm font-semibold text-texto-suave">
        Borra TODOS los votos y TODOS los participantes registrados. Las hamburguesas no se tocan.
        Esta accion no se puede deshacer.
      </p>

      {loadingCounts ? (
        <p className="mt-4 font-semibold text-texto-suave">Cargando conteos...</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="border-2 border-red-700 bg-vino-oscuro p-3">
            <p className="text-xs font-bold uppercase text-texto-suave">Votos actuales</p>
            <p className="font-display text-3xl font-extrabold text-red-400">{counts.votos}</p>
          </div>
          <div className="border-2 border-red-700 bg-vino-oscuro p-3">
            <p className="text-xs font-bold uppercase text-texto-suave">Participantes actuales</p>
            <p className="font-display text-3xl font-extrabold text-red-400">{counts.participantes}</p>
          </div>
        </div>
      )}

      {countsError ? (
        <p className="mt-4 border border-red-700 bg-vino-oscuro px-3 py-2 text-sm font-semibold text-crema">{countsError}</p>
      ) : null}
      {successMessage ? (
        <p className="mt-4 border border-dorado bg-vino-oscuro px-3 py-2 text-sm font-semibold text-crema">{successMessage}</p>
      ) : null}

      <button
        className="mt-5 w-full border-2 border-red-700 bg-red-700 px-4 py-3 font-display text-xl font-extrabold uppercase text-crema shadow-hard-sm transition hover:-translate-y-0.5 disabled:opacity-50"
        type="button"
        onClick={openStep1}
        disabled={loadingCounts}
      >
        Reiniciar todos los datos
      </button>

      {step === 1 ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-vino-oscuro/80 p-4">
          <div className="w-full max-w-md border-2 border-red-700 bg-vino p-5 shadow-hard">
            <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-red-400">
              Confirmar reinicio
            </p>
            <h3 className="mt-1 font-display text-3xl font-extrabold uppercase text-crema">
              Estas seguro?
            </h3>
            <p className="mt-3 text-sm font-semibold text-texto-suave">
              Vas a borrar TODOS los datos actuales. Se borraran{' '}
              <span className="font-bold text-crema">{counts.votos} votos</span> y{' '}
              <span className="font-bold text-crema">{counts.participantes} participantes registrados</span>.
              Esta accion NO se puede deshacer.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                className="border border-vino-oscuro bg-crema px-4 py-2 text-xs font-bold uppercase text-vino-oscuro"
                type="button"
                onClick={closeModal}
              >
                Cancelar
              </button>
              <button
                className="border-2 border-red-700 bg-red-700 px-4 py-2 font-display text-lg font-extrabold uppercase text-crema shadow-hard-sm"
                type="button"
                onClick={goToStep2}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-vino-oscuro/80 p-4">
          <div className="w-full max-w-md border-2 border-red-700 bg-vino p-5 shadow-hard">
            <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-red-400">
              Ultimo paso
            </p>
            <h3 className="mt-1 font-display text-3xl font-extrabold uppercase text-crema">
              Escribe {PALABRA_CONFIRMACION}
            </h3>
            <p className="mt-3 text-sm font-semibold text-texto-suave">
              Para confirmar el borrado, escribe la palabra <span className="font-bold text-crema">{PALABRA_CONFIRMACION}</span> exactamente como aparece.
            </p>
            <input
              className="mt-4 w-full border-2 border-red-700 bg-blanco px-3 py-2 text-vino-oscuro outline-none focus:border-dorado"
              type="text"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              autoComplete="off"
              autoFocus
              disabled={resetting}
            />

            {resetError ? (
              <p className="mt-3 border border-red-700 bg-vino-oscuro px-3 py-2 text-sm font-semibold text-crema">{resetError}</p>
            ) : null}

            <div className="mt-5 flex justify-end gap-3">
              <button
                className="border border-vino-oscuro bg-crema px-4 py-2 text-xs font-bold uppercase text-vino-oscuro"
                type="button"
                onClick={closeModal}
                disabled={resetting}
              >
                Cancelar
              </button>
              <button
                className="border-2 border-red-700 bg-red-700 px-4 py-2 font-display text-lg font-extrabold uppercase text-crema shadow-hard-sm disabled:opacity-40"
                type="button"
                onClick={handleConfirmedReset}
                disabled={!canConfirmFinal}
              >
                {resetting ? 'Borrando...' : 'Confirmar borrado'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
