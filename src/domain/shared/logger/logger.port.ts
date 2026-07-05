/**
 * Metadatos estructurados adjuntos a una entrada de log.
 */
export type LogMeta = Record<string, unknown>;

/**
 * Puerto de logging del dominio.
 *
 * @remarks
 * Los consumidores dependen de esta interfaz; la implementación concreta se
 * inyecta en la composición de la aplicación.
 */
export interface LoggerPort {
  debug(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  error(message: string, meta?: LogMeta): void;
}
