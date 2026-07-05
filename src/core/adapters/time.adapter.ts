import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

/**
 * Fecha-hora del proceso sobre dayjs: local, UTC e ISO 8601.
 */
export const timeAdapter = {
  /**
   * Fecha-hora actual en la TZ del proceso.
   * @defaultValue formato 'YYYY-MM-DD HH:mm:ss'
   */
  nowLocal(format = 'YYYY-MM-DD HH:mm:ss'): string {
    return dayjs().format(format);
  },

  /**
   * Fecha-hora actual en UTC.
   * @defaultValue formato 'YYYY-MM-DD HH:mm:ss'
   */
  nowUTC(format = 'YYYY-MM-DD HH:mm:ss'): string {
    return dayjs.utc().format(format);
  },

  /**
   * Instante actual en ISO 8601, el formato de fecha del contrato API.
   */
  nowISO(): string {
    return dayjs().toISOString();
  },
} as const;
