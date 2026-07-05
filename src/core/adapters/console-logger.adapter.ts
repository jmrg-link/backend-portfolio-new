import type { LoggerPort, LogMeta } from '@domain/shared/logger/logger.port';

/**
 * Implementación de LoggerPort sobre la consola del proceso.
 *
 * @remarks
 * Cada nivel delega en el método homónimo de `console`; los metadatos se
 * emiten como segundo argumento.
 */
export class ConsoleLoggerAdapter implements LoggerPort {
  public debug(message: string, meta?: LogMeta): void {
    console.debug(message, meta ?? '');
  }

  public info(message: string, meta?: LogMeta): void {
    console.info(message, meta ?? '');
  }

  public warn(message: string, meta?: LogMeta): void {
    console.warn(message, meta ?? '');
  }

  public error(message: string, meta?: LogMeta): void {
    console.error(message, meta ?? '');
  }
}
