# CLAUDE.md — BurgerFest Votación (Scanleads)

> Claude Code lee este archivo automáticamente al abrir la carpeta.
> Documentación completa: `00_ENTREGA/00-DOCUMENTO-MAESTRO-BURGERFEST.md` (léelo si falta contexto).
> Responsable del proyecto desde el 11-oct-2026: **Dennis** (antes Samuel).

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
3. El consentimiento de marketing es obligatorio para votar (desde 14-oct-2026).
4. Antitrampa: correo único + device_id + unique(participante_id, categoria).
5. /resultados es PÚBLICA a propósito (se proyecta en el evento). El público no ve leads.
6. Formulario simple: no añadir fricción. Las medidas antifraude deben ser invisibles para el usuario normal.

## Seguridad (crítico)
- El frontend usa SOLO la anon key. service_role NUNCA en el frontend ni con prefijo VITE_.
- El público escribe solo vía RPC: registrar_participante, mis_categorias_votadas, registrar_voto.
- Permisos de admin atados al UID abd2dc50-0005-4855-9575-a06d4b850778 (usuario burguerfest@gmail.com).
  Nunca dar permisos a "cualquier authenticated".
- Consultas que puedan crecer: paginar con .range() (Supabase devuelve como máximo 1000 filas).
- Cambios de base de datos: redactar el SQL para que el responsable lo corra él mismo en el SQL Editor.
  El archivo BURGERFEST-SQL-DEFINITIVO.sql está desactualizado; la verdad es la base viva.

## Datos de referencia
- Ciudad y título del evento: tabla config (ciudad_activa, titulo_evento, estado, mensaje_cierre).
- Categorías internas: '8_dolares' y '10_dolares'.
- Logos de locales: Supabase Storage, bucket público "logos".
- Paleta: #7a1f2e vino (fondo), #5c1622, #9e2a3c, #f2c065 dorado, #f8e8db crema.
- Flags: MOSTRAR_EXPORT_LEADS=true (AdminDashboard), REQUERIR_CLAVE=false y TOP_VISIBLE=5 (resultados).

## Estado actual (14-oct-2026)
- Evento activo: Burger Fest Barquisimeto 17-18 oct 2026. La votación se abre/cierra con `config.estado`
  (hoy cerrada hasta el evento). Después sigue Caracas en noviembre.
- Base: RPC con validaciones, anon sin INSERT directo, tabla `dominios_bloqueados` (Sprint 2).
- Front: logos de locales en `public/logos` (S4); Vercel Analytics en `index.html` (S5);
  panel de anomalías en el admin, `AlertasFraude.jsx` (S6); sugerencia de correo,
  `src/lib/sugerirCorreo.js` (S7).
- Bienvenida con cuenta regresiva: `PantallaBienvenida.jsx` + `src/lib/faseEvento.js`
  (`config.inicio_evento` / `fin_evento`); "VER MENÚ" disponible con la votación cerrada (S8).
- Fotos por hamburguesa en `public/burgers/<slug>.webp`: 480x600 (4:5), WebP q72, recorte centrado,
  sRGB; menú y votación en 2 columnas (S9, S10). Las filas con `foto_url` null muestran el nombre.
- Paleta vigente (variables en `src/index.css`): fondo #7d1b18, negro #1a1a1a, amarillo #fbc72b,
  beige #faf6ed.
- Pie de la productora (IKAIKA): componente `src/components/PieProductora.jsx`, presente en todas las
  pantallas públicas y en `AdminDashboard`. En pantallas con botón fijo abajo va antes de ese botón.
- Las hamburguesas de Maracaibo están inactivas (`activa=false`); los cambios de contenido se aplican
  solo a filas con `activa = true`.
- Columnas reales de `hamburguesas`: nombre, restaurante, categoria, descripcion, foto_url, orden,
  activa (id y creada_en con default).
- Sprint 11 (contenido de Barquisimeto): fotos de Siria y pie de productora hechos en código; el SQL de
  contenido se redacta en `00_ENTREGA/SPRINT11-CONTENIDO.sql` y lo corre el responsable.
- El `.env` apunta a PRODUCCIÓN: en local no registrarse ni votar.
