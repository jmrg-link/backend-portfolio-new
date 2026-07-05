import { timeAdapter } from '../adapters/time.adapter';

/**
 * Marca de arranque del proceso en hora local (TZ del proceso).
 */
export const startupTimeLocal = timeAdapter.nowLocal();

/**
 * Marca de arranque del proceso en UTC.
 */
export const startupTimeUTC = timeAdapter.nowUTC();
