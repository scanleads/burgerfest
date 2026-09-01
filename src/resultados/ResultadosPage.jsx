import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import logoBurgerFest from '../assets/logo-burgerfest.png';
import logoIkaika from '../assets/logo-ikaika.png';

const CATEGORIES = [
  {
    id: '8_dolares',
    label: 'Mejor hamburguesa de $8',
    precio: '$8',
    accentBorder: 'border-t-dorado',
    accentBg: 'bg-dorado',
    accentText: 'text-vino-oscuro',
    barColor: 'bg-dorado',
    numberBg: 'bg-dorado',
    numberText: 'text-vino-oscuro',
  },
  {
    id: '10_dolares',
    label: 'Mejor hamburguesa de $10',
    precio: '$10',
    accentBorder: 'border-t-vino',
    accentBg: 'bg-vino',
    accentText: 'text-crema',
    barColor: 'bg-vino',
    numberBg: 'bg-vino',
    numberText: 'text-crema',
  },
];

const TOP_VISIBLE = 5;
const REFRESH_MS = 12000;

function Foto({ url, alt }) {
  if (!url) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center border-2 border-vino-oscuro bg-vino-fondo font-display text-xl font-extrabold text-dorado sm:h-16 sm:w-16">
        🍔
      </div>
    );
  }

  return (
    <img
      className="h-14 w-14 shrink-0 border-2 border-vino-oscuro object-cover sm:h-16 sm:w-16"
      src={url}
      alt={alt}
      loading="lazy"
    />
  );
}

function FilaRanking({ row, posicion, maxVotes, categoria }) {
  const votes = Number(row.total_votos || 0);
  const width = maxVotes > 0 ? Math.max((votes / maxVotes) * 100, votes > 0 ? 6 : 0) : 0;
  const esOro = posicion === 1;
  const esPlataBronce = posicion === 2 || posicion === 3;
  const esPodio = esOro || esPlataBronce;

  const cardSizeClass = esPodio
    ? 'gap-4 border-4 p-4 sm:gap-5 sm:p-6'
    : 'gap-3 border-2 p-3 sm:gap-4 sm:p-4';
  const cardColorClass = esOro
    ? 'border-vino-oscuro bg-dorado text-vino-oscuro shadow-hard-dorado'
    : esPlataBronce
      ? 'border-vino-oscuro bg-crema text-vino-oscuro shadow-hard'
      : 'border-vino-oscuro bg-vino/30 text-crema';
  const subTextClass = esPodio ? 'text-vino-oscuro/70' : 'text-texto-suave';
  const votesClass = esPodio ? 'text-vino-oscuro' : 'text-dorado';
  const barClass = esPodio ? 'bg-vino-oscuro' : categoria.barColor;
  const numberBadgeClass = esPodio
    ? 'bg-vino-oscuro text-dorado'
    : `${categoria.numberBg} ${categoria.numberText}`;
  const numberSizeClass = esPodio
    ? 'h-14 w-14 text-3xl sm:h-20 sm:w-20 sm:text-5xl'
    : 'h-10 w-10 text-2xl sm:h-12 sm:w-12 sm:text-3xl';
  const nombreSizeClass = esPodio ? 'text-2xl sm:text-4xl' : 'text-lg sm:text-2xl';

  return (
    <article className={`flex items-center ${cardSizeClass} ${cardColorClass}`}>
      <div
        className={`flex shrink-0 items-center justify-center border-2 border-vino-oscuro font-display font-extrabold ${numberSizeClass} ${numberBadgeClass}`}
      >
        {esOro ? '👑' : posicion}
      </div>

      <Foto url={row.foto_url} alt={row.nombre} />

      <div className="min-w-0 flex-1">
        <p className={`truncate font-display font-extrabold uppercase ${nombreSizeClass}`}>
          {row.nombre}
        </p>
        <p className={`truncate text-xs font-semibold sm:text-sm ${subTextClass}`}>
          {row.restaurante}
        </p>
        <div className="mt-2 h-3 overflow-hidden border border-vino-oscuro bg-vino-fondo sm:h-4">
          <div
            className={`h-full transition-all duration-700 ${barClass}`}
            style={{ width: `${width}%` }}
          />
        </div>
      </div>

      <p className={`shrink-0 font-display text-2xl font-extrabold sm:text-4xl ${votesClass}`}>
        {votes}
      </p>
    </article>
  );
}

