# PROMPT — Panel de Administración BurgerFest
## Para Claude Code (aplicar directo) o Codex vía /codex:rescue

---

Construye un panel de administración para la app BurgerFest. Es una ruta/página
separada de la app de votación pública. Solo el organizador (Samuel y el cliente)
lo usan.

Stack igual: React + Vite + Tailwind + Supabase. Mismo proyecto.

---

## ⚠️ SEGURIDAD — MUY IMPORTANTE

El panel admin necesita LEER los leads y el ranking, cosa que el público NO puede
hacer (lo bloqueamos por seguridad). Por eso el admin debe usar una vía distinta.

**NO uses la service_role key en el frontend** (sería un hueco de seguridad
gravísimo — quedaría expuesta en el navegador).

En su lugar, usar autenticación de Supabase (Supabase Auth):
1. El admin inicia sesión con usuario (email) y contraseña vía Supabase Auth
2. Una vez autenticado, sus consultas usan su sesión autenticada (rol 'authenticated')
3. Se crean políticas RLS que permiten al rol 'authenticated' leer participantes,
   votos y el ranking (lo que anon no puede)

### SQL adicional necesario (documentar para que Samuel lo corra):

```sql
-- Permitir al rol authenticated leer los datos sensibles (solo admin logueado)
grant select on participantes        to authenticated;
grant select on votos                to authenticated;
grant select on ranking_hamburguesas to authenticated;

-- Políticas RLS para authenticated
create policy "admin lee participantes" on participantes
  for select to authenticated using (true);
create policy "admin lee votos" on votos
  for select to authenticated using (true);

-- El admin también necesita cambiar el estado del evento (abrir/cerrar)
grant update on config to authenticated;
create policy "admin actualiza config" on config
  for update to authenticated using (true) with check (true);

-- El admin gestiona hamburguesas (agregar/editar/activar)
grant insert, update, delete on hamburguesas to authenticated;
create policy "admin gestiona hamburguesas" on hamburguesas
  for all to authenticated using (true) with check (true);
```

**Nota:** el usuario admin se crea desde el dashboard de Supabase (Authentication
→ Users → Add user), con email y contraseña. Samuel lo hace una vez.

---

## FUNCIONALIDADES DEL PANEL

### 1. Login
- Pantalla de inicio de sesión: email + contraseña
- Usa supabase.auth.signInWithPassword()
- Si no está logueado, no muestra nada del panel
- Botón de cerrar sesión

### 2. Control del evento (lo más importante para operar en vivo)
- Ver el estado actual: ABIERTO / CERRADO (grande y claro)
- Botón para ABRIR la votación (cambia config.estado a 'abierto')
- Botón para CERRAR la votación (cambia config.estado a 'cerrado')
- Confirmación antes de cerrar (evitar cierre accidental)

### 3. Resultados en vivo (el corazón del panel)
- Ranking de la categoría $8: hamburguesas ordenadas por total de votos
- Ranking de la categoría $10: igual
- Cada una muestra: nombre, restaurante, cantidad de votos, y una barra visual
- Auto-actualización cada 10-15 segundos (para verlo en vivo durante el evento)
- Total de votos emitidos y total de participantes registrados

### 4. Métricas rápidas
- Total de participantes registrados
- Total de votos ($8 y $10 por separado)
- Distribución de "cuántas hamburguesas probaste" (1-2 / 3-4 / 5+)
- Cuántos aceptaron marketing (para saber cuántos leads con consentimiento)

### 5. Exportar leads (para entregar al cliente)
- Botón "Descargar leads CSV"
- Exporta: nombre, apellido, correo, edad, hamburguesas_probadas,
  acepta_marketing, ciudad, fecha de registro
- Formato CSV con encoding UTF-8 (para que abra bien en Excel con acentos)
- Nombre del archivo: burgerfest-leads-[fecha].csv

