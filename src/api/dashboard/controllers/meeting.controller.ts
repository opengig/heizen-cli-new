import type { DashboardServiceClient } from '../client.js';
import type { MeetingRecord } from '../../../schemas/dashboard/index.js';

export async function getMeetingRecords(client: DashboardServiceClient, projectId: string): Promise<MeetingRecord[]> {
  const raw = await client.request<unknown>(`/meeting-data/project/${projectId}`);

  if (!Array.isArray(raw)) {
    return [];
  }
  return raw as MeetingRecord[];
}
