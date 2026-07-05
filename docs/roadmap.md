# Estado y roadmap

Estado de la migración tRPC → REST a fecha **2026-07-05**.

## Hecho ✅

### Plataforma
- **Fastify 5 HTTP/2** en dos modos (TLS+ALPN con certs · h2c sin ellos). Verificado en vivo (`h2` y `http/1.1`).
- **MongoDB local**: `docker-compose` con replica set `rs0` (mongo 8.0), datos seed portados.
- **Entorno validado con Zod** (fail-fast), agrupado por subsistema (`env.server`, `env.mongo`, `env.clerk`, `env.s3`, `env.loki`).
- **Cadena de errores** operativa → Problem Details (RFC 9457) + `x-request-id`.
- **Logging HTTP** con `LoggerPort` + adapter de consola.

### Autenticación
- **API privada**: `apiGuard` global (session / api_key / m2m); `/api/health` y `OPTIONS` exentos.
- **`adminGuard`** endurecido: sesión Clerk real + `ADMIN_EMAIL_ALLOWLIST` (403 fuera de ella), fail-closed. Registro cerrado en Clerk.

### Slices (verificados en vivo y por suite funcional)
- **blog**: plantilla canónica. Lecturas (`GET /blog`, `GET /blog/:slug`) **y CRUD admin completo** (`POST/PATCH/DELETE /admin/blog*`, `toggle-published`): defaults del contrato, `readingTime` de servidor, campos inmutables en update, `409` por índice único.
- **projects**: `GET /projects`, `/projects/featured`, `/projects/:slug`.
- **cms**: `GET /cms/{site-settings,hero,about,skills,experiences,testimonials}`.
- **storage**: 9 rutas (download-url + admin S3 completo); `503` si S3 sin configurar.
- **dashboard**: `GET /admin/dashboard/recent-activity`.
- **auth**: `GET /auth/me`.
- **users**: gestión admin vía Clerk Backend API — 9 rutas `/admin/users*` (CRUD + invitaciones) con `adminGuard`; alta directa o por invitación, sin sign-up público.

### Entidades / modelos
- Las **9** entidades con su modelo y colección (incl. `SkillCategory`, solo entidad+modelo).
- Bases de repositorio compartidas (`BaseRepository`, `LocaleSingleton`, `PublishedByLocale`) y `BaseEntity`.

### Documentación de la API
- **OpenAPI / Swagger** (`@fastify/swagger` + `swagger-ui`), montado **solo en `pnpm dev`**: UI en `/documentation`, esquema descargable en `/documentation/json` (importable en Postman), auth Bearer global. Los **7 slices** documentados al 100% (request + responses); los schemas Zod se exponen desde los DTOs.

### Calidad
- Norma JSDoc aplicada a todo `src` (auditoría de 7 categorías = 0).
- Suite funcional (Vitest + `app.inject`): **100 pruebas verdes** en 10 ficheros — lecturas, CRUD admin de blog, contrato de storage sin S3, ciclo e2e de users contra Clerk dev.
- Cobertura con umbrales **trinquete** (~89% líneas · 93% funciones); objetivo 100% al cierre.
- `typecheck` 0 · `lint` 0 · `test` verde.

## Pendiente ⏳

| Área | Descripción |
|---|---|
| **Admin CRUD** | Escrituras de **projects / cms** (el CRUD de blog ya está operativo). **Espejado ES↔EN** como use-case (`commands/`) pendiente en todos los slices. |
| **Slice contact** | `POST /contact`: rate-limit → Turnstile → email (Mailtrap; candidata `nodemailer` como transporte, solo con confirmación del owner). |
| **Caché Valkey** | `ioredis` sobre Valkey; contrato de claves/TTLs en `rules/caching.md`. |
| **Logging Loki** | Winston + `winston-loki` a Grafana Loki (hoy existe el puerto + adapter de consola). |
| **Slice auth (ampliación)** | `POST /auth/logout` (revocar sesión), `POST /auth/webhooks/clerk` (sync), `POST /auth/sign-in-token`. |
| **`GET /admin/settings/infra`** | `settings.infraInfo`. |
| **Event sourcing** | Activación **selectiva** de Emmett (event store / proyecciones); primer candidato: `dashboard.recentActivity` como read model. |
| **Imágenes** | `sharp` para procesado en subidas S3. |
| **Coverage** | 100% de integración (`supertest` + `vitest`) al finalizar; hoy ~89% de líneas con umbrales trinquete. |

## Dependencias planificadas (no cablear sin implementar su slice)

El `package.json` es el **mapa del plan**; sus dependencias **no se eliminan sin confirmación del owner**. Uso previsto de las aún no cableadas:

`ioredis` → caché Valkey + rate-limit · `mailtrap` → contact · `winston` + `winston-loki` → Loki · `sharp` → imágenes S3 · `jose` → utilidades JWT · `nanoid` → IDs · `supertest` → tests de integración.

## Fuentes

- **Portfolio original** (solo lectura): mismas colecciones de MongoDB — el backend nuevo no migra datos.
- **Comportamiento del sistema anterior**: verificado endpoint por endpoint durante la migración.
- **Doctrina, contratos y convenciones**: documentación interna del proyecto (`docs/`).
