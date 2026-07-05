import type { SiteSettingsEntity } from '@domain/entities/site-settings';
import type { HeroContentEntity } from '@domain/entities/hero-content';
import type { AboutContentEntity } from '@domain/entities/about-content';
import type { SkillEntity } from '@domain/entities/skill';
import type { ExperienceEntity } from '@domain/entities/experience';
import type { TestimonialEntity } from '@domain/entities/testimonial';
import type { FindSkillsOptions } from '@domain/types/skill';

/**
 * Contrato de acceso a datos de la configuración del sitio: singleton por
 * locale, puede no existir.
 */
export interface ISiteSettingsRepository {
  findByLocale(locale: string): Promise<SiteSettingsEntity | null>;
}

/**
 * Contrato de acceso a datos del contenido del hero: singleton por locale,
 * puede no existir.
 */
export interface IHeroContentRepository {
  findByLocale(locale: string): Promise<HeroContentEntity | null>;
}

/**
 * Contrato de acceso a datos del contenido de About: singleton por locale,
 * puede no existir.
 */
export interface IAboutContentRepository {
  findByLocale(locale: string): Promise<AboutContentEntity | null>;
}

/**
 * Contrato de acceso a datos de skills: listado filtrado por categoría y
 * estado de publicación.
 */
export interface ISkillRepository {
  findFiltered(options: FindSkillsOptions): Promise<SkillEntity[]>;
}

/**
 * Contrato de acceso a datos de experiencias: listado público por locale.
 */
export interface IExperienceRepository {
  findPublished(locale: string): Promise<ExperienceEntity[]>;
}

/**
 * Contrato de acceso a datos de testimonios: listado público por locale.
 */
export interface ITestimonialRepository {
  findPublished(locale: string): Promise<TestimonialEntity[]>;
}
