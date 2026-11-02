# AGENTS.md — BurgerFest Votación (Scanleads)

> Este archivo lo leen automáticamente las herramientas de IA de código (Kimi, Gemini/Antigravity y otras).
> Es el **archivo principal de reglas** del proyecto. `CLAUDE.md` tiene las mismas reglas para Claude; si no coinciden, manda `AGENTS.md` y se avisa a Alberto.
> **El repo es PÚBLICO: aquí no va nada privado** (ni datos de personas, UIDs, hashes, conteos, IPs, correos, nombres de locales ni detalles de fraude).
> Documentación completa (privada, fuera del repo): `00_ENTREGA/HANDOFF-BURGERFEST-KIMI.md` (estado, pendientes, lecciones y prompts)
> y `00_ENTREGA/SISTEMA-IA/DIRECTOR-IA.md` (cómo trabaja y habla la IA). Bitácora: `00_ENTREGA/BITACORA-BURGERFEST.md`.

## Qué es
Web app de votación de hamburguesas con captura de leads para la gira del Burger Fest
(Maracaibo ✅ → Barquisimeto ✅ → **Caracas, 27-29 nov 2026**). El objetivo real del negocio
es CAPTURAR LEADS; la votación es el gancho.

## Responsables
Responsable y quien aprueba: **Alberto** (Scanleads). Comercial: Dennis.
Desde el 12-nov-2026: **Kimi** construye y dirige, **Gemini (Antigravity)** audita de forma independiente y Alberto hace de puente.

## Stack (no cambiar sin aprobación)
React 18 + Vite 5 (multi-page: index.html, admin.html, resultados.html) + Tailwind 3 ·
Supabase (Postgres 17, con pg_cron; org "scanleads" — NO la org "kuadra") · Vercel (deploy
automático al hacer push a main) · GitHub scanleads/burgerfest (PÚBLICO).

## Cómo se trabaja (obligatorio)
1. Método: plan → auditoría → OK de Alberto → construcción → auditoría independiente → OK → ensayo → definitivo → verificación → bitácora
   (detalle en `00_ENTREGA/SISTEMA-IA/DIRECTOR-IA.md` §4).
2. **Quien construye no se audita.** El Auditor (Gemini) recibe solo las rutas de los archivos y el objetivo, nunca lo que explicó el Constructor.
   Si hay SQL, el Auditor lo **ejecuta** en la réplica local (ensayo, definitivo, verificación y rollback), no solo lo lee.
3. Antes de escribir código: plan corto (archivos a tocar y en qué orden) y ESPERAR el OK de Alberto.
4. Cambios de UI: probar en local (`npm run dev`; en local las rutas son /admin.html y /resultados.html). Solo prueba visual: ver "Peligros conocidos".
5. Lo esencial que ya funciona (registro → voto → admin → resultados, análisis y actas) debe seguir funcionando.
6. `npm run build` debe compilar antes de cualquier commit.
7. **Commits SIN líneas "Co-Authored-By" ni ninguna firma de IA** (Vercel Hobby bloquea el deploy), aunque la herramienta lo sugiera.
8. Antes de un push: `git status` y confirmar que no se sube `.env`, credenciales, `00_ENTREGA/` ni `*.sql`.
9. Nada se da por terminado sin que Alberto lo valide.

## Reglas de negocio
1. Vota en AMBAS categorías: 1 voto en $8 + 1 voto en $10.
2. Registro antes de votar: nombre, apellido, correo obligatorios; edad y "cuántas probaste" opcionales.
3. El consentimiento de marketing es obligatorio para votar (cambiará con V2-3 solo si el cliente lo aprueba antes del 9-nov).
4. Antitrampa: correo único por evento + device_id + unique(participante_id, categoria).
5. /resultados es PÚBLICA a propósito (se proyecta en el evento). El público no ve leads.
6. Formulario simple: no añadir fricción. Las medidas antifraude deben ser invisibles para el usuario normal.
7. Registro asistido: en los stands un mismo celular registra a muchas personas. Nunca guardar el participante en el teléfono (localStorage).

