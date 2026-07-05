import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({
  path: `.env.${process.env.NODE_ENV ?? 'local'}`,
  override: true,
});

/**
 * Convierte el string vacío en undefined antes de validar.
 *
 * @remarks
 * Un `.env` con `KEY=` sin valor entrega `""`; sin esta transformación los
 * opcionales con formato (`.url()`, longitudes mínimas) fallarían.
 */
const emptyToUndefined = z.string().transform(v => (v.trim() === '' ? undefined : v));

/**
 * Entorno del servidor HTTP.
 *
 * @remarks
 * `CORS_ORIGINS` es un CSV de orígenes permitidos (vacío = ninguno).
 * `TLS_CERT_PATH` + `TLS_KEY_PATH` (PEM): con ambos presentes Fastify sirve
 * HTTPS + HTTP/2 nativo (ALPN); sin ellos, HTTP/2 cleartext (h2c) tras
 * Traefik.
 */
const ServerSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['local', 'development', 'staging', 'production', 'test']).default('local'),
  API_PREFIX: z.string().startsWith('/').default('/api'),
  API_VERSION: z.string().default('v1'),
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform(v =>
      v
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    ),
  TLS_CERT_PATH: emptyToUndefined.optional(),
  TLS_KEY_PATH: emptyToUndefined.optional(),
});

/**
 * Conexión a MongoDB; el nombre de la base de datos viaja en la URI.
 */
const MongoSchema = z.object({
  MONGODB_URI: z.url(),
});

/**
 * Credenciales y endpoints de Clerk.
 *
 * @remarks
 * La sesión se verifica con el JWKS (RS256) de `CLERK_JWKS_URL`; la clave
 * pública PEM es alternativa o complemento para verificación offline.
 * `ADMIN_EMAIL_ALLOWLIST` acota quién es administrador: lista separada por
 * comas donde las entradas `@dominio` autorizan el dominio completo y el
 * resto exige el email exacto.
 */
const ClerkSchema = z.object({
  CLERK_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  CLERK_SECRET_KEY: z.string().startsWith('sk_'),
  CLERK_JWKS_URL: z.url(),
  CLERK_BACKEND_API_URL: z.url().default('https://api.clerk.com'),
  CLERK_FRONTEND_API_URL: emptyToUndefined.optional().pipe(z.url().optional()),
  CLERK_PUBLIC_KEY: emptyToUndefined.optional(),
  ADMIN_EMAIL_ALLOWLIST: z
    .string()
    .default('info@jmrg.dev,@jmrg.dev')
    .transform(list =>
      list
        .split(',')
        .map(entry => entry.trim().toLowerCase())
        .filter(entry => entry.length > 0)
    ),
});

/**
 * Almacenamiento S3 (OVH / AWS / LocalStack / MinIO).
 *
 * @remarks
 * Las credenciales son opcionales: sin `AWS_ACCESS_KEY_ID/SECRET` el SDK
 * aplica su cadena de proveedores (variables exportadas, `AWS_PROFILE`,
 * instance role). `AWS_S3_ENDPOINT` solo para endpoints custom
 * (LocalStack/MinIO), y `AWS_S3_FORCE_PATH_STYLE=true` cuando ese endpoint
 * exige path-style addressing.
 */
const S3Schema = z.object({
  AWS_REGION: z.string().default('eu-west-1'),
  AWS_S3_BUCKET: emptyToUndefined.optional(),
  AWS_ACCESS_KEY_ID: emptyToUndefined.optional(),
  AWS_SECRET_ACCESS_KEY: emptyToUndefined.optional(),
  AWS_S3_ENDPOINT: emptyToUndefined.optional().pipe(z.url().optional()),
  AWS_S3_FORCE_PATH_STYLE: z
    .string()
    .default('false')
    .transform(v => v === 'true'),
});

/**
 * Ingesta de logs en Grafana Loki (solo staging/producción).
 */
const LokiSchema = z.object({
  LOKI_HOST: emptyToUndefined.optional().pipe(z.url().optional()),
});

/**
 * Valida un grupo de variables contra `process.env` y detiene el proceso si
 * la validación falla.
 */
function parseOrDie<T extends z.ZodTypeAny>(schema: T, label: string): z.infer<T> {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error(`❌ Invalid env (${label}):`, parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

const server = parseOrDie(ServerSchema, 'server');
const mongo = parseOrDie(MongoSchema, 'mongo');
const clerk = parseOrDie(ClerkSchema, 'clerk');
const s3 = parseOrDie(S3Schema, 's3');
const loki = parseOrDie(LokiSchema, 'loki');

/**
 * Entorno validado y agrupado por subsistema; el consumidor accede como
 * `env.server.port` o `env.mongo.uri` en lugar de SCREAMING_SNAKE suelto.
 */
export const env = Object.freeze({
  server: {
    port: server.PORT,
    host: server.HOST,
    nodeEnv: server.NODE_ENV,
    apiPrefix: server.API_PREFIX,
    apiVersion: server.API_VERSION,
    corsOrigins: server.CORS_ORIGINS,
    isProduction: server.NODE_ENV === 'production',
    isStaging: server.NODE_ENV === 'staging',
    isDevelopment: server.NODE_ENV === 'development' || server.NODE_ENV === 'local',
    isTest: server.NODE_ENV === 'test',
    tls: {
      certPath: server.TLS_CERT_PATH,
      keyPath: server.TLS_KEY_PATH,
      enabled: Boolean(server.TLS_CERT_PATH && server.TLS_KEY_PATH),
    },
  },
  mongo: {
    uri: mongo.MONGODB_URI,
  },
  clerk: {
    publishableKey: clerk.CLERK_PUBLISHABLE_KEY,
    secretKey: clerk.CLERK_SECRET_KEY,
    jwksUrl: clerk.CLERK_JWKS_URL,
    backendApiUrl: clerk.CLERK_BACKEND_API_URL,
    frontendApiUrl: clerk.CLERK_FRONTEND_API_URL,
    publicKey: clerk.CLERK_PUBLIC_KEY,
    adminEmailAllowlist: clerk.ADMIN_EMAIL_ALLOWLIST,
  },
  s3: {
    region: s3.AWS_REGION,
    bucket: s3.AWS_S3_BUCKET,
    accessKeyId: s3.AWS_ACCESS_KEY_ID,
    secretAccessKey: s3.AWS_SECRET_ACCESS_KEY,
    endpoint: s3.AWS_S3_ENDPOINT,
    forcePathStyle: s3.AWS_S3_FORCE_PATH_STYLE,
    isConfigured: Boolean(s3.AWS_S3_BUCKET),
  },
  loki: {
    host: loki.LOKI_HOST,
  },
});

export type Env = typeof env;