### 6. Gestión de hamburguesas (opcional pero útil)
- Ver la lista de hamburguesas cargadas
- Agregar una nueva (nombre, restaurante, categoría, foto_url)
- Activar/desactivar una hamburguesa
- Esto permite cargar las marcas reales sin tocar SQL

---

## DISEÑO

- Mismo estilo que la app pública (fondo oscuro cálido, tipografía bold, acentos naranja)
- Pero más "dashboard": tablas claras, números grandes, barras de progreso
- Desktop-first (el admin probablemente lo usa desde una laptop en el evento)
  pero que funcione en móvil también
- Los rankings con barras visuales para ver de un vistazo quién va ganando

---

## ESTRUCTURA SUGERIDA

```
src/
  admin/
    AdminApp.jsx        → máquina de estados del admin (login → dashboard)
    AdminLogin.jsx      → pantalla de login
    AdminDashboard.jsx  → panel principal
    ControlEvento.jsx   → abrir/cerrar votación
    RankingVivo.jsx     → resultados en vivo con auto-refresh
    Metricas.jsx        → números rápidos
    ExportarLeads.jsx   → botón de descarga CSV
    GestionBurgers.jsx  → CRUD de hamburguesas
  lib/supabase.js       → (reusar el existente)
```

Definir cómo se accede al admin: ruta separada (ej. /admin) o archivo HTML aparte.
Si se usa React Router, agregarlo. Si no, la forma más simple es un parámetro o
una página separada. Elige lo más simple que funcione en Vercel.

---

## VERIFICACIÓN

- [ ] El login funciona con Supabase Auth (no service_role key en el código)
- [ ] Sin sesión, no se ve ningún dato sensible
- [ ] Abrir/cerrar votación cambia config.estado y se refleja en la app pública
- [ ] El ranking muestra los votos reales de la BD
- [ ] El ranking se auto-actualiza cada 10-15 seg
- [ ] La exportación CSV descarga los leads con todos los campos
- [ ] El CSV abre bien en Excel (UTF-8, acentos correctos)
- [ ] npm run build pasa sin errores
- [ ] La service_role key NO aparece en ningún archivo del frontend

Al terminar, lista los archivos creados y el SQL que Samuel debe correr.


---

## ⭐ ACTUALIZACIÓN: Gráfica de resultados (pedido de Samuel)

El ranking en vivo debe verse como una GRÁFICA/tabla visual clara de "quién va
ganando", no solo números en lista. Especificación:

### Por cada categoría ($8 y $10), mostrar:
- Barras horizontales, una por hamburguesa, ordenadas de mayor a menor votos
- La barra más larga = la que va ganando (destacarla, ej. con borde/color dorado)
- Cada barra muestra: nombre de hamburguesa, restaurante, cantidad de votos y %
- Ancho de la barra proporcional a los votos (visual de un vistazo)
- El líder de cada categoría destacado (corona, medalla, o color especial)

### Ejemplo visual (categoría $8):
```
MEJOR HAMBURGUESA DE $8                    Total: 145 votos
┌────────────────────────────────────────────────────┐
│ 🥇 La Clásica · Burger House                        │
│ ████████████████████████████████░░░░  87 (60%)      │
│                                                      │
│    La Ahumada · Grill Master                        │
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░░  38 (26%)       │
│                                                      │
│    La Doble Queso · Cheese Lovers                   │
│ ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  20 (14%)       │
└────────────────────────────────────────────────────┘
```

- Colores de marca: barras en dorado/vino, fondo vinotinto
- Auto-refresh cada 10-15 seg para verlo evolucionar en vivo durante el evento
- Si se puede, una animación suave cuando una barra cambia de tamaño (satisfactorio
  de ver en vivo), pero no es crítico

### Opción de librería
Se puede usar una librería de gráficos ligera (recharts, o barras con CSS puro).
Preferir CSS puro si mantiene el peso bajo y el control visual. recharts es OK si
facilita el auto-refresh y la estética.
