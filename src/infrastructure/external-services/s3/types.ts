/**
 * URL prefirmada de subida con su clave y caducidad en segundos.
 */
export interface PresignedUploadResult {
  uploadUrl: string;
  key: string;
  expiresIn: number;
}

/**
 * Objeto listado del bucket.
 */
export interface StorageObject {
  key: string;
  size: number;
  lastModified: Date;
}

/**
 * Página de listado no recursivo: objetos del nivel, carpetas
 * (CommonPrefixes) y token de continuación cuando hay más resultados.
 */
export interface ListObjectsResult {
  objects: StorageObject[];
  folders: string[];
  nextToken?: string | undefined;
  prefix: string;
}

/**
 * Criterios del listado de objetos.
 */
export interface ListObjectsOptions {
  prefix: string;
  continuationToken?: string | undefined;
  maxKeys: number;
}

/**
 * Recuento recursivo bajo un prefijo: total de objetos y bytes.
 */
export interface CountObjectsResult {
  prefix: string;
  totalObjects: number;
  totalBytes: number;
}

/**
 * Resultado del borrado masivo: cuántas claves se borraron, cuántas
 * fallaron y el total solicitado.
 */
export interface BulkDeleteResult {
  deleted: number;
  failed: number;
  total: number;
}

/**
 * Contrato del almacenamiento de objetos: los services dependen de esta
 * interfaz, nunca del adapter concreto.
 */
export interface IStorageAdapter {
  getUploadUrl(key: string, contentType: string): Promise<PresignedUploadResult>;
  getDownloadUrl(key: string): Promise<string>;
  deleteObject(key: string): Promise<void>;
  bulkDelete(keys: string[]): Promise<BulkDeleteResult>;
  listObjects(options: ListObjectsOptions): Promise<ListObjectsResult>;
  countObjects(prefix: string): Promise<CountObjectsResult>;
  copyObject(sourceKey: string, destKey: string): Promise<void>;
  healthCheck(): Promise<boolean>;
}
