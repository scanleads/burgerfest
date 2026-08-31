const labels = {
  '8_dolares': '$8',
  '10_dolares': '$10',
};

export default function Confirmacion({ votos }) {
  return (
    <main className="min-h-screen px-4 py-8">
      <section className="mx-auto w-full max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-dorado">
          Voto registrado
        </p>
        <h1 className="mt-3 font-display text-5xl font-extrabold uppercase leading-none text-white">
          Gracias por votar
        </h1>
        <p className="mt-4 text-sm leading-6 text-texto-suave">
          Tus dos votos quedaron guardados. Disfruta el BurgerFest.
        </p>

        <div className="mt-7 space-y-3 text-left">
          {['8_dolares', '10_dolares'].map((categoria) => {
            const burger = votos[categoria]?.hamburguesa;

            return (
              <div
                key={categoria}
                className="border-2 border-vino-oscuro bg-vino-oscuro p-4"
              >
                <p className="font-display text-2xl font-extrabold uppercase text-dorado">
                  Categoria {labels[categoria]}
                </p>
                <p className="mt-2 text-lg font-bold text-white">
                  {burger?.nombre || 'Voto registrado'}
                </p>
                {burger?.restaurante && (
                  <p className="mt-1 text-sm text-texto-suave">{burger.restaurante}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
