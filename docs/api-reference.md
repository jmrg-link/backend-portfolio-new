# Referencia de la API

Migración del portfolio original (tRPC + Prisma) a **REST** sobre la misma MongoDB, sin migración de datos.

- **Base**: `API_PREFIX` + `API_VERSION` → **`/api/v1`**. La salud (`/api/health`) cuelga del prefijo base, fuera de `v1`.
- **Fechas**: ISO 8601 (sin SuperJSON).
- **Errores**: Problem Details (RFC 9457) — ver [error-handling.md](./error-handling.md).
- **Lecturas por `slug`**, **mutaciones por `id`** (ObjectId). `locale` viaja por querystring en las lecturas.
- **Clave primaria**: se sirve como **`_id`** (divergencia consciente con el viejo, que exponía `id` mapeado por Prisma).

## Autenticación

> **API completamente privada** (decisión del owner). El `apiGuard` global exige un token Clerk válido — `session_token`, `api_key` o `m2m_token` — en **toda** ruta salvo `GET /api/health` y `OPTIONS` (preflight). Sin token → `401 'No estas autenticado'`.

- **Ninguna ruta es de acceso libre**: todas exigen token. La columna **Servicio** son las rutas que no requieren *sesión de administrador* — el frontend del propio dominio las consume con su **token de servicio** (API key / m2m).
- Las rutas **`/admin/*`** exigen además **sesión de usuario** con email en `ADMIN_EMAIL_ALLOWLIST` → `403 'Acceso restringido a administradores'` fuera de ella. Las API keys y los tokens m2m **nunca** administran.

Detalle completo en [security.md](./security.md).

## Estado de implementación

| Símbolo | Significado |
|---|---|
| ✅ | Implementado y verificado en vivo. |
| 🔒 | Ruta registrada y protegida por `adminGuard`; **CRUD pendiente** (tanda admin). |
| ⏳ | Planificado (aún no existe la ruta). |

---

## Rutas de servicio (token del dominio · sin sesión de admin)

| Estado | Método y ruta | Origen tRPC | Notas |
|---|---|---|---|
| ✅ | `GET /api/health` | — (nuevo) | Sin token. `{status, service, timestamp, uptime}`. |
| ✅ | `GET /blog?locale=` | `blog.list` | Sin `locale` → **ambos idiomas**. Proyección meta (sin `content`). |
| ✅ | `GET /blog/:slug?locale=` | `blog.bySlug` | `locale` default `es`. 404 `'Post no encontrado'`. |
| ✅ | `GET /projects?locale=` | `projects.list` | Sin `locale` → ambos idiomas. Orden `{order:1, date:-1}`. Meta sin `content`. |
| ✅ | `GET /projects/featured?locale=` | `projects.featured` | Filtra `published + featured`. |
| ✅ | `GET /projects/:slug?locale=` | `projects.bySlug` | Exige `published`. 404 `'Proyecto no encontrado'`. |
| ✅ | `GET /cms/site-settings?locale=` | `cms.siteSettings.get` | Singleton; inexistente → `null` con `200`. |
| ✅ | `GET /cms/hero?locale=` | `cms.hero.get` | Singleton; default `es`. |
| ✅ | `GET /cms/about?locale=` | `cms.about.get` | Singleton; default `es`. |
| ✅ | `GET /cms/skills?category=&published=` | `cms.skills.list` | **Sin `locale`** (compartidas). `published` default `true`. Orden `{category:1, order:1}`. |
| ✅ | `GET /cms/experiences?locale=` | `cms.experiences.list` | `published:true` fijo. Orden `{order:1}`. |
| ✅ | `GET /cms/testimonials?locale=` | `cms.testimonials.list` | `published:true` fijo. Orden `{order:1}`. |
| ✅ | `GET /storage/download-url?key=` | `storage.getDownloadUrl` | Exige token; la **URL presigned** que devuelve (GET 3600 s) la usa quien la posea. |
| ⏳ | `POST /contact` | server action | Rate-limit 5/h por IP → Turnstile → email (Mailtrap). |

