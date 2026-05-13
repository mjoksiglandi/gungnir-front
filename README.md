# Gugnir Console Front

Frontend de consola operacional para una plataforma estilo C4. Este repositorio parte desde la experiencia web y contratos operacionales simulados, antes de integrar backend real y servicios de telemetria en vivo.

## Alcance Actual

- frontend con `Next.js` App Router
- vista `operations` centrada en mapa
- vistas dedicadas para `alerts`, `incidents` y `assets`
- escenario mock tipado para assets, alertas, incidentes y capas geoespaciales
- estructura preparada para evolucionar hacia bootstrap por API y actualizaciones en tiempo real via WebSocket

## Desarrollo Local

```bash
npm run dev
```

Abre `http://localhost:3000`. La ruta raiz redirige a `/operations`.

## Rutas y Archivos Clave

- `src/app/operations`: superficie operacional principal
- `src/app/alerts`: vista de alertas
- `src/app/incidents`: vista de coordinacion de incidentes
- `src/app/assets`: vista de registro de activos
- `src/shared/contracts/operational.ts`: contratos de dominio del frontend
- `src/shared/mock/scenario.ts`: datos en memoria que alimentan la interfaz
- `src/widgets`: componentes reutilizables de shell y visualizacion

## Proximos Pasos Recomendados

1. Agregar una capa de transporte mock con capacidad de replay sobre el escenario actual.
2. Consolidar la integracion de datos geoespaciales reales y feeds operacionales externos.
3. Incorporar rutas de detalle por entidad y estado de seleccion persistente.
4. Definir los contratos REST y WebSocket de backend a partir del modelo actual.
