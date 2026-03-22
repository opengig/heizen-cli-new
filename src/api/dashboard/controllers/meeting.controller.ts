import type { DashboardServiceClient } from '../client.js';
import { MeetingRecordSchema, type MeetingRecord } from '../../../schemas/dashboard/index.js';

const MeetingRecordsResponseSchema = MeetingRecordSchema.array();

export async function getMeetingRecords(client: DashboardServiceClient, projectId: string): Promise<MeetingRecord[]> {
  const raw = await client.request<unknown>(`/meeting-data/project/${projectId}`);

  const parsed = MeetingRecordsResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('Schema validation failed:', parsed.error.format());
    console.error('Raw response:', JSON.stringify(raw, null, 2));
    throw new Error('Invalid meeting records response format');
  }

  return parsed.data;
}
