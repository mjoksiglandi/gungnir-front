# Gugnir Frontend

Frontend `Next.js 16` para la consola operacional de Gugnir. La app expone un BFF autenticado, consume el backend principal por REST y mantiene la experiencia viva en `/operations` con runtime cliente, capas geoespaciales y vistas de soporte para `alerts`, `assets`, `incidents` y `historicos`.

## Estado actual

- App Router con route group autenticado en `src/app/(console)`
- layout compartido para las vistas privadas con `ConsoleShell`
- features separadas por dominio en `src/features`
- BFF y sesion manejados por `src/app/api/session/*` y `src/app/api/backend/[...path]`
- runtime principal del mapa encapsulado en `src/features/operations/components`
- tipos, contratos y adaptadores separados entre `src/types`, `src/shared/contracts`, `src/lib` y `src/services`
- compatibilidad temporal mantenida en `src/shared` y `src/widgets` para no romper imports/tests durante la migracion

## Stack

- `next@16.2.6`
- `react@19.2.4`
- `react-dom@19.2.4`
- `leaflet@1.9.4`
- `react-leaflet@5.0.0`
- `socket.io-client@4.8.3`
- `typescript@5`
- `eslint@9`
- `vitest@4`
- `pnpm@11.5.0`

## Requisitos

- Node.js 20+
- `npm` o `corepack`
- backend de Gugnir disponible localmente

## Variables de entorno

Base recomendada:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=ws://localhost:4000/realtime
NEXT_PUBLIC_SITE_URL=http://localhost:3000
BACKEND_API_URL=http://localhost:4000/api
```

Notas:

- `NEXT_PUBLIC_API_URL`: base REST visible para el navegador.
- `BACKEND_API_URL`: base REST server-side usada por handlers/paginas cuando el frontend no debe depender de la URL publica.
- `NEXT_PUBLIC_WS_URL`: endpoint realtime del backend.
- `NEXT_PUBLIC_SITE_URL`: base canonical del frontend.
- `INTERNAL_TEST_DATA_WRITE_ENABLED` solo debe activarse en entornos de desarrollo o test aislados.

## Desarrollo local

1. Levanta el backend de Gugnir.
2. Instala dependencias:

```bash
corepack pnpm install
```

Si `pnpm` no esta disponible globalmente, tambien sirve:

```bash
npx pnpm install
```

3. Inicia el frontend:

```bash
corepack pnpm dev
```

4. Abre [http://localhost:3000](http://localhost:3000).

Credenciales seed:

- `admin@gungnir.local`
- `admin12345`

## Scaffold actual

Estructura principal:

```text
src/
  app/
    (console)/
    api/
    login/
    backend-unavailable/
  components/
    layout/
  features/
    alerts/
    auth/
    history/
    operations/
  lib/
    navigation/
  services/
    data/
  constants/
  utils/
  types/
  shared/
  widgets/
```

Lectura recomendada:

- `src/app`: routing, layouts, metadata y route handlers.
- `src/components`: UI compartida transversal.
- `src/features`: implementacion por modulo funcional.
- `src/lib`: clientes, auth, websocket y navegacion.
- `src/services`: fachadas de acceso a datos para la app.
- `src/types`: DTOs y modelos de dominio.
- `src/constants` y `src/utils`: configuracion y helpers simples.
- `src/shared`: contratos y piezas legacy todavia usadas como fuente comun.
- `src/widgets`: bridges de compatibilidad mientras termina la migracion desde la estructura vieja.

## Modulos principales

### `app/(console)`

Contiene la superficie privada:

- `/operations`
- `/alerts`
- `/assets`
- `/incidents`
- `/historicos`

Todas comparten [src/app/(console)/layout.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/(console)/layout.tsx), que resuelve autenticacion server-side y monta [src/components/layout/console-shell.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/components/layout/console-shell.tsx).

### `features/operations`

Es el modulo mas grande y el runtime principal del producto. Aloja:

- bootstrap del mapa
- proveedor de estado operacional
- canvas y overlays
- sidebars de activos/dispositivos
- panel de capas
- sincronizacion runtime de assets, tracks, alerts y layers

Puntos de entrada:

- [src/features/operations/components/map-stage.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/features/operations/components/map-stage.tsx)
- [src/features/operations/components/map-stage-client.tsx](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/features/operations/components/map-stage-client.tsx)

### `features/history`

Encapsula la experiencia `/historicos`:

- filtros por fecha/tipo/query
- resumen de rutas
- mapa de replay
- helpers para construir y filtrar records historicos

### `features/alerts`

Encapsula la grilla live de alertas:

- render de cards
- refresh por websocket
- acciones `ack` y `resolve`

### `features/auth`

Encapsula el formulario de login y la logica cliente de autenticacion.

## BFF y acceso al backend

La sesion se maneja con:

- `POST /api/session/login`
- `GET /api/session/me`
- `POST /api/session/logout`
- `ALL /api/backend/*`

Esto evita exponer tokens del backend directamente al cliente y permite centralizar refresh/retry del lado servidor.

## Calidad

Comandos utiles:

```bash
corepack pnpm lint
corepack pnpm test
corepack pnpm build
```

Alternativas equivalentes usadas durante validacion:

```bash
npm exec eslint .
npm test
npm run build
```

## Validacion reciente

La estructura documentada aqui fue validada con:

- `npx next typegen`
- `npx pnpm exec tsc --noEmit`
- `npm exec eslint .`
- `npm test`
- `npm run build`

## Documentacion relacionada

- indice general: [docs/index.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/index.md)
- scaffold y modulos: [docs/scaffolding.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/scaffolding.md)
- referencia arquitectonica: [docs/project-reference.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/project-reference.md)
- estado funcional: [docs/feature-status.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/feature-status.md)
- dependencias: [docs/dependencies.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/dependencies.md)
- QA: [docs/qa-plan.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/qa-plan.md)
- seguridad: [docs/security-review.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/security-review.md)
- contratos: [docs/contracts/rest.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/rest.md) y [docs/contracts/websocket.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/websocket.md)
