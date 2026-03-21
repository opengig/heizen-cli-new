import type { DashboardServiceClient } from '../client.js';
import { SprintBoardResponseSchema, type FeatureTask } from '../../../schemas/dashboard.js';

export async function getSprintBoard(
  client: DashboardServiceClient,
  sprintId: string
): Promise<{ tasks: FeatureTask[] }> {
  const raw = await client.request<unknown>(`/tasks/sprint-board/${sprintId}`);

  const parsed = SprintBoardResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('Schema validation failed:', parsed.error.format());
    console.error('Raw response:', JSON.stringify(raw, null, 2));
    throw new Error('Invalid sprint board response format');
  }

  return { tasks: parsed.data };
}
