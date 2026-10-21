# CLAUDE.md — BurgerFest Votación (Scanleads)

> Claude Code lee este archivo automáticamente al abrir la carpeta.
> Documentación completa: `00_ENTREGA/00-DOCUMENTO-MAESTRO-BURGERFEST.md` (léelo si falta contexto).
> Responsable del proyecto: **Alberto** (Scanleads, desde el 18-oct-2026; antes Samuel y Dennis). Comercial: Dennis.

## Qué es
Web app de votación de hamburguesas con captura de leads para la gira del Burger Fest
(Maracaibo ✅ → Barquisimeto 17-18 oct 2026 → Caracas nov). El objetivo real del negocio
es CAPTURAR LEADS; la votación es el gancho.

## Stack (no cambiar sin aprobación)
React 18 + Vite 5 (multi-page: index.html, admin.html, resultados.html) + Tailwind 3 ·
Supabase (proyecto ref wxxoxwujhvyrzdrvukpy, org "scanleads" — NO la org "kuadra") · Vercel (deploy
automático al hacer push a main) · GitHub scanleads/burgerfest (PÚBLICO).

## Forma de trabajo (obligatoria)
1. Antes de escribir código: plan corto (archivos a tocar y en qué orden) y ESPERAR el OK del responsable.
2. Cambios de UI: probar en local (`npm run dev`; en local las rutas son /admin.html y /resultados.html).
3. Lo esencial que ya funciona (registro → voto → admin → resultados) debe seguir funcionando.
4. `npm run build` debe compilar antes de cualquier commit.
5. **Commits SIN líneas "Co-Authored-By" ni firma de Claude** (Vercel Hobby bloquea el deploy).
6. Antes de un push: `git status` y confirmar que no se sube `.env`, credenciales ni `*.sql`.
7. Nada se da por terminado sin que el responsable lo valide.
8. Codex es opcional: si se usa, siempre en hilo nuevo (nunca "resume"); si se cuelga, Claude lo hace directo.

## Reglas de negocio
1. Vota en AMBAS categorías: 1 voto en $8 + 1 voto en $10.
2. Registro antes de votar: nombre, apellido, correo obligatorios; edad y "cuántas probaste" opcionales.
3. El consentimiento de marketing es obligatorio para votar (cambiará en V2-3 si el cliente lo aprueba).
4. Antitrampa: correo único + device_id + unique(participante_id, categoria).
5. /resultados es PÚBLICA a propósito (se proyecta en el evento). El público no ve leads.
6. Formulario simple: no añadir fricción. Las medidas antifraude deben ser invisibles para el usuario normal.

## Seguridad (crítico)
- El frontend usa SOLO la anon key. service_role NUNCA en el frontend ni con prefijo VITE_.
- El público escribe solo vía RPC por evento: registrar_participante_v2, registrar_voto_v2 y
  mis_categorias_votadas_v2; lee con evento_actual, menu_evento_v2 y ranking_evento. Las RPC v1 y la vista
  ranking_hamburguesas están revocadas para el público.
- Permisos de admin por funciones de la base (es_dueno, es_staff, puede_ver_resultados), nunca por
  "cualquier authenticated". El admin actúa por RPC que exigen es_staff.
- Consultas que puedan crecer: paginar con .range() (Supabase devuelve como máximo 1000 filas).
- Cambios de base de datos: redactar el SQL para que el responsable lo corra él mismo en el SQL Editor.
  El archivo BURGERFEST-SQL-DEFINITIVO.sql está desactualizado; la verdad es la base viva.

## Reglas de base de datos
- Desde el 30-oct-2026 Supabase no concede permisos automáticos de la Data API a las tablas NUEVAS del
  esquema public (las existentes no cambian). No se asume ningún permiso por defecto.
- Toda tabla nueva en public declara sus permisos en el mismo SQL que la crea: REVOKE ALL a public, anon y
  authenticated, y luego GRANT explícito y mínimo a cada rol que lo necesite.
- Si una Edge Function o un proceso usa service_role sobre una tabla nueva, ese GRANT también es explícito.
- Las guardas y la verificación final de cada sprint comprueban los permisos de cada tabla nueva con
  has_table_privilege (lo que debe tener y lo que NO debe tener).

## Datos de referencia
- El evento (ciudad, nombre, lema, lugar, fecha, mensaje de cierre, logos, zona horaria, filtro de zona) vive
  en la tabla `eventos`. Un solo evento activo; los eventos de prueba (`es_prueba`) se abren con `?e=<slug>`.
  La tabla `config` queda como histórico y la app no la lee.
- Categorías internas: '8_dolares' y '10_dolares'.
- Logos de locales: `public/logos`; logos del evento: `public/logos/eventos` (columnas `logo_url` y
  `logo_color_url` de `eventos`). Fotos de hamburguesas: `public/burgers/<slug>.webp`, 480x600 (4:5), WebP q72.
- Paleta (variables en `src/index.css`): fondo #7d1b18, negro #1a1a1a, amarillo #fbc72b, beige #faf6ed.
- Flags: MOSTRAR_EXPORT_LEADS=true (AdminDashboard), REQUERIR_CLAVE=false y TOP_VISIBLE=5 (resultados).
- Columnas de `hamburguesas`: nombre, restaurante, categoria, descripcion, foto_url, orden, activa, evento_id.

## Estado actual (21-oct-2026)
- Plataforma v2 multi-evento. La votación abre y cierra sola según `ventanas_votacion` y la hora del
  servidor; el admin tiene modo Automático / Forzar cerrado / Forzar abierto (con caducidad) y ventanas.
- Todo INSERT lleva `evento_id` explícito. Un correo = un participante POR EVENTO.
- Historia: Maracaibo (piloto) y Barquisimeto (17-18 oct 2026) terminaron; el próximo es Caracas (noviembre 2026).
- Pie de la productora (IKAIKA): `src/components/PieProductora.jsx`, en todas las pantallas públicas y en
  `AdminDashboard`; en pantallas con botón fijo abajo va antes de ese botón.
- Las filas de `hamburguesas` con `foto_url` null muestran el nombre. Los cambios de contenido se aplican
  solo a filas activas.
- El `.env` apunta a PRODUCCIÓN: en local no registrarse ni votar.
- Detalle e historial: en la documentación interna, no en este archivo.
