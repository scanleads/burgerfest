# PROMPT — Cambio de flujo de votación (revisión final antes de votar)
## Para Claude Code (aplicar directo) o Codex vía /codex:rescue

---

Modifica el flujo de votación de la app BurgerFest. NO cambies el diseño visual
ni la seguridad (las funciones RPC). Solo cambia CUÁNDO se registran los votos
y agrega una pantalla de revisión final.

---

## FLUJO ACTUAL (el que hay que cambiar)

Ahora mismo cada voto se registra apenas la persona confirma cada categoría:
```
Elegir $8 → [CONFIRMAR VOTO $8 → se guarda en BD] →
Elegir $10 → [CONFIRMAR VOTO $10 → se guarda en BD] →
Pantalla "Gracias" (ya votó, irreversible)
```

Problema: los votos se guardan uno por uno, sin oportunidad de revisar o cambiar.

---

## FLUJO NUEVO (el que hay que implementar)

La persona elige ambas SIN guardar nada en la base de datos todavía. Todo se
mantiene en el estado de React (memoria) hasta la confirmación final.

```
1. Elegir hamburguesa de $8  → se guarda en estado local (NO en BD)
2. Elegir hamburguesa de $10 → se guarda en estado local (NO en BD)
3. PANTALLA DE REVISIÓN:
   - Muestra las dos elecciones: "Vas a votar por: [X] en $8 y [Y] en $10"
   - Botón para volver a la categoría $8 y cambiar
   - Botón para volver a la categoría $10 y cambiar
   - Botón grande "VOTAR" (definitivo)
4. Al tocar "VOTAR":
   - Se registran AMBOS votos en la BD (dos llamadas a registrar_voto)
   - Recién aquí se compromete la decisión
5. Pantalla "Gracias por votar" (ya es irreversible)
```

---

## REGLAS DEL NUEVO FLUJO

1. **Nada se guarda en BD hasta el botón "VOTAR" final.** Las selecciones de $8
   y $10 viven en el estado de React hasta ese momento.

2. **La persona puede volver atrás y cambiar** cualquiera de las dos selecciones
   antes de tocar "VOTAR". Al volver a una categoría, su selección previa debe
   aparecer ya marcada (para que vea qué había elegido).

3. **El botón "VOTAR" registra ambos votos** llamando a `registrar_voto` dos
   veces (una por categoría). Si alguna falla, manejar el error sin perder la
   otra (idealmente, informar y permitir reintentar).

4. **Después de "VOTAR" exitoso**, ir a la pantalla de confirmación final y ya
   no permitir volver a votar (como funciona ahora).

5. **Manejo de resultados de registrar_voto** (ya implementado, mantenerlo):
   - 'ok' → voto registrado
   - 'ya_voto' → esta persona ya había votado esa categoría (raro en este flujo,
     pero puede pasar si vuelve con el mismo correo; manejar con gracia)
   - 'cerrado' → el evento se cerró; mostrar PantallaCerrada
   - 'error' → permitir reintentar

6. **Si el evento se cierra mientras la persona está eligiendo** (entre que entró
   y toca VOTAR), la validación de `registrar_voto` lo detecta ('cerrado') y se
   maneja mostrando la pantalla de cierre.

---

## PANTALLA DE REVISIÓN — diseño

Mantener la estética actual (fondo oscuro cálido, tipografía bold, acentos
naranja/rojo). Debe mostrar:

```
┌─────────────────────────────────────┐
│  REVISA TU VOTO                     │
│  Confirma tus elecciones. Una vez   │
│  votes, no podrás cambiarlas.       │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ CATEGORÍA $8                  │  │
│  │ [Nombre hamburguesa]          │  │
│  │ [Restaurante]                 │  │
│  │ [botón: Cambiar]              │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ CATEGORÍA $10                 │  │
│  │ [Nombre hamburguesa]          │  │
│  │ [Restaurante]                 │  │
│  │ [botón: Cambiar]              │  │
│  └───────────────────────────────┘  │
│                                     │
│  [ ═══════ VOTAR ═══════ ]          │
│  (botón grande, definitivo)         │
└─────────────────────────────────────┘
```

El botón "Cambiar" de cada categoría lleva de vuelta a esa votación, con la
selección previa ya marcada, permitiendo elegir otra.

---

## ESTADOS DE LA APP (actualizar la máquina de estados)

```
loading → cerrado/abierto → registro →
  voto_8 (elige, no guarda) →
  voto_10 (elige, no guarda) →
  revision (muestra ambas, permite cambiar) →
  [botón VOTAR: guarda ambos] →
  confirmacion (gracias, irreversible)
```

Desde 'revision', los botones "Cambiar" regresan a 'voto_8' o 'voto_10'
manteniendo las selecciones en estado.

---

## LO QUE NO CAMBIA

- El diseño visual general (colores, tipografía, cards)
- Las funciones RPC de seguridad (registrar_participante, registrar_voto, etc.)
- El registro inicial (nombre, apellido, correo, etc.)
- La lectura de hamburguesas y config

---

## VERIFICACIÓN

- [ ] Elegir $8 no guarda nada en BD (verificar que la tabla votos no cambia)
- [ ] Elegir $10 no guarda nada en BD
- [ ] La pantalla de revisión muestra ambas elecciones correctamente
- [ ] "Cambiar" en $8 vuelve a esa categoría con la selección previa marcada
- [ ] "Cambiar" en $10 igual
- [ ] El botón "VOTAR" registra ambos votos (verificar en tabla votos: 2 filas)
- [ ] Después de votar, no se puede volver atrás
- [ ] npm run build pasa sin errores
- [ ] El flujo completo es navegable en móvil
