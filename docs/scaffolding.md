# Scaffolding actual

Documento de referencia rapida para entender donde vive cada tipo de codigo y como mantener la estructura consistente.

## Objetivo del scaffold

El repo ya no organiza toda la UI alrededor de `widgets` y `app`. La estructura actual busca separar:

- routing y layouts
- componentes compartidos
- implementacion por feature
- clientes y servicios
- tipos y helpers
- codigo legacy/compatibilidad

## Arbol conceptual

```text
src/
  app/
  components/
  features/
  lib/
  services/
  types/
  constants/
  utils/
  shared/
  widgets/
```

## Ownership por carpeta

### `src/app`

Usar para:

- `page.tsx`, `layout.tsx`, `loading.tsx`, `not-found.tsx`, `route.ts`
- metadata y convenciones de Next.js
- composicion final de la pagina con modulos ya extraidos

No usar para:

- meter componentes grandes de feature
- meter helpers de UI que puedan vivir en `features/*` o `components/*`

### `src/app/(console)`

Route group de la experiencia autenticada.

Regla:

- si una vista requiere sesion y comparte el shell operacional, debe vivir aqui.

### `src/components`

Reservado para UI realmente compartida entre multiples features o layouts.

Ejemplo actual:

- `components/layout/console-shell`

### `src/features`

Unidad principal de organizacion funcional.

Cada feature puede tener:

- `components/`
- `hooks/`
- `services/`
- `types/`
- `utils/`

Actualmente:

- `features/auth`
- `features/alerts`
- `features/history`
- `features/operations`

### `src/lib`

Infraestructura tecnica reusable:

- clientes HTTP
- auth/session
- websocket
- navegacion

No deberia mezclar reglas de presentacion.

### `src/services`

Fachadas de datos o puntos de entrada de servicio para la app.

Estado actual:

- `services/data` expone bridges hacia la implementacion de datos compartida

### `src/types`

Tipos de API y modelos de dominio de nivel aplicacion.

### `src/constants`

Configuracion y valores compartidos simples.

### `src/utils`

Helpers puros y pequeños, sin estado ni acoplamiento fuerte a una feature.

### `src/shared`

Zona compartida heredada. Sigue siendo valida para:

- contratos
- loaders geoespaciales
- mocks y replay
- gateway base de datos operacionales

Pero no es la carpeta recomendada para codigo nuevo de UI.

### `src/widgets`

Zona de compatibilidad.

Regla actual:

- no agregar implementacion nueva aqui
- usarla solo para reexports/bridges mientras se estabilizan imports viejos

## Como ubicar codigo nuevo

### Si es una ruta

- `src/app/...`

### Si es un componente compartido entre varias pantallas

- `src/components/...`

### Si pertenece solo a una funcionalidad

- `src/features/<feature>/...`

### Si es un cliente o helper tecnico de plataforma

- `src/lib/...`

### Si es una fachada de datos consumida por varias capas

- `src/services/...`

### Si es un helper puro

- `src/utils/...`

## Convenciones actuales

- rutas privadas bajo `app/(console)`
- layout compartido para proteger sesion una vez
- features encapsulan la mayor parte de la UI compleja
- tests antiguos pueden seguir importando desde `src/widgets/*` mientras existan bridges

## Deuda estructural aun visible

- persisten duplicados intencionales entre `shared/*` y `services/*`
- persisten bridges en `widgets/*`
- algunas referencias documentales antiguas todavia nombran la estructura previa

## Direccion recomendada

1. Seguir moviendo imports consumidores a `features/*`, `lib/*`, `services/*`, `utils/*`.
2. Reducir gradualmente `src/widgets`.
3. Mantener `src/shared` enfocado en contratos, geoespacial y material comun no ligado a UI.
