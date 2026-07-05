import type { SiteSettingsEntity } from '@domain/entities/site-settings';
import type { HeroContentEntity } from '@domain/entities/hero-content';
import type { AboutContentEntity } from '@domain/entities/about-content';
import type { SkillEntity } from '@domain/entities/skill';
import type { ExperienceEntity } from '@domain/entities/experience';
import type { TestimonialEntity } from '@domain/entities/testimonial';
import type { FindSkillsOptions } from '@domain/types/skill';

/**
 * Contrato de negocio del CMS: lecturas públicas del contenido dinámico del
 * sitio.
 *
 * @remarks
 * Los singleton por locale (settings, hero, about) devuelven null cuando no
 * existen para ese idioma, sin 404.
 */
export interface ICmsService {
  getSiteSettings(locale: string): Promise<SiteSettingsEntity | null>;
  getHero(locale: string): Promise<HeroContentEntity | null>;
  getAbout(locale: string): Promise<AboutContentEntity | null>;
  listSkills(options: FindSkillsOptions): Promise<SkillEntity[]>;
  listExperiences(locale: string): Promise<ExperienceEntity[]>;
  listTestimonials(locale: string): Promise<TestimonialEntity[]>;
}
