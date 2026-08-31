-- ═══════════════════════════════════════════════════════════════
--  BURGER FEST — Base de datos Supabase
--  Maracaibo · 4, 5, 6 Septiembre 2026
--  Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════

-- ── TABLA 1: hamburguesas (los competidores) ──────────────────
create table hamburguesas (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null,
  restaurante  text not null,
  categoria    text not null check (categoria in ('8_dolares','10_dolares')),
  foto_url     text,
  orden        int default 0,           -- para ordenar en la UI
  activa       boolean default true,
  creada_en    timestamptz default now()
);

-- ── TABLA 2: participantes (LOS LEADS — el activo) ────────────
create table participantes (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  apellido      text not null,
  correo        text not null,
  edad          int,                     -- opcional
  hamburguesas_probadas text,            -- '1-2' / '3-4' / '5+' (opcional)
  acepta_marketing boolean default false,-- casilla consentimiento (opcional)
  ciudad        text default 'Maracaibo',
  device_id     text,                    -- huella del dispositivo (antitrampa)
  registrado_en timestamptz default now(),
  unique(correo)                         -- 1 registro por correo
);

-- ── TABLA 3: votos ────────────────────────────────────────────
create table votos (
  id              uuid primary key default gen_random_uuid(),
  participante_id uuid references participantes(id) on delete cascade,
  hamburguesa_id  uuid references hamburguesas(id),
  categoria       text not null check (categoria in ('8_dolares','10_dolares')),
  ciudad          text default 'Maracaibo',
  votado_en       timestamptz default now(),
  unique(participante_id, categoria)     -- 1 voto por categoría por persona
);

-- ── TABLA 4: config (estado del evento) ───────────────────────
create table config (
  clave  text primary key,
  valor  text
);
insert into config (clave, valor) values
  ('estado', 'cerrado'),                 -- 'cerrado' / 'abierto'
  ('ciudad_activa', 'Maracaibo'),
  ('titulo_evento', 'Burger Fest Maracaibo 2026'),
  ('mensaje_cierre', 'Gracias por participar y votar');

-- ═══════════════════════════════════════════════════════════════
--  GRANTS OBLIGATORIOS
--  (Requerido en proyectos creados después del 30-May-2026)
--  Sin esto, la API REST no funciona.
-- ═══════════════════════════════════════════════════════════════
grant usage on schema public to anon, authenticated;
grant select on hamburguesas to anon, authenticated;
grant select on config to anon, authenticated;
grant insert, select on participantes to anon, authenticated;
grant insert, select on votos to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════
alter table participantes enable row level security;
alter table votos          enable row level security;
alter table hamburguesas   enable row level security;
alter table config         enable row level security;

-- El público puede registrarse (insert) pero no leer toda la lista de leads
create policy "registro publico"
  on participantes for insert
  to anon with check (true);

-- Necesario para el flujo: buscar si un correo ya existe (para retomar sesión)
create policy "buscar mi registro"
  on participantes for select
  to anon using (true);

-- El público puede votar (insert)
create policy "voto publico"
  on votos for insert
  to anon with check (true);

-- El público puede ver sus propios votos (para saber si ya votó)
create policy "ver votos"
  on votos for select
  to anon using (true);

-- El público ve las hamburguesas activas (para mostrarlas)
create policy "ver hamburguesas"
  on hamburguesas for select
  to anon using (activa = true);

-- El público lee la config (estado del evento)
create policy "ver config"
  on config for select
  to anon using (true);

-- ═══════════════════════════════════════════════════════════════
--  ÍNDICES (rendimiento con votación masiva)
-- ═══════════════════════════════════════════════════════════════
create index idx_votos_categoria    on votos(categoria);
create index idx_votos_hamburguesa  on votos(hamburguesa_id);
create index idx_votos_ciudad       on votos(ciudad);
create index idx_part_correo        on participantes(correo);
create index idx_part_device        on participantes(device_id);
create index idx_hamb_categoria     on hamburguesas(categoria, activa);

-- ═══════════════════════════════════════════════════════════════
--  VISTA: ranking en vivo (para el panel admin)
-- ═══════════════════════════════════════════════════════════════
create or replace view ranking_hamburguesas as
select
  h.id,
  h.nombre,
  h.restaurante,
  h.categoria,
  h.foto_url,
  count(v.id) as total_votos
from hamburguesas h
left join votos v on v.hamburguesa_id = h.id
where h.activa = true
group by h.id, h.nombre, h.restaurante, h.categoria, h.foto_url
order by h.categoria, total_votos desc;

grant select on ranking_hamburguesas to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════
--  DATOS DE PRUEBA (borrar antes del evento real)
-- ═══════════════════════════════════════════════════════════════
insert into hamburguesas (nombre, restaurante, categoria, orden) values
  ('La Clásica',      'Burger House',   '8_dolares', 1),
  ('La Ahumada',      'Grill Master',   '8_dolares', 2),
  ('La Doble Queso',  'Cheese Lovers',  '8_dolares', 3),
  ('La Gourmet',      'Prime Burger',   '10_dolares', 1),
  ('La Trufa',        'Chef Station',   '10_dolares', 2),
  ('La BBQ Premium',  'Smoke & Fire',   '10_dolares', 3);

-- ✓ Base de datos lista.
