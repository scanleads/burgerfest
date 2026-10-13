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
3. El consentimiento de marketing es opcional y NUNCA bloquea el voto.
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
