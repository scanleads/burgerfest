# PROMPT — Rediseño visual: fondo vinotinto + estilo editorial
## Para Claude Code (aplicar directo). Solo estilos, no toca lógica ni datos.

---

Rediseña la estética visual de la app BurgerFest. Cambio de dirección: pasar de
fondo oscuro/negro a un fondo VINOTINTO sólido, con botones claros que contrasten
y estilo editorial con bordes marcados y sombras sólidas (tipo la web oficial).

NO tocar: lógica, funciones RPC, flujo de pantallas, estructura de componentes.
Solo colores, bordes, sombras, esquinas y contraste.

---

## PALETA (variables CSS)

```css
--vino-fondo:   #7a1f2e;   /* fondo principal — vino oscuro sólido */
--vino-oscuro:  #5c1622;   /* vino más oscuro — sombras, bordes, profundidad */
--vino:         #9e2a3c;   /* vino de marca — detalles, estados hover */
--dorado:       #f2c065;   /* dorado — acentos, títulos destacados, eyebrow */
--crema:        #f8e8db;   /* crema — botones principales, superficies claras */
--blanco:       #ffffff;   /* blanco — textos sobre vino */
--texto-suave:  #e8d5c8;   /* crema atenuada — textos secundarios sobre vino */
```

---

## FONDO

- Fondo general de toda la app: **vinotinto sólido `#7a1f2e`**.
- Se puede agregar una textura o degradado MUY sutil hacia `#5c1622` en las
  esquinas para dar profundidad, pero sin exagerar — que se sienta sólido y
  editorial, no oscuro nocturno.
- Eliminar los acentos radiales naranjas/oscuros que había antes.

---

## BOTONES (el punto clave del contraste)

### Botón principal (Continuar, Votar, Confirmar, Seleccionar activo)
Estilo "editorial con sombra sólida" (como el botón REGÍSTRATE YA de la web oficial):
```css
background: var(--crema);          /* fondo crema claro */
color: var(--vino-oscuro);         /* texto vino oscuro */
border: 2px solid var(--vino-oscuro);
border-radius: 0;                  /* esquinas 90°, rectas */
box-shadow: 4px 4px 0 var(--vino-oscuro);  /* sombra SÓLIDA desplazada, sin blur */
font-weight: bold;
text-transform: uppercase;
```
En hover: se puede desplazar levemente (transform: translate(2px,2px)) y reducir
la sombra a 2px 2px, para efecto de "presión". Opcional pero se ve premium.

### Botón secundario (Cambiar, ghost)
```css
background: transparent;
color: var(--crema);
border: 2px solid var(--crema);
border-radius: 0;
box-shadow: 3px 3px 0 var(--vino-oscuro);
```

---

## TABS ($8 / $10)

- Contenedor de tabs: fondo `--vino-oscuro`, esquinas rectas (border-radius: 0).
- Tab ACTIVA: fondo `--dorado`, texto `--vino-oscuro`, borde 2px vino oscuro,
  esquinas rectas.
- Tab INACTIVA: fondo transparente, texto crema atenuado.

---

## CARDS (hamburguesas)

- Fondo de la card: un vino un poco más oscuro que el fondo (`--vino-oscuro`)
  para que se despegue del fondo vinotinto.
- Borde: 2px sólido. Normal en `--vino` tenue; cuando está SELECCIONADA, borde
  `--dorado` de 2-3px + sombra sólida dorada (`4px 4px 0 var(--dorado)`).
- Esquinas: rectas (border-radius: 0).
- El área de la foto/imagen de la hamburguesa: mantener, pero con esquinas rectas.
- Nombre de hamburguesa: blanco. Restaurante: dorado.
- Botón "Seleccionar" dentro de la card: estilo secundario. Cuando está
  "Seleccionada": fondo dorado, texto vino oscuro.

---

## TEXTOS

- Títulos grandes (VOTA TU BURGER, MEJOR HAMBURGUESA): blanco `#ffffff`.
- Eyebrow / kicker (BURGERFEST, MARACAIBO 2026, CATEGORIA $8): dorado `--dorado`,
  mayúsculas, letra espaciada.
- Texto de párrafo/instrucciones: crema atenuada `--texto-suave`.
- Labels de formulario: blanco o crema.

---

## FORMULARIO (inputs)

- Fondo de los inputs: vino más oscuro `--vino-oscuro` o un tono ligeramente
  distinto para que se distingan del fondo.
- Borde: 2px sólido, esquinas rectas (border-radius: 0).
- En focus: borde dorado.
- Texto que escribe el usuario: blanco. Placeholder: crema muy atenuada.
- Los botones de "cuántas probaste" (1-2 / 3-4 / 5+): estilo secundario;
  cuando uno está activo, fondo dorado con texto vino oscuro.
- Checkbox de consentimiento: el check en dorado.

---

## ESQUINAS — REGLA GLOBAL

**Todo a 90° (border-radius: 0)**: botones, cards, inputs, tabs, contenedores.
Estética cuadrada, editorial, definida. Nada redondeado.

---

## SOMBRAS — REGLA GLOBAL

Las sombras son **sólidas y desplazadas** (hard shadow, sin blur):
`box-shadow: Xpx Ypx 0 color;` (nota el `0` de blur). Nunca sombras difuminadas.
Esto le da el look "editorial/neo-brutalist" de la referencia oficial.

---

## OBJETIVO ESTÉTICO

Profesional, editorial, con carácter. Fondo vinotinto de marca, botones claros
que resaltan con borde y sombra sólida, esquinas rectas, acentos dorados. Debe
sentirse premium y claramente identificado con BurgerFest oficial, legible y
con buen contraste para leer al aire libre desde el teléfono.

---

## VERIFICACIÓN

- [ ] Fondo vinotinto sólido #7a1f2e en toda la app
- [ ] Botones principales en crema con borde y sombra sólida vino oscuro
- [ ] Botones con esquinas rectas (90°), sin redondear
- [ ] Sombras sólidas sin blur (box-shadow con 0 de blur)
- [ ] Cards con esquinas rectas y borde; seleccionada con borde/sombra dorada
- [ ] Tabs activa en dorado, esquinas rectas
- [ ] Acentos y eyebrows en dorado
- [ ] Textos con buen contraste sobre el vino (blanco/crema)
- [ ] Inputs con esquinas rectas y focus dorado
- [ ] npm run build pasa sin errores
- [ ] Se ve bien en móvil (probar viewport pequeño)
- [ ] Colores como variables CSS para ajustar fácil después
