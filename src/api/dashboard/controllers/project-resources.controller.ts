import type { DashboardServiceClient } from '../client.js';
import type { ProjectResource } from '../../../schemas/dashboard/index.js';

export async function getProjectResources(
  client: DashboardServiceClient,
  projectId: string
): Promise<ProjectResource[]> {
  const raw = await client.request<unknown>(`/project-resources/${projectId}`);

  if (!Array.isArray(raw)) {
    return [];
  }
  return raw as ProjectResource[];
}
