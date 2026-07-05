import mongoose, { type ConnectOptions, type Connection } from 'mongoose';
import ansiColors from 'chalk';
import { setupConnectionEvents } from './dbsConnectionEvents';

const defaultOptions: ConnectOptions = {
  family: 4,
  retryWrites: true,
};

/**
 * Fachada de conexiones MongoDB del backend: crea, expone y cierra la
 * conexión principal (`portfolioDb`).
 *
 * @remarks
 * El nombre de la base de datos lo decide la URI. Las opciones recibidas se
 * combinan sobre las por defecto (IPv4, retryWrites), lo que permite ajustar
 * por entorno — p. ej. `autoIndex` activo solo fuera de producción.
 */
export class DatabaseConnector {
  private static portfolioDb: Connection;

  /**
   * Abre la conexión principal y espera hasta que esté disponible.
   */
  public static async initialize(mongoUri: string, options?: ConnectOptions): Promise<void> {
    console.log(ansiColors.blue('Connecting to MongoDB...'));

    this.portfolioDb = mongoose.createConnection(mongoUri, {
      ...defaultOptions,
      ...options,
    });

    setupConnectionEvents(this.portfolioDb, 'portfolio');
    await this.portfolioDb.asPromise();
  }

  /**
   * Cierra la conexión principal.
   */
  public static async disconnect(): Promise<void> {
    await this.portfolioDb.close();
  }

  /**
   * Devuelve la conexión principal ya inicializada.
   *
   * @throws {Error} si la conexión no está inicializada.
   */
  public static getPortfolioDb(): Connection {
    if (!this.portfolioDb) {
      throw new Error('Portfolio database connection not initialized');
    }
    return this.portfolioDb;
  }
}