## Seguridad (crítico)
- El frontend usa SOLO la anon key. service_role NUNCA en el frontend ni con prefijo VITE_.
- El público escribe solo vía RPC por evento: registrar_participante_v2, registrar_voto_v2 y
  mis_categorias_votadas_v2; lee con evento_actual, menu_evento_v2 y ranking_evento. Las RPC v1 y la vista
  ranking_hamburguesas están revocadas para el público.
- Permisos de admin por funciones de la base (es_dueno, es_staff, puede_ver_resultados), nunca por
  "cualquier authenticated". El admin actúa por RPC que exigen es_staff (sellar el acta final exige es_dueno).
- Consultas que puedan crecer: paginar con .range() (Supabase devuelve como máximo 1000 filas). Los totales se cuentan en el servidor.
- Cambios de base de datos: redactar el SQL (ENSAYO, DEFINITIVO, ROLLBACK, ROLLBACK-DEFINITIVO y VERIFICACION) para que Alberto lo corra él mismo en el SQL Editor.
  El archivo BURGERFEST-SQL-DEFINITIVO.sql está desactualizado; la verdad es la base viva.

## Reglas de base de datos
- Desde el 30-oct-2026 Supabase no concede permisos automáticos de la Data API a las tablas NUEVAS del
  esquema public (las existentes no cambian). No se asume ningún permiso por defecto.
- Toda tabla nueva en public declara sus permisos en el mismo SQL que la crea: REVOKE ALL a public, anon y
  authenticated, y luego GRANT explícito y mínimo a cada rol que lo necesite.
- Si una Edge Function o un proceso usa service_role sobre una tabla nueva, ese GRANT también es explícito.
- Las guardas y la verificación final de cada sprint comprueban los permisos de cada tabla nueva con
  has_table_privilege (lo que debe tener y lo que NO debe tener).
- Todo INSERT lleva `evento_id` explícito, y todo UPDATE o DELETE filtra por `evento_id`.
- Las `actas` son inmutables: nadie las edita ni las borra. Un evento de prueba con actas no se borra: se retira
  (PARTE B de `00_ENTREGA/EVENTO-PRUEBA.sql`).
- SQL Editor de Supabase: se corre siempre con **"Run without RLS"** (nunca "Run and enable RLS"). El editor solo
  muestra el resultado de la última sentencia, así que el éxito se confirma **siempre** con la consulta de verificación aparte.

## Datos de referencia
- El evento (ciudad, nombre, lema, lugar, fecha, mensaje de cierre, logos, zona horaria, filtro de zona) vive
  en la tabla `eventos`. Un solo evento activo; los eventos de prueba (`es_prueba`) se abren con `?e=<slug>`.
  La tabla `config` queda como histórico y la app no la lee.
- Los eventos de prueba se hacen solo con correos `@example.com`. En ellos, la alerta roja de `dominio_raro` es esperada
  (no es un fallo; `example.com` no se agrega a `dominios_comunes` a propósito).
- Categorías internas: '8_dolares' y '10_dolares'.
- Logos de locales: `public/logos`; logos del evento: `public/logos/eventos` (columnas `logo_url` y
  `logo_color_url` de `eventos`). Fotos de hamburguesas: `public/burgers/<slug>.webp`, 480x600 (4:5), WebP q72.
- Paleta (variables en `src/index.css`): fondo #7d1b18, negro #1a1a1a, amarillo #fbc72b, beige #faf6ed.
- Flags: MOSTRAR_EXPORT_LEADS=true (AdminDashboard), REQUERIR_CLAVE=false y TOP_VISIBLE=5 (resultados).
- Columnas de `hamburguesas`: nombre, restaurante, categoria, descripcion, foto_url, orden, activa, evento_id.
- Pie de la productora (IKAIKA): `src/components/PieProductora.jsx`, en todas las pantallas públicas y en
  `AdminDashboard`; en pantallas con botón fijo abajo va antes de ese botón.
