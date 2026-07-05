import type { Model } from 'mongoose';
import { BaseRepository } from '@infrastructure/dbs/repositories/base.repository';
import { SkillEntity, type ISkill } from '@domain/entities/skill';
import type { FindSkillsOptions } from '@domain/types/skill';
import type { ISkillRepository } from './types';

/**
 * Acceso a datos de skills sobre la colección `skills`.
 *
 * @remarks
 * El listado ordena por categoría y por orden dentro de ella.
 */
export class SkillRepository
  extends BaseRepository<ISkill, SkillEntity>
  implements ISkillRepository
{
  public constructor(model: Model<ISkill>) {
    super(model);
  }

  public async findFiltered(options: FindSkillsOptions): Promise<SkillEntity[]> {
    const { category, published } = options;
    return this.findMany({
      filter: { published, ...(category !== undefined && { category }) },
      sort: { category: 1, order: 1 },
    });
  }

  protected buildEntity(props: ISkill): SkillEntity {
    return new SkillEntity(props);
  }
}
