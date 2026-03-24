import type { DashboardServiceClient } from '../client.js';
import type { DashboardProject } from '../../../schemas/dashboard/index.js';

export async function getProjects(client: DashboardServiceClient, active?: boolean): Promise<DashboardProject[]> {
  const qs = active !== undefined ? `?active=${active}` : '?active=false';
  const raw = await client.request<unknown>(`/projects${qs}`);

  if (!Array.isArray(raw)) {
    return [];
  }
  return raw as DashboardProject[];
}
