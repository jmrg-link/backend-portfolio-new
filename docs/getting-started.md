# Puesta en marcha

Guía para levantar el backend en local desde cero. Objetivo final: `pnpm dev` sirviendo en `https://localhost:3000` con HTTP/2 y MongoDB conectada.

## Requisitos

| Herramienta | Versión | Notas |
|---|---|---|
| **Node.js** | `>= 24` | El `package.json` fija `engines.node >=24`. |
| **pnpm** | `^11.9` | Gestor obligatorio (`devEngines.packageManager`). `npm`/`yarn` se rechazan. |
| **Docker** | reciente | Para la MongoDB local (replica set). |
| **OpenSSL** | cualquiera | Solo si quieres HTTPS local (certificados autofirmados). |

> El proyecto va por delante del ecosistema habitual (TypeScript 6, Mongoose 9, pnpm 11, `@types/node` 26). Verifica siempre contra los `.d.ts` instalados, nunca de memoria.

## 1. Instalar dependencias

```bash
pnpm install
```

Las dependencias están **fijadas a versión exacta** (sin `^`). Los scripts de build (esbuild, etc.) se autorizan explícitamente en `pnpm-workspace.yaml` vía `allowBuilds` (pnpm 11 los bloquea por defecto).

## 2. Levantar MongoDB

MongoDB corre como **replica set de un nodo** (`rs0`), necesario para transacciones y para el futuro event store de Emmett.

```bash
docker compose up -d
```

Esto arranca el contenedor `portfolio-mongodb` (imagen `mongo:8.0`) en el puerto `27017`. El healthcheck inicializa `rs0` automáticamente anunciando `localhost:27017`, de modo que puedes conectar desde el host sin `directConnection`.

- **URI local**: `mongodb://localhost:27017/portfolio?replicaSet=rs0`
- El nombre de la base (`portfolio`) lo decide la URI, no el código.
- Datos: el volumen `mongodb-data` persiste entre reinicios.

## 3. Configurar el entorno

El loader lee `.env.${NODE_ENV}` con `override: true`. Con `NODE_ENV=local` (por defecto) lee **`.env.local`**. Copia la plantilla y rellénala:

```bash
cp .env.example .env.local
```

> ⚠️ Los ficheros `.env*` están **denegados a las herramientas** y gitignorados. Nunca se commitean secretos; la única plantilla versionada es `.env.example` (con placeholders).

### Variables

Validadas con Zod al arrancar (**fail-fast**: si falta o es inválida una requerida, el proceso muere con un error legible antes de escuchar).

**Servidor**

| Variable | Requerida | Default | Descripción |
|---|---|---|---|
| `PORT` | no | `3000` | Puerto HTTP. |
| `HOST` | no | `0.0.0.0` | Interfaz de escucha. |
| `NODE_ENV` | no | `local` | `local` · `development` · `staging` · `production` · `test`. |
| `API_PREFIX` | no | `/api` | Prefijo base. Debe empezar por `/`. |
| `API_VERSION` | no | `v1` | Versión → las rutas de negocio cuelgan de `/api/v1`. |
| `CORS_ORIGINS` | no | `` (vacío) | CSV de orígenes permitidos. Vacío = ninguno. |
| `TLS_CERT_PATH` | no | — | PEM del certificado. Con cert **y** key → HTTPS + HTTP/2 (ALPN). |
| `TLS_KEY_PATH` | no | — | PEM de la clave privada. |

**MongoDB**

| Variable | Requerida | Descripción |
|---|---|---|
| `MONGODB_URI` | **sí** | URI de conexión (incluye la base). |

**Clerk** (autenticación)

