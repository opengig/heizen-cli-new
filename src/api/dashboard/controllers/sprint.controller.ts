import type { DashboardServiceClient } from '../client.js';
import type { FeatureTask } from '../../../schemas/dashboard/index.js';

export async function getSprintBoard(
  client: DashboardServiceClient,
  sprintId: string
): Promise<{ tasks: FeatureTask[] }> {
  const raw = await client.request<unknown>(`/tasks/sprint-board/${sprintId}`);

  if (!Array.isArray(raw)) {
    return { tasks: [] };
  }
  return { tasks: raw as FeatureTask[] };
}
