# PROMPT PARA CODEX — Ajuste de seguridad (usar funciones RPC)
## Vía Claude Code: /codex:rescue

---

Ajusta la app de votación BurgerFest para que use funciones RPC de Supabase
en lugar de consultar las tablas directamente. Esto es por seguridad: se
cerró el acceso público de lectura a las tablas `participantes` y `votos`,
y ahora todo pasa por funciones protegidas.

NO rehagas la app. Solo modifica la capa de datos (cómo lee/escribe en Supabase).
El diseño visual y el flujo de pantallas NO cambian.

---

## CONTEXTO

Se ejecutó un SQL de seguridad en Supabase que:
- Quitó el acceso público de lectura (SELECT) a `participantes` y `votos`
- Creó 3 funciones RPC que la app debe usar ahora

Si la app sigue haciendo `.from('participantes').select()` o
`.from('votos').select()` o `.insert()` directo, va a fallar con error de
permisos. Hay que cambiar esas llamadas por las funciones RPC.

---

## LAS 3 FUNCIONES RPC QUE DEBES USAR

### 1. Registrar participante (reemplaza el insert directo a participantes)

Antes (lo que hay que cambiar):
```javascript
const { data, error } = await supabase
  .from('participantes')
  .insert({ nombre, apellido, correo, edad, ... })
  .select()
  .single();
```

Ahora (usar RPC):
```javascript
const { data: participanteId, error } = await supabase.rpc('registrar_participante', {
  p_nombre: nombre,
  p_apellido: apellido,
  p_correo: correo,
  p_edad: edad || null,
  p_hamburguesas_probadas: hamburguesasProbadas || null,  // '1-2' | '3-4' | '5+'
  p_acepta_marketing: aceptaMarketing || false,
  p_device_id: deviceId || null,
  p_ciudad: 'Maracaibo'
});
// participanteId es un uuid (string). Si el correo ya existía, devuelve el id existente.
```

### 2. Consultar en qué categorías ya votó (reemplaza el select a votos)

Antes:
```javascript
const { data } = await supabase
  .from('votos')
  .select('categoria')
  .eq('participante_id', id);
```

Ahora (usar RPC):
```javascript
const { data: categoriasVotadas, error } = await supabase.rpc('mis_categorias_votadas', {
  p_participante_id: participanteId
});
// categoriasVotadas es un array de objetos: [{ categoria: '8_dolares' }, ...]
```

### 3. Registrar voto (reemplaza el insert directo a votos)

Antes:
```javascript
const { error } = await supabase
  .from('votos')
  .insert({ participante_id, hamburguesa_id, categoria, ciudad });
```

Ahora (usar RPC):
```javascript
const { data: resultado, error } = await supabase.rpc('registrar_voto', {
  p_participante_id: participanteId,
  p_hamburguesa_id: hamburguesaId,
  p_categoria: categoria,       // '8_dolares' | '10_dolares'
  p_ciudad: 'Maracaibo'
});
// resultado es un string: 'ok' | 'ya_voto' | 'cerrado' | 'error'
```

Manejo del resultado del voto:
- `'ok'`      → voto registrado, avanzar a la siguiente categoría o confirmación
- `'ya_voto'` → ya había votado en esta categoría, mostrar mensaje amable y avanzar
- `'cerrado'` → el evento se cerró, mostrar PantallaCerrada
- `'error'`   → error genérico, permitir reintentar

---

## LO QUE NO CAMBIA (sigue igual)

Estas lecturas siguen siendo directas porque son datos públicos:

```javascript
// Leer hamburguesas (sigue igual)
const { data } = await supabase
  .from('hamburguesas')
  .select('*')
  .eq('activa', true)
  .order('orden');

// Leer estado del evento (sigue igual)
const { data } = await supabase
  .from('config')
  .select('valor')
  .eq('clave', 'estado')
  .single();
```

---

## ARCHIVOS A REVISAR Y AJUSTAR

Busca en estos archivos las llamadas a Supabase y cámbialas:
- `src/components/RegistroForm.jsx` → usar registrar_participante
- `src/components/VotacionCategoria.jsx` → usar registrar_voto
- `src/App.jsx` → si maneja el estado de "ya votó", usar mis_categorias_votadas
- Cualquier otro archivo que haga `.from('participantes')` o `.from('votos')`

Busca en todo src/ los patrones:
- `.from('participantes')` → debe quedar solo dentro de las llamadas RPC (o eliminarse)
- `.from('votos')` → igual
- `.select()` sobre esas tablas → reemplazar por las RPC correspondientes

---

## VERIFICACIÓN ANTES DE CERRAR

- [ ] No queda ningún `.from('participantes').select()` ni `.insert()` directo
- [ ] No queda ningún `.from('votos').select()` ni `.insert()` directo
- [ ] El registro usa registrar_participante y recibe el uuid
- [ ] El voto usa registrar_voto y maneja los 4 resultados ('ok','ya_voto','cerrado','error')
- [ ] La consulta de "ya votó" usa mis_categorias_votadas
- [ ] Las lecturas de hamburguesas y config siguen directas (son públicas)
- [ ] npm run build corre sin errores
- [ ] El flujo completo sigue navegable: registro → voto $8 → voto $10 → confirmación

Al terminar, lista los archivos que tocaste y confirma que build pasó.
