# Gugnir Console Front

Frontend operacional de `Gugnir Console`, construido con `Next.js 16`, `React 19` y `Leaflet`. El proyecto hoy entrega una consola geoespacial navegable, contratos tipados para integracion con backend y un entorno mock suficientemente solido para seguir desarrollando sin depender todavia de servicios reales.

## Que incluye hoy

- consola principal en `/operations` con mapa, overlays, seleccion de activos y sidebars operacionales
- vistas dedicadas para `/assets`, `/alerts` e `/incidents`
- paginas de detalle para cada entidad con metadata por ruta
- API publica de lectura bajo `/api/v1/*`
- endpoints internos de test-data para desarrollo local
- `robots.txt`, `sitemap.xml`, `not-found` y `global-error` listos para produccion
- bootstrap server-side del mapa con gateway de datos unificado

## Stack

- `next@16.2.6`
- `react@19.2.4`
- `react-dom@19.2.4`
- `leaflet@1.9.4`
- `react-leaflet@5.0.0`
- `typescript@5`
- `eslint@9` + `eslint-config-next`

## Inicio rapido

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). La raiz redirige a `/operations`.

Comandos utiles:

```bash
npm run lint
npm run build
npm run start
```

## Variables de entorno

El proyecto usa `SITE_URL` o `NEXT_PUBLIC_SITE_URL` para construir metadata absoluta, `robots.txt` y `sitemap.xml`.

Ejemplo:

```bash
NEXT_PUBLIC_SITE_URL=https://console.example.com
```

Si no se define, el proyecto cae a un placeholder de desarrollo en [src/shared/site.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/site.ts).

## Rutas principales

- `/operations`: vista principal del C4 con mapa y capas operacionales
- `/assets`: registro de unidades rastreadas
- `/assets/[id]`: detalle de asset
- `/alerts`: feed de alertas
- `/alerts/[id]`: detalle de alerta
- `/incidents`: tablero de incidentes
- `/incidents/[id]`: detalle de incidente

## API disponible

### API publica de lectura

- `GET /api/v1/operations/bootstrap`
- `GET /api/v1/operations/snapshot`
- `GET /api/v1/assets`
- `GET /api/v1/assets/:id`
- `GET /api/v1/alerts`
- `GET /api/v1/alerts/:id`
- `GET /api/v1/incidents`
- `GET /api/v1/incidents/:id`
- `GET /api/v1/layers`
- `GET /api/v1/layers/:id`
- `GET /api/v1/timeline`
- `GET /api/v1/timeline/:id`
- `GET /api/v1/geospatial/fire-hotspots`

### API interna de test-data

Estos endpoints existen para desarrollo local y pruebas manuales. En produccion responden `403`.

- `PUT /api/internal/test-data/v1/snapshot`
  reemplaza el `OperationalScenario` completo
- `POST /api/internal/test-data/v1/assets`
  inserta o actualiza un `Asset` validado

## Arquitectura resumida

- [src/app](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app): App Router, paginas, metadata y Route Handlers
- [src/widgets](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/widgets): shell visual y mapa operacional
- [src/widgets/map-stage](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/widgets/map-stage): canvas, sidebars, hooks de UI y seleccion
- [src/shared/contracts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/contracts): contratos canonicos de dominio, REST, WebSocket y bootstrap
- [src/shared/data](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/data): gateway server-side y composicion de bootstrap
- [src/shared/mock](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/mock): escenario base y replay mock
- [src/shared/transport](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/transport): transporte mock replayable y eventos operacionales
- [src/shared/feeds](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/feeds): integracion geoespacial externa
- [docs](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs): documentacion del proyecto

## Como fluye la data

1. El servidor compone el bootstrap inicial desde [getOperationsMapBootstrap](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/data/operations-map-bootstrap.ts).
2. Las paginas y APIs leen a traves de [operationalDataGateway](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/shared/data/operational-data.ts).
3. El mapa hidrata la UI cliente con [MapStage](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/widgets/map-stage.tsx) y [MapStageClient](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/widgets/map-stage-client.tsx).
4. Los overlays geoespaciales se mezclan con entidades canonicas, pero `FireHotspot` sigue siendo una capa externa y no una entidad de dominio.

## Estado del proyecto

El front quedo en una base apta para deploy:

- `next build` y `eslint` pasan localmente
- metadata base y metadata por vista ya estan cableadas
- hay fallback de 404 y error global
- la API interna de mutacion esta bloqueada en produccion
- el mapa y la shell ya reflejan una estructura estable para seguir con backend real

## Que conviene hacer despues

1. Reemplazar el transporte mock por un adapter real para snapshot + stream.
2. Definir estrategia de resume para eventos incrementales (`lastSequence`, watermark o equivalente).
3. Conectar autenticacion y autorizacion antes de exponer acciones operacionales reales.
4. Agregar tests automaticos para convergencia entre bootstrap, snapshot y stream.
5. Revisar visualmente responsive y estados vacios/error con browser testing.

## Documentacion relacionada

La entrada principal de la documentacion esta en [docs/index.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/index.md).

Lecturas recomendadas:

- [docs/project-reference.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/project-reference.md)
- [docs/implementation-plan.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/implementation-plan.md)
- [docs/contracts/rest.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/rest.md)
- [docs/contracts/websocket.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/websocket.md)
- [docs/contracts/test-data-rest.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/contracts/test-data-rest.md)
- [docs/dependencies.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/dependencies.md)
- [docs/handoffs.md](C:/Users/juan.cornejo/Documents/gugnir%20v2/docs/handoffs.md)

## Repositorio

Remote actual:

- `origin`: [mjoksiglandi/gungnir-front](https://github.com/mjoksiglandi/gungnir-front)
