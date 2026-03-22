import type { DashboardServiceClient } from '../client.js';
import { ProjectResourceSchema, type ProjectResource } from '../../../schemas/dashboard/index.js';

const ProjectResourcesResponseSchema = ProjectResourceSchema.array();

export async function getProjectResources(
  client: DashboardServiceClient,
  projectId: string
): Promise<ProjectResource[]> {
  const raw = await client.request<unknown>(`/project-resources/${projectId}`);

  const parsed = ProjectResourcesResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('Schema validation failed:', parsed.error.format());
    console.error('Raw response:', JSON.stringify(raw, null, 2));
    throw new Error('Invalid project resources response format');
  }

  return parsed.data;
}
