/**
 * Comprobación de vida de la base de datos que inyecta el composition
 * root; lanza cuando la conexión no responde.
 */
export type DatabasePing = () => Promise<void>;

/**
 * Salud del slice: accesibilidad del bucket y de la base de datos con
 * marca temporal ISO.
 */
export interface StorageHealth {
  s3: boolean;
  database: boolean;
  timestamp: string;
}
