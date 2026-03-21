import type { WorklogServiceClient } from '../client.js';
import {
  GetWorklogsResponseSchema,
  AddWorklogRequestSchema,
  AddWorklogResponseSchema,
  type AddWorklogRequest,
  type AddWorklogResponse,
  type WorklogEntry,
} from '../../../schemas/worklog.js';
import { parseFlight } from '../utils.js';

export async function getWorklogs(
  client: WorklogServiceClient,
  params: { startDate: string; endDate: string; userId: string }
): Promise<WorklogEntry[]> {
  const formData = new FormData();
  formData.append('startDate', params.startDate);
  formData.append('endDate', params.endDate);
  formData.append('userId', params.userId);

  const raw = await client.request<unknown>('/action/get-worklogs', {
    method: 'POST',
    data: formData,
  });

  const parsed = GetWorklogsResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('Schema validation failed:', parsed.error.format());
    console.error('Raw response:', JSON.stringify(raw, null, 2));
    throw new Error('Invalid worklogs response format');
  }

  const data = parsed.data;
  if (Array.isArray(data)) return data as WorklogEntry[];
  if (
    typeof data === 'object' &&
    data !== null &&
    'worklogs' in data &&
    Array.isArray((data as { worklogs?: unknown }).worklogs)
  ) {
    return (data as { worklogs: WorklogEntry[] }).worklogs;
  }
  if (typeof data === 'object' && data !== null && 'data' in data && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: WorklogEntry[] }).data;
  }
  return [];
}

export async function addWorklog(client: WorklogServiceClient, req: AddWorklogRequest): Promise<AddWorklogResponse> {
  AddWorklogRequestSchema.parse(req);

  const formData = new FormData();
  formData.append('projectId', req.projectId);
  formData.append('userId', req.userId);
  formData.append('taskPhase', req.taskPhase);
  formData.append('workLogType', req.workLogType);
  formData.append('hoursWorked', String(req.hoursWorked));
  if (req.notes) formData.append('notes', req.notes);
  formData.append('date', req.date);

  const raw = await client.request<unknown>('/dashboard/user.data?index', {
    method: 'POST',
    data: formData,
  });

  if (!Array.isArray(raw)) {
    throw new Error('Invalid add worklog response: expected flight format');
  }

  const parsed = parseFlight<Record<string, unknown>>(raw);
  const entry = parsed.find(
    (item) =>
      item &&
      typeof item === 'object' &&
      'data' in item &&
      item.data &&
      typeof item.data === 'object' &&
      'success' in (item.data as Record<string, unknown>)
  );

  if (!entry || !entry.data || typeof entry.data !== 'object') {
    throw new Error('Invalid add worklog response: could not find success in parsed flight');
  }

  const validated = AddWorklogResponseSchema.safeParse(entry);
  if (!validated.success) {
    console.error('Add worklog response validation failed:', validated.error.format());
    throw new Error('Invalid add worklog response format');
  }
  return validated.data;
}
