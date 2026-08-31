export default function PantallaCerrada({ config }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-full max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-dorado">
          {config?.ciudad_activa || 'Maracaibo'}
        </p>
        <h1 className="mt-4 font-display text-5xl font-extrabold uppercase leading-none text-white">
          {config?.titulo_evento || 'Burger Fest'}
        </h1>
        <div className="mx-auto mt-6 h-1 w-24 bg-gradient-to-r from-vino to-dorado" />
        <p className="mt-7 border-2 border-vino bg-vino-oscuro px-5 py-5 text-base leading-7 text-texto-suave shadow-hard">
          {config?.mensaje_cierre || 'La votacion no esta abierta en este momento.'}
        </p>
      </section>
    </main>
  );
}
