import type { SiteSettingsEntity } from '@domain/entities/site-settings';
import type { HeroContentEntity } from '@domain/entities/hero-content';
import type { AboutContentEntity } from '@domain/entities/about-content';
import type { SkillEntity } from '@domain/entities/skill';
import type { ExperienceEntity } from '@domain/entities/experience';
import type { TestimonialEntity } from '@domain/entities/testimonial';
import type { FindSkillsOptions } from '@domain/types/skill';
import type {
  IAboutContentRepository,
  IExperienceRepository,
  IHeroContentRepository,
  ISiteSettingsRepository,
  ISkillRepository,
  ITestimonialRepository,
} from '../repositories';
import type { ICmsService } from './types';

/**
 * Lógica de negocio del CMS: lecturas públicas del contenido dinámico sobre
 * los repositorios de cada colección.
 */
export class CmsService implements ICmsService {
  public constructor(
    private readonly siteSettingsRepository: ISiteSettingsRepository,
    private readonly heroContentRepository: IHeroContentRepository,
    private readonly aboutContentRepository: IAboutContentRepository,
    private readonly skillRepository: ISkillRepository,
    private readonly experienceRepository: IExperienceRepository,
    private readonly testimonialRepository: ITestimonialRepository
  ) {}

  public async getSiteSettings(locale: string): Promise<SiteSettingsEntity | null> {
    return this.siteSettingsRepository.findByLocale(locale);
  }

  public async getHero(locale: string): Promise<HeroContentEntity | null> {
    return this.heroContentRepository.findByLocale(locale);
  }

  public async getAbout(locale: string): Promise<AboutContentEntity | null> {
    return this.aboutContentRepository.findByLocale(locale);
  }

  public async listSkills(options: FindSkillsOptions): Promise<SkillEntity[]> {
    return this.skillRepository.findFiltered(options);
  }

  public async listExperiences(locale: string): Promise<ExperienceEntity[]> {
    return this.experienceRepository.findPublished(locale);
  }

  public async listTestimonials(locale: string): Promise<TestimonialEntity[]> {
    return this.testimonialRepository.findPublished(locale);
  }
}
