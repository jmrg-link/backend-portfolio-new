import type { IBlogRepository } from '@presentation/blog/repositories';
import type { IProjectRepository } from '@presentation/projects/repositories';
import type { IDashboardService, RecentActivityItem } from './types';

const RECENT_PER_COLLECTION = 5;
const RECENT_TOTAL = 10;

/**
 * Lógica de negocio del dashboard: compone el timeline de actividad
 * reciente mezclando posts y proyectos por última modificación.
 *
 * @remarks
 * Sin filtro de publicación (los borradores también son actividad): 5 + 5
 * por updatedAt descendente, mezcla y top 10.
 */
export class DashboardService implements IDashboardService {
  public constructor(
    private readonly blogRepository: IBlogRepository,
    private readonly projectRepository: IProjectRepository
  ) {}

  public async recentActivity(): Promise<RecentActivityItem[]> {
    const [posts, projects] = await Promise.all([
      this.blogRepository.findRecent(RECENT_PER_COLLECTION),
      this.projectRepository.findRecent(RECENT_PER_COLLECTION),
    ]);

    const activities: RecentActivityItem[] = [
      ...posts.map(post => DashboardService.toActivity('post', post.toEntity())),
      ...projects.map(project => DashboardService.toActivity('project', project.toEntity())),
    ];

    return activities
      .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
      .slice(0, RECENT_TOTAL);
  }

  private static toActivity(
    type: RecentActivityItem['type'],
    entity: {
      _id?: string | undefined;
      slug: string;
      title: string;
      locale: string;
      updatedAt?: Date | undefined;
      published: boolean;
    }
  ): RecentActivityItem {
    return {
      type,
      _id: entity._id,
      slug: entity.slug,
      title: entity.title,
      locale: entity.locale,
      date: entity.updatedAt,
      published: entity.published,
    };
  }
}