## Rutas de administración (`/admin/*` — sesión Clerk + allowlist)

### Blog

| Estado | Método y ruta | Origen tRPC |
|---|---|---|
| 🔒 | `GET /admin/blog` · `GET /admin/blog/:slug` | `blog.adminList` · `blog.adminBySlug` |
| 🔒 | `POST /admin/blog` · `PATCH /admin/blog/:id` · `DELETE /admin/blog/:id` | `blog.create/update/delete` |
| 🔒 | `POST /admin/blog/:id/toggle-published` | `blog.togglePublished` |

### Projects

| Estado | Método y ruta | Origen tRPC |
|---|---|---|
| 🔒 | `GET /admin/projects` · `GET /admin/projects/:slug` | `projects.adminList/adminBySlug` |
| 🔒 | `POST /admin/projects` · `PATCH /admin/projects/:id` · `DELETE /admin/projects/:id` | `projects.create/update/delete` |
| 🔒 | `POST /admin/projects/:id/toggle-published` · `.../toggle-featured` | `projects.togglePublished/toggleFeatured` |

### CMS

| Estado | Método y ruta | Origen tRPC |
|---|---|---|
| 🔒 | `PUT /admin/cms/site-settings` · `PATCH /admin/cms/site-settings` | `cms.siteSettings.upsert/update` |
| 🔒 | `PUT /admin/cms/hero` · `PATCH /admin/cms/hero` | `cms.hero.upsert/update` |
| 🔒 | `PUT /admin/cms/about` · `PATCH /admin/cms/about` | `cms.about.upsert/update` |
| 🔒 | `GET/POST /admin/cms/skills` · `PATCH/DELETE /admin/cms/skills/:id` · `POST /admin/cms/skills/reorder` | `cms.skills.*` |
| 🔒 | `GET/POST /admin/cms/experiences` · `PATCH/DELETE .../:id` · `POST .../reorder` | `cms.experiences.*` |
| 🔒 | `GET/POST /admin/cms/testimonials` · `PATCH/DELETE .../:id` · `POST .../reorder` | `cms.testimonials.*` |

### Storage

| Estado | Método y ruta | Origen tRPC |
|---|---|---|
| ✅ | `POST /admin/storage/upload-url` | `storage.getUploadUrl` (PUT 900 s; MIME `png/jpeg/webp/avif`; key regex) |
| ✅ | `GET /admin/storage/objects` · `GET /admin/storage/objects/count` | `storage.listObjects/countObjects` |
| ✅ | `POST /admin/storage/objects/copy` · `DELETE /admin/storage/objects?key=` · `POST /admin/storage/objects/bulk-delete` | `storage.copyObject/deleteObject/bulkDelete` (bulk máx 20) |
| ✅ | `POST /admin/storage/notify-upload` · `GET /admin/storage/health` | `storage.notifyUpload/healthCheck` |

### Dashboard, auth y settings

| Estado | Método y ruta | Origen tRPC |
|---|---|---|
| ✅ | `GET /admin/dashboard/recent-activity` | `dashboard.recentActivity` — 5 posts + 5 projects por `updatedAt` desc → top 10 |
| ✅ | `GET /auth/me` | identidad de la petición `{tokenType, userId, email}` |
| ⏳ | `GET /admin/settings/infra` | `settings.infraInfo` |

### Usuarios (`/admin/users` · Clerk Backend API)

