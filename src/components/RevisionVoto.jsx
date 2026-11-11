import PieProductora from './PieProductora.jsx';
import Ticket, { Renglon, Separador } from './Ticket.jsx';

const categoryLabels = {
  '8_dolares': '$8',
  '10_dolares': '$10',
};

function selectedBurgerFor(category, selectedByCategory, votesByCategory, hamburguesas) {
  const existingBurger = votesByCategory[category]?.hamburguesa;

  if (existingBurger) {
    return existingBurger;
  }

  const selectedId = selectedByCategory[category];
  return hamburguesas.find((burger) => burger.id === selectedId);
}

export default function RevisionVoto({
  selectedByCategory,
  votesByCategory,
  hamburguesas,
  onChangeCategory,
  onVotar,
  busy,
  error,
}) {
  return (
    <main className="min-h-screen px-4 py-8">
      <section className="entrada mx-auto w-full max-w-md">
        <p className="text-xs font-semibold text-dorado">
          BurgerFest
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold uppercase leading-[0.95] text-white">
          Revisa tu voto
        </h1>
        <p className="mt-4 text-sm leading-6 text-texto-suave">
          Confirma tus elecciones. Una vez votes, no podras cambiarlas.
        </p>

        {error && (
          <div className="aviso mt-5" role="alert">
            {error}
          </div>
        )}

        <Ticket className="mt-7">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em]">Tu voto</p>

          {['8_dolares', '10_dolares'].map((category) => {
            const burger = selectedBurgerFor(
              category,
              selectedByCategory,
              votesByCategory,
              hamburguesas,
            );
            const alreadyRegistered = Boolean(votesByCategory[category]);

            return (
              <div key={category}>
                <Separador />
                <Renglon
                  izq={`1x VOTO ${categoryLabels[category]}`}
                  der={burger?.nombre || 'Seleccion pendiente'}
                />
                <p className="mt-0.5 text-right text-xs uppercase opacity-70">
                  {burger?.restaurante || 'Vuelve a elegir una opcion'}
                </p>

                <button
                  type="button"
                  disabled={busy || alreadyRegistered}
                  onClick={() => onChangeCategory(category)}
                  className="mt-3 rounded-full border-2 border-[#1a1a1a] bg-transparent px-4 py-1.5 text-sm font-extrabold uppercase text-[#1a1a1a] transition active:bg-[#1a1a1a]/10 disabled:opacity-50"
                >
                  {alreadyRegistered ? 'Registrado' : 'Cambiar'}
                </button>
              </div>
            );
          })}
        </Ticket>

        <button
          type="button"
          disabled={busy}
          onClick={onVotar}
          className="btn btn-oro mt-6 text-2xl"
        >
          {busy ? 'Votando...' : 'Votar'}
        </button>

        <PieProductora />
      </section>
    </main>
  );
}
