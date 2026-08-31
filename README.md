# BurgerFest Votacion

App de votacion publica para BurgerFest Maracaibo 2026. El publico se registra, vota una hamburguesa de la categoria $8 y una de la categoria $10, y no ve resultados.

## Setup local

1. Instala dependencias:

```bash
npm install
```

2. Crea `.env` con las credenciales del proyecto Supabase:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Usa solo la anon key. Nunca pongas `service_role` en variables del frontend.

3. Ejecuta en desarrollo:

```bash
npm run dev
```

4. Compila para produccion:

```bash
npm run build
```

## Deploy en Vercel

1. Sube el repositorio a GitHub sin incluir `.env`.
2. Crea un proyecto en Vercel conectado al repo.
3. Configura estas variables en Vercel Project Settings > Environment Variables:

```bash
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

4. Usa los defaults de Vite:

```bash
Build Command: npm run build
Output Directory: dist
```

## Base de datos

La app espera el esquema de `BURGERFEST-SQL-DEFINITIVO.sql`:

- `config`: estado del evento y textos.
- `hamburguesas`: competidores activos por categoria.
- `participantes`: registro obligatorio de leads.
- `votos`: votos con restriccion unica por participante y categoria.

La restriccion `unique(participante_id, categoria)` es la defensa real contra voto duplicado. El frontend muestra un mensaje amable cuando Supabase rechaza un voto repetido.
