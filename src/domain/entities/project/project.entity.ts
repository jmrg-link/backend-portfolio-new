import { BaseEntity } from '@domain/shared/entities';

/**
 * Forma de un proyecto del portfolio: se inyecta en el modelo Mongoose
 * (`Schema<IProject>`) y la consume la entidad.
 *
 * @remarks
 * Corresponde a la colección `projects`; los opcionales pueden persistir
 * como null. `content` se omite en las lecturas de listado (proyección
 * meta) y solo viaja en la lectura por slug.
 */
export interface IProject {
  _id?: string;
  slug: string;
  title: string;
  description: string;
  content?: string;
  date: Date;
  published: boolean;
  featured: boolean;
  locale: string;
  status: string;
  tech: string[];
  github?: string | null;
  demo?: string | null;
  image?: string | null;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Entidad pura de Project; copia también su colección `tech` al
 * representarse.
 */
export class ProjectEntity extends BaseEntity<IProject> {
  public override toEntity(): IProject {
    return { ...this.props, tech: [...this.props.tech] };
  }
}