| Estado | Método y ruta | Descripción |
|---|---|---|
| ✅ | `GET /admin/users?limit=&offset=&query=` | Listar usuarios (paginación de Clerk: `{data, totalCount}`). |
| ✅ | `GET /admin/users/count?query=` | Total de usuarios. |
| ✅ | `GET /admin/users/:id` | Usuario por id (`404` si no existe). |
| ✅ | `POST /admin/users` | Alta administrativa (email + perfil + `publicMetadata`); `201`. |
| ✅ | `PATCH /admin/users/:id` | Actualiza perfil y/o `publicMetadata`. |
| ✅ | `DELETE /admin/users/:id` | Borra el usuario (`204`). |
| ✅ | `GET /admin/users/invitations?status=` | Listar invitaciones. |
| ✅ | `POST /admin/users/invitations` | Invitar (el alta se completa en la plataforma); `201`. |
| ✅ | `DELETE /admin/users/invitations/:id` | Revocar invitación. |

> Todo bajo `adminGuard`. **No hay alta pública**: el registro es admin (alta directa) o por invitación. Los errores de Clerk se traducen (un 4xx conserva su código; un fallo de red responde `502`).

## Paginación (opt-in por querystring)

El `paginationMiddleware` se acopla por ruta en los listados:

- **Sin `page` ni `limit`** → **array plano** (paridad con el viejo, que no paginaba).
- **Con cualquiera de los dos** → envelope `{ data, meta }`.

```jsonc
{
  "data": [ /* ... */ ],
  "meta": {
    "page": 2,
    "limit": 10,
    "countTotal": 42,
    "nextPage": true,    // boolean: existe página siguiente
    "previousPage": true // boolean: false en la primera
  }
}
```

Clamps silenciosos: `page ≥ 1`, `limit 1..100` (default 10). `countTotal` sale de `countDocuments` (en `Promise.all` con la consulta).

## Convenciones de respuesta

- `201` + cabecera `Location` al crear; `204` sin cuerpo en deletes/reorder; los toggles devuelven la **entidad actualizada** (`200`).
- Colecciones: array JSON directo (sin envelope, salvo paginación activa).
- La validación de entrada vive en las **clases DTO** (`domain/dtos/<entidad>/`, Zod), portadas del schema del viejo (mismos nombres y límites).

### Divergencias conscientes con el portfolio original

- tRPC devolvía `{success:true, message}` en deletes y `{success:true, published|featured}` en toggles → este backend usa **semántica REST** (`204` / entidad completa). El frontend nuevo se construye contra **este** contrato.
- La clave primaria viaja como **`_id`** (no `id`).
- `locale` en `bySlug` tiene **default `es`** (el viejo respondía `400` sin él).
- **404 de `bySlug`** con literal canónico único (el viejo distinguía inexistente de despublicado).
- **Proyección meta**: `GET /blog`, `GET /admin/blog`, `GET /projects` y `GET /projects/featured` sirven documentos **sin `content`**; `content` solo en lecturas por slug.

## Fidelidad verificada (comportamientos a replicar)

- **Asimetría de locale**: `blog.list`, `projects.list`, `projects.featured` sin `locale` → **ambos idiomas**; `cms.{siteSettings,hero,about}.get` y `experiences/testimonials.list` caen **siempre** al default `es`.
- **CMS singleton inexistente = `null` con `200`** (sin `NOT_FOUND`).
- **`readingTime`** lo calcula el servidor: `Math.ceil(palabras/200)` al crear; se recalcula en update **solo** si cambia `content`. El cliente nunca lo envía.
- **Update de blog** ignora `author`, `locale`, `readingTime`; update de projects ignora `locale`; **`slug` no es editable**.
- **Espejado ES↔EN** en updates/toggles (workflow, use-case): blog propaga `image, featured, published, date, tags`; projects además `tech, status, github, demo, order`. Nunca `title/description/content`.
- **Defaults de creación**: blog `published:false, featured:false, tags:[], author:'JMRG'`; projects `status:'completed', tech:[], order:0`.
- **Errores literales**: `'Post no encontrado'` · `'Proyecto no encontrado'` · `'Experiencia no encontrada'` · `'Testimonio no encontrado'`.

> El contrato se fijó durante la migración verificando el comportamiento del portfolio original endpoint por endpoint.
