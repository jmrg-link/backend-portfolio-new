/**
 * Criterios del listado público de skills.
 *
 * @remarks
 * Sin `category` se devuelven todas las categorías; `published` siempre
 * llega resuelto (por defecto true desde el DTO).
 */
export interface FindSkillsOptions {
  category?: string | undefined;
  published: boolean;
}
