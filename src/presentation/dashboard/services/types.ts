/**
 * Elemento del timeline de actividad reciente: post o proyecto proyectado
 * a una forma común, ordenado por última modificación.
 *
 * @remarks
 * `date` es el updatedAt del documento; `_id` es la clave primaria del
 * documento.
 */
export interface RecentActivityItem {
  type: 'post' | 'project';
  _id: string | undefined;
  slug: string;
  title: string;
  locale: string;
  date: Date | undefined;
  published: boolean;
}

/**
 * Contrato de negocio del dashboard de administración.
 */
export interface IDashboardService {
  recentActivity(): Promise<RecentActivityItem[]>;
}
