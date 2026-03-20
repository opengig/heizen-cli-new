import type { DashboardServiceClient } from '../client.js';
import { SprintBoardResponseSchema, type FeatureTask, type SprintBoardColumn } from '../../../schemas/dashboard.js';

export async function getSprintBoard(
  client: DashboardServiceClient,
  sprintId: string
): Promise<{
  tasks: FeatureTask[];
  columns: SprintBoardColumn[];
  sprint?: { id: string; name?: string };
}> {
  const raw = await client.request<unknown>(`/tasks/sprint-board/${sprintId}`);

  const parsed = SprintBoardResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('Schema validation failed:', parsed.error.format());
    console.error('Raw response:', JSON.stringify(raw, null, 2));
    throw new Error('Invalid sprint board response format');
  }

  const data = parsed.data;
  if (Array.isArray(data)) {
    const arr = data as unknown[];
    const asTasks = arr as FeatureTask[];
    const asColumns = arr as SprintBoardColumn[];
    return {
      tasks: asTasks,
      columns: asColumns,
      sprint: { id: sprintId },
    };
  }
  const obj = data as Record<string, unknown>;
  const columns = (obj.columns ?? []) as SprintBoardColumn[];
  const tasks: FeatureTask[] = columns.map((c) => ({
    id: c.id ?? '',
    title: c.title,
    stories: c.stories ?? [],
  }));
  return {
    tasks,
    columns,
    sprint: obj.sprint as { id: string; name?: string } | undefined,
  };
}
