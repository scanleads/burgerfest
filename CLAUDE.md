# CLAUDE.md — BurgerFest Votación

> Archivo de instrucciones del proyecto. Claude Code lo lee automáticamente al
> abrir esta carpeta. Define el reparto de trabajo, el stack y las reglas.

---

## Qué es este proyecto

Web app de votación gastronómica con captación de leads para el Burger Fest.
Los asistentes escanean un QR, se registran y votan su hamburguesa favorita en
dos categorías de precio ($8 y $10). El objetivo real es capturar leads para el
cliente y servir de piloto para expandir a 3 ciudades (Maracaibo → Barquisimeto
→ Caracas).

Primer evento: Maracaibo, 4-5-6 de septiembre 2026.

---

## Stack técnico (NO cambiar sin aprobación)

- Frontend: React + Vite + Tailwind CSS
- Backend/DB: Supabase (PostgreSQL)
- Hosting: Vercel
- Control de versiones: GitHub
- PWA opcional (no crítico para el MVP)

Todo debe correr en tiers gratuitos.

---

## Reparto con Codex

- Planificar y decidir: Claude. Antes de escribir codigo, plan corto y aprobacion de Samuel.
- Escribir codigo de mas de un archivo: delegar a Codex con /codex:rescue,
  con el plan ya aprobado adentro del pedido.
- Revisar: lo hace el que no escribio. Si el codigo salio de Codex, lo reviso yo (Claude).
  Si lo escribi yo, corre /codex:adversarial-review.
- Nada se da por terminado sin que Samuel lea el cambio.
- Si Codex y Claude no coinciden, gana el que muestre el error reproducido,
  no el que argumente mejor.
- Para tareas simples usar /codex:rescue --model gpt-5.4-mini (ahorra abono).
  Reservar el modelo grande solo para logica compleja.

---

## Reglas de negocio (críticas — no improvisar)

1. Votante vota en AMBAS categorias: 1 voto en $8 + 1 voto en $10.
2. Registro obligatorio ANTES de votar: nombre, apellido, correo.
   Edad es opcional. "Cuantas hamburguesas probaste" (1-2 / 3-4 / 5+) es opcional.
3. Casilla de consentimiento de marketing: opcional, NO bloquea el voto.
4. Antitrampa: 1 voto por categoria por persona. Control por correo unico + device_id.
5. Resultados de votacion: SOLO el admin los ve. El publico NO ve el ranking.
6. Flujo: registro corto primero -> luego las dos votaciones -> confirmacion.

---

## Estructura de la base de datos

4 tablas: hamburguesas, participantes, votos, config.
1 vista: ranking_hamburguesas (para el admin).
El SQL completo esta en el archivo BURGERFEST-SQL-DEFINITIVO.sql.
Los grants explicitos ya estan incluidos (requeridos en proyectos Supabase
creados despues del 30-May-2026).

---

## Identidad visual

- Estetica: festival gastronomico, apetitosa, energica.
- Colores: definir con la marca del Burger Fest (pendiente recibir del cliente).
  Por defecto: tonos calidos (rojo/naranja/amarillo mostaza) sobre fondo oscuro.
- Tabs superiores para separar categoria $8 y $10 (evita scroll largo).
- Cards con foto de la hamburguesa, nombre, restaurante y boton seleccionar.
- Feedback visual claro al seleccionar (borde resaltado) antes de confirmar.
- Mobile-first: la mayoria vota desde el telefono con posible mala senal.

---

## Prioridades de ingenieria

1. Velocidad de carga (gente con mala senal en el festival).
2. Que aguante votacion concurrente (cuando el animador impulsa desde tarima).
3. Cero perdida de votos ni de leads.
4. Panel admin claro para operar en vivo.

---

## Lo que NO se hace

- No usar Google Sheets ni Apps Script (se decidio Supabase).
- No mostrar resultados al publico.
- No pedir datos que el cliente no pidio.
- No bloquear el voto por no aceptar marketing.
- No dar nada por terminado sin que Samuel lo valide.
