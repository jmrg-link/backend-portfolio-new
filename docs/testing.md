# Testing

**TDD con pruebas funcionales**: se ejercita la **app real** (`app.inject`) contra la **MongoDB local**, no mocks. La prueba se escribe **antes o junto** al código, nunca después de cerrar el hito. `pnpm test` verde es requisito de cierre, igual que typecheck y lint en 0.

## Stack

- **Vitest 4** (`vitest.config.ts` con los alias replicados y `NODE_ENV=test`/`local`).
- **`fastify.inject`** para inyectar peticiones sin abrir un puerto.
- **`supertest`** disponible para el objetivo final de coverage de integración.

## Estructura

```
tests/
├── functional/
│   ├── api-auth.test.ts        # apiGuard/adminGuard: 401/403, exentos, tipos de token
│   ├── repositories.test.ts    # shape de entidades, _id string, proyección meta, filtros/orden
│   ├── blog-read.test.ts       # lecturas de blog: locales, paginación, clamps, 404/400
│   ├── blog-admin.test.ts      # CRUD admin completo: defaults, readingTime, 409, toggle, delete
│   ├── projects.test.ts        # lecturas de projects: featured, locales, envelope, 404/400
│   ├── cms.test.ts             # singletons (null con 200), skills con filtros, experiences, testimonials
│   ├── dashboard-auth.test.ts  # recent-activity (orden, tope 10), /auth/me, dev-token
│   ├── storage.test.ts         # contrato sin S3: 503 por ruta, bulk-delete agregado, health
│   ├── users.test.ts           # perímetro 401 de las 9 rutas /admin/users
│   └── users.e2e.test.ts       # ciclo real contra Clerk dev: create → patch → delete, invitaciones
└── helpers/
    ├── build-app.ts            # construye la app completa + conexión (buildTestApp)
    └── auth.ts                 # token real de admin vía /auth/dev-token (adminHeaders)
```

Estado actual: **100 pruebas verdes** (10 ficheros).

## Cómo se prueba

`build-app.ts` levanta la app real con sus plugins, guards y cadena de errores, y conecta a la Mongo local (con los datos seed). Cada test inyecta una petición y comprueba el contrato observable:

```ts
const app = await buildTestApp();

const res = await app.inject({
  method: 'GET',
  url: '/api/v1/blog',
});

expect(res.statusCode).toBe(200);
// sin token → 401; con token de servicio → 200; array plano sin page/limit; etc.
```

Lo que se verifica de verdad (no en abstracto):

- **Auth**: sin token → `401`; `Bearer` basura / JWT corrupto → `401` (nunca `500`); rutas exentas (`/api/health`, `OPTIONS`) pasan; email fuera de la allowlist → `403`.
- **Repositorios**: forma de las entidades, `_id` como `string`, **proyección meta** (listados sin `content`), filtros y orden contra el seed real.
- **Contrato HTTP**: array plano vs envelope de paginación, literales de error, defaults de locale.

## Comandos

```bash
pnpm test            # una pasada (vitest run)
pnpm test:watch      # modo watch
pnpm test:coverage   # con cobertura (v8) y umbrales trinquete
```

> Requiere la MongoDB local arriba (`docker compose up -d`). Sin ella, las pruebas funcionales fallan al conectar.

## Objetivo

Cobertura **100% de integración** al cerrar la migración, con `supertest` + `vitest` sobre todos los endpoints. Cada slice nuevo llega con su suite antes de darse por cerrado.

Los umbrales de `test:coverage` funcionan como **trinquete**: se fijan en la última cobertura garantizable y se elevan con cada mejora — una regresión de cobertura rompe la orden. La suite de storage tiene **doble contrato** (con y sin bucket S3 configurado: cada rama se salta en el entorno contrario), así que la cobertura varía ligeramente según el entorno (~88-90% de líneas); los umbrales reflejan el mínimo de ambos. Los huecos restantes requieren infraestructura no disponible (`server.listen` con TLS, escrituras S3 — la rama real es solo lectura) o ramas de error no alcanzables por HTTP.
