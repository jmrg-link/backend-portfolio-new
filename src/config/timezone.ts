/**
 * Fija la zona horaria del proceso ANTES de que cualquier módulo lea fechas.
 * Debe ser el PRIMER import de main.ts.
 */
process.env.TZ = 'Europe/Madrid';

export {};
