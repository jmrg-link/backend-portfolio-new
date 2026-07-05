import { BaseEntity } from '@domain/shared/entities';

/**
 * Forma de un post del blog: se inyecta en el modelo Mongoose
 * (`Schema<IBlogPost>`) y la consume la entidad.
 *
 * @remarks
 * Corresponde a la colección `blogposts`; los opcionales pueden persistir
 * como null. `content` se omite en las lecturas de listado (proyección
 * meta) y solo viaja en la lectura por slug.
 */
export interface IBlogPost {
  _id?: string;
  slug: string;
  title: string;
  description: string;
  content?: string;
  date: Date;
  published: boolean;
  featured: boolean;
  locale: string;
  tags: string[];
  image?: string | null;
  author: string;
  readingTime?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Entidad pura de BlogPost; copia también su colección `tags` al
 * representarse.
 */
export class BlogPostEntity extends BaseEntity<IBlogPost> {
  public override toEntity(): IBlogPost {
    return { ...this.props, tags: [...this.props.tags] };
  }
}
