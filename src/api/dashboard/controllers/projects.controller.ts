import type { DashboardServiceClient } from '../client.js';
import { ProjectsResponseSchema, type DashboardProject } from '../../../schemas/dashboard.js';

export async function getProjects(client: DashboardServiceClient, active?: boolean): Promise<DashboardProject[]> {
  const qs = active !== undefined ? `?active=${active}` : '?active=false';
  const raw = await client.request<unknown>(`/projects${qs}`);

  const parsed = ProjectsResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('Schema validation failed:', parsed.error.format());
    console.error('Raw response:', JSON.stringify(raw, null, 2));
    throw new Error('Invalid projects response format');
  }

  return parsed.data;
}