function ColumnaCategoria({ categoria, filas }) {
  const [verTodas, setVerTodas] = useState(false);
  const ordenadas = [...filas].sort((a, b) => Number(b.total_votos) - Number(a.total_votos));
  const total = ordenadas.reduce((sum, row) => sum + Number(row.total_votos || 0), 0);
  const maxVotes = Math.max(...ordenadas.map((row) => Number(row.total_votos || 0)), 0);
  const top = ordenadas.slice(0, TOP_VISIBLE);
  const resto = ordenadas.slice(TOP_VISIBLE);

  return (
    <section
      className={`border-2 border-t-8 border-vino-oscuro ${categoria.accentBorder} bg-vino/45 p-4 shadow-hard sm:p-6`}
    >
      <div className="flex flex-col gap-3 border-b-2 border-vino-oscuro pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`border-2 border-vino-oscuro px-3 py-1 font-display text-2xl font-extrabold uppercase sm:text-3xl ${categoria.accentBg} ${categoria.accentText}`}
          >
            {categoria.precio}
          </span>
          <h2 className="font-display text-2xl font-extrabold uppercase text-crema sm:text-4xl">
            {categoria.label}
          </h2>
        </div>
        <p className="font-display text-xl font-bold uppercase text-dorado sm:text-2xl">
          {total} votos totales
        </p>
      </div>

      <div className="mt-5 space-y-3 sm:space-y-4">
        {top.length === 0 ? (
          <p className="border border-vino-oscuro bg-vino-oscuro px-4 py-3 text-sm font-semibold text-crema">
            Aun no hay votos en esta categoria.
          </p>
        ) : (
          top.map((row, index) => (
            <FilaRanking
              categoria={categoria}
              key={row.id}
              maxVotes={maxVotes}
              posicion={index + 1}
              row={row}
            />
          ))
        )}
      </div>

      {resto.length > 0 ? (
        <div className="mt-4">
          <button
            className="w-full border-2 border-vino-oscuro bg-vino-fondo px-4 py-3 font-display text-lg font-extrabold uppercase text-crema transition hover:-translate-y-0.5"
            onClick={() => setVerTodas((prev) => !prev)}
            type="button"
          >
            {verTodas ? 'Ocultar el resto de posiciones' : `Ver todas las posiciones (${resto.length} mas)`}
          </button>

          {verTodas ? (
            <div className="mt-3 space-y-3 sm:space-y-4">
              {resto.map((row, index) => (
                <FilaRanking
                  categoria={categoria}
                  key={row.id}
                  maxVotes={maxVotes}
                  posicion={index + TOP_VISIBLE + 1}
                  row={row}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default function ResultadosPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  async function cargarRanking(mostrarLoader) {
    if (mostrarLoader) {
      setLoading(true);
    }
    setError('');

    const { data, error: rankingError } = await supabase
      .from('ranking_hamburguesas')
      .select('id, nombre, restaurante, categoria, foto_url, total_votos')
      .order('categoria', { ascending: true })
      .order('total_votos', { ascending: false });

    if (rankingError) {
      setError('No pudimos cargar los resultados. Reintentando...');
    } else {
      setRows(data || []);
      setLastUpdated(new Date());
    }

    setLoading(false);
  }

  useEffect(() => {
    cargarRanking(true);
    const timer = window.setInterval(() => cargarRanking(false), REFRESH_MS);

    return () => window.clearInterval(timer);
  }, []);

  const filasPorCategoria = useMemo(() => {
    return CATEGORIES.reduce((acc, categoria) => {
      acc[categoria.id] = rows.filter((row) => row.categoria === categoria.id);
      return acc;
    }, {});
  }, [rows]);

  return (
    <main className="min-h-screen bg-vino-fondo px-4 py-8 text-texto-suave sm:px-8 lg:px-12 xl:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="border-b-4 border-dorado pb-6 text-center">
          <img
            src={logoBurgerFest}
            alt="Burger Fest"
            className="mx-auto h-[101px] w-auto max-w-full sm:h-[142px] xl:h-[162px]"
          />
          <h1 className="mt-2 font-display text-5xl font-extrabold uppercase leading-none text-crema sm:text-7xl xl:text-8xl">
            Resultados en vivo
          </h1>
          <p className="mt-3 text-sm font-semibold text-texto-suave sm:text-base">
            {lastUpdated ? `Actualizado ${lastUpdated.toLocaleTimeString('es-VE')}` : 'Cargando...'}
          </p>
        </header>

        {error ? (
          <p className="mt-6 border-2 border-dorado bg-vino-oscuro px-4 py-3 text-center text-sm font-semibold text-crema sm:text-base">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-10 text-center font-display text-2xl font-extrabold uppercase text-crema">
            Cargando resultados...
          </p>
        ) : (
          <div className="mt-8 grid gap-6 xl:grid-cols-2 xl:gap-8">
            {CATEGORIES.map((categoria) => (
              <ColumnaCategoria
                categoria={categoria}
                filas={filasPorCategoria[categoria.id] || []}
                key={categoria.id}
              />
            ))}
          </div>
        )}

        <footer className="mt-10 flex flex-col items-center gap-2 pb-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-texto-suave/70 sm:text-xs">
            Una producción de
          </p>
          <img src={logoIkaika} alt="IKAIKA" className="h-24 w-auto max-w-full opacity-80 sm:h-28 xl:h-32" />
        </footer>
      </div>
    </main>
  );
}
