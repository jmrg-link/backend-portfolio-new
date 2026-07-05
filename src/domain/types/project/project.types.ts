/**
 * Datos de creación de un proyecto; id y timestamps los asigna la base de
 * datos.
 */
export interface CreateProjectData {
  slug: string;
  title: string;
  description: string;
  content: string;
  date: Date;
  published?: boolean | undefined;
  featured?: boolean | undefined;
  locale?: string | undefined;
  status?: string | undefined;
  tech?: string[] | undefined;
  github?: string | undefined;
  demo?: string | undefined;
  image?: string | undefined;
  order?: number | undefined;
}

/**
 * Criterios del listado público de proyectos publicados.
 *
 * @remarks
 * Sin `locale` se devuelven todos los idiomas.
 */
export interface FindPublishedOptions {
  locale?: string | undefined;
  skip?: number | undefined;
  limit?: number | undefined;
}
