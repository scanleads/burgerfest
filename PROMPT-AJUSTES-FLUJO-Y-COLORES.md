# PROMPT — Dos ajustes: navegación "Cambiar" + colores oficiales
## Para Claude Code (aplicar directo). Cambios de UI, no tocan seguridad ni datos.

---

Aplica DOS ajustes a la app BurgerFest. Ninguno toca las funciones RPC de
seguridad ni el esquema de datos. Son cambios de experiencia y de estilo visual.

---

## AJUSTE 1 — Corregir la navegación del botón "Cambiar"

### Problema actual
En la pantalla de revisión (estado 'revision'), cuando el usuario toca "Cambiar"
en la categoría $8, el flujo lo lleva a elegir $8 pero luego lo hace pasar de
nuevo por la pantalla de $10 antes de volver a la revisión. Es un paso de más.

### Comportamiento esperado
- "Cambiar" en $8 → va a elegir hamburguesa de $8 → al confirmar la selección,
  vuelve DIRECTO a la pantalla de revisión (NO pasa por $10).
- "Cambiar" en $10 → va a elegir hamburguesa de $10 → al confirmar, vuelve
  DIRECTO a la pantalla de revisión (NO pasa por $8).

### Implementación sugerida
Introducir una bandera o parámetro que indique que la persona viene "editando
desde revisión". Cuando esa bandera está activa, después de elegir esa categoría
se regresa a 'revision' en vez de avanzar a la siguiente categoría en secuencia.

El flujo normal (primera vez) NO cambia: elegir $8 → $10 → revisión.
Solo cambia cuando se entra a una categoría DESDE el botón "Cambiar".

Verificar: la selección previa de esa categoría debe aparecer ya marcada al
entrar a editar, para que el usuario vea qué había elegido.

---

## AJUSTE 2 — Alinear colores con la marca oficial BurgerFest

### Paleta oficial de la marca
```
--vino:      #9e2a3c   (rojo vino/guinda — color principal de marca)
--dorado:    #f2c065   (amarillo dorado/mostaza — acentos, destacados)
--crema:     #f8e8db   (crema claro — para textos suaves o detalles)
--blanco:    #ffffff   (textos, contraste)
```

### Dirección de diseño (Opción B — fondo oscuro con acentos oficiales)
MANTENER el fondo oscuro actual (es mejor para votar de noche al aire libre),
pero cambiar los acentos naranja/fuego actuales por los colores oficiales:

- El **botón principal** (Continuar, Votar, Confirmar): usar el rojo vino
  `#9e2a3c` como base, o un degradado de vino a dorado (`#9e2a3c` → `#f2c065`)
  si se ve bien. El texto del botón en blanco o crema para contraste.
- Los **acentos y destacados** (el eyebrow "BURGERFEST", los títulos de categoría,
  el borde de selección de las cards, los números): usar el dorado `#f2c065`.
- El **borde de la card seleccionada**: dorado `#f2c065` (en vez del naranja actual).
- Las **tabs $8/$10**: la tab activa con fondo dorado `#f2c065` y texto oscuro;
  la inactiva en tono apagado.
- El **fondo general**: mantener el oscuro actual (casi negro con calidez), pero
  se puede teñir muy sutilmente hacia el vino oscuro si mejora la calidez.
- Los **textos principales**: blanco `#ffffff`. Los secundarios en crema `#f8e8db`
  atenuado o gris cálido.

### Objetivo estético
Que se sienta claramente parte de la marca BurgerFest oficial (rojo vino + dorado)
pero manteniendo la elegancia y practicidad del modo oscuro. Festival gastronómico,
cálido, premium, apetitoso.

### Dónde aplicar
- Definir estos colores como variables CSS (custom properties) en index.css o
  donde estén los tokens de color, para que sea fácil ajustarlos después.
- Reemplazar los valores naranja/fuego actuales por las variables nuevas en:
  botones, bordes de selección, tabs, títulos, acentos.
- NO cambiar la estructura ni el layout, solo los colores.

---

## LO QUE NO SE TOCA

- Las funciones RPC de seguridad (registrar_participante, registrar_voto, etc.)
- El esquema de datos
- El flujo general de pantallas (registro → voto → revisión → confirmación)
- La estructura de los componentes (solo colores y la navegación del "Cambiar")

---

## VERIFICACIÓN

Ajuste 1:
- [ ] "Cambiar" en $8 vuelve directo a revisión tras re-elegir (no pasa por $10)
- [ ] "Cambiar" en $10 vuelve directo a revisión tras re-elegir (no pasa por $8)
- [ ] El flujo normal de primera vez sigue: $8 → $10 → revisión
- [ ] La selección previa aparece marcada al entrar a editar

Ajuste 2:
- [ ] Los colores usan la paleta oficial (#9e2a3c vino, #f2c065 dorado)
- [ ] El fondo sigue oscuro
- [ ] Los botones principales usan el vino o degradado vino-dorado
- [ ] El borde de selección y acentos usan dorado
- [ ] Los colores están como variables CSS reutilizables

General:
- [ ] npm run build pasa sin errores
- [ ] El flujo completo sigue navegable en móvil
- [ ] Nada de la lógica de datos o seguridad cambió
