# Revision de seguridad

Fecha de corte: `2026-06-04`

## Resumen ejecutivo

Estado actual despues de esta pasada:

- `lint`, `test` y `build` pasan
- la autenticacion sigue encapsulada en cookies `httpOnly`
- las mutaciones sensibles ahora rechazan origen cruzado cuando el navegador envia `Origin` o `Referer`
- `api/internal/test-data/*` deja de habilitarse por omision fuera de `test`
- se fuerza `postcss` parcheado via `overrides` de workspace en pnpm

## Hallazgos priorizados

### 1. Dependencia vulnerable transitiva en `postcss`

Severidad: media

Evidencia:

- `corepack pnpm audit --prod`
- hallazgo: `GHSA-qx2v-qp2m-jg93`
- ruta: `next -> postcss`

Accion aplicada:

- override a `postcss@^8.5.15` en [pnpm-workspace.yaml](C:/Users/juan.cornejo/Documents/gugnir%20v2/pnpm-workspace.yaml)

Riesgo residual:

- conviene retirar el override cuando `next` incorpore un rango parcheado por defecto

### 2. Login CSRF por ausencia de validacion de origen

Severidad: media

Contexto:

- `POST /api/session/login` emitia cookies de sesion sin validacion explicita de `Origin` o `Referer`
- eso podia permitir fijar una sesion desde un sitio externo en algunos navegadores o flujos de formulario

Accion aplicada:

- verificacion same-origin en:
  - [src/app/api/session/login/route.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/api/session/login/route.ts)
  - [src/app/api/session/logout/route.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/api/session/logout/route.ts)
  - [src/app/api/_lib/verify-same-origin.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/api/_lib/verify-same-origin.ts)

Riesgo residual:

- si un cliente legitimo no envia `Origin` ni `Referer`, hoy se permite por compatibilidad
- si el frontend se expone cross-origin a futuro, habra que migrar a CSRF token dedicado

### 3. Superficie mutante interna expuesta por entorno demasiado amplio

Severidad: media

Contexto:

- `api/internal/test-data/*` antes solo se deshabilitaba en `production`
- eso dejaba abierta la escritura en `development`, previews compartidos o entornos mal configurados

Accion aplicada:

- feature flag explicita `INTERNAL_TEST_DATA_WRITE_ENABLED`
- habilitacion implicita solo en `NODE_ENV=test`
- rutas afectadas:
  - [src/app/api/internal/test-data/v1/assets/route.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/api/internal/test-data/v1/assets/route.ts)
  - [src/app/api/internal/test-data/v1/snapshot/route.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/api/internal/test-data/v1/snapshot/route.ts)

## Controles confirmados

- cookies de sesion en [src/lib/auth-session.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/lib/auth-session.ts): `httpOnly`, `sameSite=lax`, `secure` en produccion
- proxy autenticado con refresh server-side en [src/app/api/backend/[...path]/route.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/api/backend/[...path]/route.ts)
- rutas internas excluidas del `robots` policy en [src/app/robots.ts](C:/Users/juan.cornejo/Documents/gugnir%20v2/src/app/robots.ts)

## Recomendaciones siguientes

1. Agregar tests de route handlers para validar `403` por origen cruzado y por feature flag deshabilitada.
2. Evaluar rate limiting en `POST /api/session/login` a nivel BFF o upstream backend.
3. Si aparecen clientes externos legitimos, reemplazar la defensa same-origin por un flujo CSRF token + doble submit cookie o equivalente.
