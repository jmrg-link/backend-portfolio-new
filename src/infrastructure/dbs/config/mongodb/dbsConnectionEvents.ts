import type { Connection } from 'mongoose';
import ansiColors from 'chalk';

/**
 * Registra los eventos del ciclo de vida de una conexión MongoDB con salida
 * coloreada por consola (conexión, error, desconexión y reconexión).
 */
export function setupConnectionEvents(connection: Connection, dbName: string): void {
  connection.on('connected', () => {
    console.log(ansiColors.green(`✓ Connected to ${dbName}`));
  });

  connection.on('error', err => {
    console.error(ansiColors.red(`✗ ${dbName} connection error:`), err);
  });

  connection.on('disconnected', () => {
    console.log(ansiColors.yellow(`⚠ Disconnected from ${dbName}`));
  });

  connection.on('reconnected', () => {
    console.log(ansiColors.green(`✓ Reconnected to ${dbName}`));
  });
}