- Las filas de `hamburguesas` con `foto_url` null muestran el nombre. Los cambios de contenido se aplican solo a filas activas.

## Estado actual (2-nov-2026)
- Plataforma v2 multi-evento en producción. La votación abre y cierra sola según `ventanas_votacion` y la hora del
  servidor; el admin tiene modo Automático / Forzar cerrado / Forzar abierto (con caducidad) y ventanas.
- Un correo = un participante POR EVENTO.
- **Análisis antifraude automático (V2-05) en producción:** pg_cron corre cada 5 min el job `burgerfest_analisis`
  (con la votación abierta y hasta 2 h después de un cierre). Tablas nuevas `alertas`, `analisis_runs`, `umbrales_alerta`
  y `dominios_comunes`: sin GRANT para nadie, con RLS y solo accesibles por RPC que exigen `es_staff`.
- **Actas automáticas:** al cerrar cada ventana el job genera el acta (con 60 s de margen tras el cierre); el dueño
  sella el acta final con un botón. Las actas son inmutables.
- En el admin: badge con rojas/amarillas nuevas y "último análisis hace X" (rojo si el análisis se atrasa), panel de
  alertas con Re-analizar, y panel de actas.
- Maracaibo (piloto) y Barquisimeto terminaron. El próximo es **Caracas (27-29 nov 2026)**.
- **Alcance para Caracas CONGELADO:** no se construyen sprints nuevos. Solo se prepara el evento (contenido, SQL de
  creación y activación, runbook y ensayo general). Única excepción posible: V2-3 (edad obligatoria y marketing solo 18+),
  si el cliente responde antes del 9-nov. Congelamiento del código: 20-nov.
- Pendientes, calendario y lo que quedó a medias: `00_ENTREGA/HANDOFF-BURGERFEST-KIMI.md`.

## Comandos útiles
- Desarrollo: `npm run dev` · Build: `npm run build` · Preview del build: `npm run preview`. No hay tests automáticos.
- Antes de commit: `git diff --ignore-cr-at-eol --stat` y `git status`.

## Peligros conocidos
1. **El `.env` apunta a PRODUCCIÓN.** En local no registrarse ni votar: cada prueba ensucia los datos reales.
   Las pruebas de voto se hacen en producción sobre un evento de prueba (`00_ENTREGA/EVENTO-PRUEBA.sql`) con correos `@example.com`.
2. **service_role nunca en el front** ni en variables `VITE_`. El front solo conoce la anon key.
3. **Todo INSERT con `evento_id`.** Sin él falla por NOT NULL; y un UPDATE/DELETE sin filtro por `evento_id` puede tocar otros eventos.
4. **`.range()` en consultas que crecen:** Supabase corta en 1000 filas sin avisar. Nunca contar con `data.length`.
5. **Actas inmutables:** no se editan ni se borran. Sellar el acta final es irreversible y solo lo decide Alberto.
6. **GRANT explícito en toda tabla nueva** de public (REVOKE ALL + GRANT mínimo), comprobado con has_table_privilege.
7. **CRLF → LF:** Windows guarda con CRLF y Git ve el archivo entero cambiado. Revisar `git diff --ignore-cr-at-eol --stat` y normalizar a LF.
8. **Sin firma de IA en los commits** (ni "Co-Authored-By" ni "Generated with"): Vercel Hobby bloquea el deploy.
9. **No abrir datos personales con una IA:** no leer ni copiar `.env`, `CREDENCIALES-SUPABASE.md`, ningún `*.csv`
   ni exports de leads. Las consultas con datos reales las corre Alberto, y a la IA solo le pasa resultados agregados.
10. **Repo público:** nada de `00_ENTREGA/`, `*.sql`, `.env` ni credenciales en Git. Este archivo y `CLAUDE.md` no llevan
    UIDs, hashes, conteos, IPs, correos, nombres de locales ni detalles de fraude.
11. **Cerrar a la hora exacta:** la votación la abren y cierran las ventanas del servidor. No depender del reloj del teléfono
    ni de que alguien se acuerde de cerrar.
