import { BaseEntity } from '@domain/shared/entities';

/**
 * Forma de una experiencia laboral: se inyecta en el modelo Mongoose
 * (`Schema<IExperience>`) y la consume la entidad.
 *
 * @remarks
 * Corresponde a la colección `experiences`; única por locale+company.
 * `color` es una clave de estilo del frontend (navy, success, warning,
 * info, professional).
 */
export interface IExperience {
  _id?: string;
  locale: string;
  company: string;
  position: string;
  period: string;
  tasks: string[];
  color: string;
  order: number;
  published: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Entidad pura de Experience; copia también su colección `tasks` al
 * representarse.
 */
export class ExperienceEntity extends BaseEntity<IExperience> {
  public override toEntity(): IExperience {
    return { ...this.props, tasks: [...this.props.tasks] };
  }
}
