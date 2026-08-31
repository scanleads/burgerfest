# PROMPT PARA CODEX — App de Votación BurgerFest
## Vía Claude Code: /codex:rescue o delegación directa

---

Construye una web app de votación gastronómica en React + Vite + Tailwind,
conectada a Supabase. Proyecto: BurgerFest Maracaibo 2026.

Sigue estrictamente las reglas de negocio del CLAUDE.md de esta carpeta.

---

## STACK Y SETUP

- React + Vite + Tailwind CSS
- Cliente: @supabase/supabase-js
- Variables de entorno en .env (crear .env.example sin las llaves reales)
- .gitignore debe incluir: .env, node_modules, dist

### Variables de entorno (.env)
```
VITE_SUPABASE_URL=https://wxxoxwujhvyrzdrvukpy.supabase.co
VITE_SUPABASE_ANON_KEY=(la anon key — ya la tiene Samuel en CREDENCIALES-SUPABASE.md)
```

Crea `src/lib/supabase.js` que inicialice el cliente leyendo esas variables.

---

## ESQUEMA DE LA BASE DE DATOS (ya existe en Supabase)

**Tabla `hamburguesas`:** id, nombre, restaurante, categoria ('8_dolares'|'10_dolares'), foto_url, orden, activa
**Tabla `participantes`:** id, nombre, apellido, correo (unique), edad, hamburguesas_probadas, acepta_marketing, ciudad, device_id, registrado_en
**Tabla `votos`:** id, participante_id, hamburguesa_id, categoria, ciudad, votado_en · unique(participante_id, categoria)
**Tabla `config`:** clave, valor · (estado='cerrado'|'abierto', ciudad_activa, titulo_evento, mensaje_cierre)
**Vista `ranking_hamburguesas`:** id, nombre, restaurante, categoria, foto_url, total_votos

---

## REGLAS DE NEGOCIO (críticas)

1. El votante vota en AMBAS categorías: 1 voto en $8 + 1 voto en $10.
2. Registro obligatorio ANTES de votar: nombre, apellido, correo (obligatorios).
   Edad opcional. "¿Cuántas probaste?" (botones 1-2/3-4/5+) opcional.
   Casilla de consentimiento de marketing: opcional, NO bloquea nada.
3. Antitrampa: 1 voto por categoría por persona (unique en la BD).
   Control por correo único + device_id (huella del navegador).
4. Resultados: el público NO ve el ranking. Solo se registran los votos.
5. Flujo: registro corto → votar categoría $8 → votar categoría $10 → confirmación.
6. Si el estado en config es 'cerrado', mostrar pantalla de cierre (no dejar votar).

---

## FLUJO DE PANTALLAS

### 1. Loading
Spinner mientras consulta config (estado del evento).

### 2. Si config.estado = 'cerrado' → Pantalla cerrada
Mensaje de bienvenida o cierre según corresponda. No permite votar.

### 3. Registro (si estado = 'abierto')
Formulario:
- Nombre (obligatorio)
- Apellido (obligatorio)
- Correo (obligatorio, validar formato)
- Edad (opcional, numérico)
- "¿Cuántas hamburguesas probaste?" → 3 botones: [1-2] [3-4] [5+] (opcional, un tap)
- Checkbox: "Acepto recibir información sobre promociones y novedades" (opcional)
- Botón "Continuar a votar"

Al enviar: generar device_id (huella simple del navegador — user agent + screen +
timezone hasheado), guardar en participantes. Si el correo ya existe, recuperar
ese participante (permitir que siga votando si no ha completado sus 2 votos).

### 4. Votación categoría $8
- Título/tab: "Mejor hamburguesa de $8"
- Grid de cards (las hamburguesas con categoria='8_dolares', activa=true, ordenadas por orden)
- Cada card: foto, nombre, restaurante, botón/estado seleccionable
- Feedback visual claro al seleccionar (borde resaltado + cambio de color)
- Botón "Confirmar voto $8" (deshabilitado hasta seleccionar una)

### 5. Votación categoría $10
- Igual que la anterior pero categoria='10_dolares'
- Título/tab: "Mejor hamburguesa de $10"

### 6. Confirmación final
- "¡Gracias por votar!" con las dos hamburguesas que eligió
- Mensaje de cierre amable
- No mostrar resultados ni ranking

---

## DISEÑO VISUAL

- Estética: festival gastronómico, apetitosa, energética, festiva
- Mobile-first (la mayoría vota desde el teléfono, posible mala señal)
- Colores por defecto: tonos cálidos (rojo tomate, naranja, amarillo mostaza)
  sobre fondo oscuro apetitoso. (Ajustables cuando llegue la marca del evento.)
- Tipografía con carácter (algo bold, apetitoso). Google Fonts.
- Tabs superiores para separar $8 y $10 (evitar scroll largo)
- Cards con foto grande de la hamburguesa (lo más apetitoso posible)
- Feedback de selección muy claro (esto es clave con multitudes y prisa)
- Transiciones suaves entre pasos
- Optimizar carga: lazy load de imágenes, mínimo peso

---

## PRIORIDADES DE INGENIERÍA

1. Velocidad de carga (mala señal en el festival)
2. Aguantar votación concurrente sin perder votos
3. Cero pérdida de leads: guardar el registro apenas se envía, antes de votar
4. Manejo de errores: si falla la conexión, reintentar y avisar sin perder datos
5. Estado de "ya votaste esta categoría" claro si la persona vuelve

---

## ANTITRAMPA — device_id

Genera una huella simple del navegador:
```javascript
function getDeviceId() {
  const raw = [
    navigator.userAgent,
    screen.width + 'x' + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language
  ].join('|');
  // hash simple a string corto
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }
  return 'dev_' + Math.abs(hash).toString(36);
}
```
Guardar en localStorage para persistencia. Combinar con correo único como doble
control. La BD ya previene doble voto por categoría (constraint unique).

---

## ESTRUCTURA DE ARCHIVOS SUGERIDA

```
src/
  lib/supabase.js         → cliente Supabase
  lib/device.js           → getDeviceId
  components/
    Loading.jsx
    RegistroForm.jsx
    VotacionCategoria.jsx  → reutilizable para $8 y $10
    HamburguesaCard.jsx
    Confirmacion.jsx
    PantallaCerrada.jsx
  App.jsx                 → máquina de estados del flujo
  main.jsx
  index.css               → Tailwind
```

---

## ENTREGABLE

- App funcional que corre con `npm run dev`
- README con instrucciones de setup y deploy a Vercel
- .env.example (sin llaves reales)
- Al terminar, lista los archivos creados y qué quedó pendiente

---

## VERIFICACIÓN ANTES DE CERRAR

- [ ] Registro guarda en participantes (verificar en Supabase)
- [ ] No deja votar dos veces la misma categoría
- [ ] El votante puede votar en las dos categorías
- [ ] Los datos opcionales no bloquean el flujo
- [ ] El consentimiento no bloquea el voto
- [ ] Si estado='cerrado' no se puede votar
- [ ] Mobile se ve bien (probar en viewport pequeño)
- [ ] No expone la service_role key en ningún lado
