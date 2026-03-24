import type { WorklogServiceClient } from '../client.js';
import type { AddWorklogRequest, AddWorklogResponse, WorklogEntry } from '../../../schemas/worklog.js';
import { parseFlight } from '../utils.js';

function assertAddWorklogRequest(req: AddWorklogRequest): void {
  if (!req.projectId) throw new Error('addWorklog requires projectId');
  if (!req.userId) throw new Error('addWorklog requires userId');
  if (!req.taskPhase) throw new Error('addWorklog requires taskPhase');
  if (!req.workLogType) throw new Error('addWorklog requires workLogType');
  if (req.hoursWorked == null || Number.isNaN(req.hoursWorked) || req.hoursWorked <= 0) {
    throw new Error('addWorklog requires positive hoursWorked');
  }
  if (!req.date) throw new Error('addWorklog requires date');
}

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

  if (Array.isArray(raw)) return raw as WorklogEntry[];
  if (
    typeof raw === 'object' &&
    raw !== null &&
    'worklogs' in raw &&
    Array.isArray((raw as { worklogs?: unknown }).worklogs)
  ) {
    return (raw as { worklogs: WorklogEntry[] }).worklogs;
  }
  if (typeof raw === 'object' && raw !== null && 'data' in raw && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: WorklogEntry[] }).data;
  }
  return [];
}

export async function addWorklog(client: WorklogServiceClient, req: AddWorklogRequest): Promise<AddWorklogResponse> {
  assertAddWorklogRequest(req);

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

  return { data: entry.data as { success?: string } };
}