| Variable | Requerida | Default | Descripción |
|---|---|---|---|
| `CLERK_PUBLISHABLE_KEY` | **sí** | — | Empieza por `pk_`. |
| `CLERK_SECRET_KEY` | **sí** | — | Empieza por `sk_`. |
| `CLERK_JWKS_URL` | **sí** | — | JWKS (RS256) para verificar sesiones. |
| `CLERK_BACKEND_API_URL` | no | `https://api.clerk.com` | Backend API. |
| `CLERK_FRONTEND_API_URL` | no | — | Opcional. |
| `CLERK_PUBLIC_KEY` | no | — | PEM para verificación offline (alternativa/complemento al JWKS). |
| `ADMIN_EMAIL_ALLOWLIST` | no | `info@jmrg.dev,@jmrg.dev` | CSV. Una entrada `@dominio` autoriza el dominio completo; el resto exige email exacto. |

**S3** (almacenamiento — OVH / AWS / MinIO / LocalStack)

| Variable | Requerida | Default | Descripción |
|---|---|---|---|
| `AWS_REGION` | no | `eu-west-1` | Región. |
| `AWS_S3_BUCKET` | no | — | Sin bucket, el slice storage responde `503`. |
| `AWS_ACCESS_KEY_ID` | no | — | Si faltan, el SDK usa su cadena de proveedores. |
| `AWS_SECRET_ACCESS_KEY` | no | — | |
| `AWS_S3_ENDPOINT` | no | — | Solo para endpoints custom (MinIO/LocalStack). |
| `AWS_S3_FORCE_PATH_STYLE` | no | `false` | `true` para path-style addressing. |

**Loki** (logging, solo staging/producción)

| Variable | Requerida | Descripción |
|---|---|---|
| `LOKI_HOST` | no | URL de ingesta de Grafana Loki. |

## 4. Certificados HTTPS locales (opcional pero recomendado)

Sin TLS el servidor habla **h2c** (HTTP/2 cleartext), que **los navegadores no soportan** (Chrome devuelve `ERR_INVALID_HTTP_RESPONSE`); h2c solo sirve para `curl --http2-prior-knowledge` o detrás de Traefik. Para probar desde el navegador, genera certificados autofirmados:

```bash
mkdir -p certs
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 \
  -keyout certs/localhost-key.pem -out certs/localhost.pem \
  -days 365 -nodes -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
```

Y apúntalos en `.env.local`:

```dotenv
TLS_CERT_PATH=certs/localhost.pem
TLS_KEY_PATH=certs/localhost-key.pem
```

> `certs/` está gitignorado. Los certificados reales los gestiona el despliegue.

## 5. Arrancar

```bash
pnpm dev        # tsx watch: recarga en caliente
```

Comprueba que responde (cert autofirmado → `-k`):

```bash
curl -sk --http2 https://localhost:3000/api/health
# {"status":"ok","service":"backend-portfolio","timestamp":"...","uptime":...}
```

`GET /api/health` y `OPTIONS` son las **únicas** rutas exentas de token. Todo lo demás exige un token Clerk válido — ninguna ruta es de acceso libre (ver [security.md](./security.md)).

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor en modo watch (`tsx`). |
| `pnpm build` | Build de producción (Vite). |
| `pnpm start` | Ejecuta el build (`node dist/main.js`). |
| `pnpm typecheck` | `tsc --noEmit`. **Debe dar 0 siempre.** |
| `pnpm lint` / `pnpm lint:fix` | ESLint 10 flat + typescript-eslint. **0 siempre.** |
| `pnpm test` / `pnpm test:watch` | Suite funcional (Vitest + `app.inject` contra la Mongo local). |
| `pnpm format` / `pnpm format:check` | Prettier. |

## Problemas frecuentes

- **`Invalid env (...)` al arrancar** → falta una variable requerida en `.env.local`. El mensaje indica el subsistema y los campos.
- **El navegador no conecta** → estás en h2c; configura los certificados TLS (paso 4).
- **`MongoServerError` / no conecta a Mongo** → el contenedor no está sano aún; espera al healthcheck (`docker ps` debe mostrar `healthy`) o revisa `MONGODB_URI`.
- **`EBADDEVENGINES`** → estás usando `npm`/`npx` en vez de `pnpm`; el proyecto solo admite pnpm.

Siguiente lectura: [architecture.md](./architecture.md).
