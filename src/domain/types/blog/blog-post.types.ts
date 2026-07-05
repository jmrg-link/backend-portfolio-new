/**
 * Datos de creación de un post; id y timestamps los asigna la base de datos.
 */
export interface CreateBlogPostData {
  slug: string;
  title: string;
  description: string;
  content: string;
  date: Date;
  published?: boolean | undefined;
  featured?: boolean | undefined;
  locale?: string | undefined;
  tags?: string[] | undefined;
  image?: string | undefined;
  author?: string | undefined;
  readingTime?: number | undefined;
}

/**
 * Cambio parcial de un post: solo los campos presentes se actualizan.
 *
 * @remarks
 * `slug`, `author` y `locale` no son editables; `readingTime` lo recalcula
 * el service cuando cambia `content`.
 */
export interface UpdateBlogPostData {
  title?: string | undefined;
  description?: string | undefined;
  content?: string | undefined;
  date?: Date | undefined;
  published?: boolean | undefined;
  featured?: boolean | undefined;
  tags?: string[] | undefined;
  image?: string | undefined;
  readingTime?: number | undefined;
}

/**
 * Criterios del listado público de posts publicados.
 *
 * @remarks
 * Sin `locale` se devuelven todos los idiomas.
 */
export interface FindPublishedOptions {
  locale?: string | undefined;
  skip?: number | undefined;
  limit?: number | undefined;
}
