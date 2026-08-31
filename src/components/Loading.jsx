export default function Loading({ message = 'Cargando votacion...' }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 text-center">
      <div className="space-y-5">
        <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-crema/20 border-t-dorado" />
        <div>
          <p className="font-display text-3xl font-bold uppercase tracking-normal text-dorado">
            BurgerFest
          </p>
          <p className="mt-2 text-sm text-texto-suave">{message}</p>
        </div>
      </div>
    </main>
  );
}
