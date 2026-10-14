import PieProductora from './PieProductora.jsx';
import Ticket, { Renglon, Separador } from './Ticket.jsx';

const labels = {
  '8_dolares': '$8',
  '10_dolares': '$10',
};

export default function Confirmacion({ votos }) {
  return (
    <main className="min-h-screen px-4 py-8">
      <section className="mx-auto w-full max-w-md">
        <Ticket>
          <p className="text-center font-display text-4xl font-extrabold uppercase leading-none">
            Burger Fest
          </p>
          <p className="mt-2 text-center text-xs font-bold uppercase tracking-[0.2em]">
            Voto registrado
          </p>

          <Separador />

          <div className="space-y-3">
            {['8_dolares', '10_dolares'].map((categoria) => {
              const burger = votos[categoria]?.hamburguesa;

              return (
                <div key={categoria}>
                  <Renglon
                    izq={`1x VOTO ${labels[categoria]}`}
                    der={burger?.nombre || 'Registrado'}
                  />
                  {burger?.restaurante && (
                    <p className="mt-0.5 text-right text-xs uppercase opacity-70">
                      {burger.restaurante}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <Separador />

          <Renglon izq="TOTAL" der="2 VOTOS" className="text-base" />

          <Separador />

          <p className="text-center font-bold uppercase tracking-wide">*** Gracias por decidir ***</p>
        </Ticket>

        <PieProductora />
      </section>
    </main>
  );
}
