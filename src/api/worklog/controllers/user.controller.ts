import type { WorklogServiceClient } from '../client.js';
import type { WorklogProject } from '../../../schemas/worklog.js';
import { parseFlight } from '../utils.js';

export async function getUserData(
  client: WorklogServiceClient
): Promise<{ userId: string; projects: WorklogProject[] }> {
  const raw = await client.request<unknown>('/dashboard/user.data');

  if (!Array.isArray(raw)) {
    return { userId: '', projects: [] };
  }

  let userId = '';
  let extractedProjects: unknown[] = [];
  try {
    const parsed = parseFlight<Record<string, unknown>>(raw);
    for (const item of parsed) {
      if (!item || typeof item !== 'object' || !('data' in item)) continue;
      const data = item.data;
      if (!data || typeof data !== 'object') continue;
      const d = data as Record<string, unknown>;
      if ('user' in d && d.user && typeof d.user === 'object') {
        const user = d.user as Record<string, unknown>;
        if (typeof user.id === 'string') userId = user.id;
      }
      if ('projects' in d && Array.isArray(d.projects)) {
        extractedProjects = d.projects;
      }
    }
  } catch {
    return { userId: '', projects: [] };
  }

  const projects = Array.isArray(extractedProjects) ? (extractedProjects as WorklogProject[]) : [];
  return { userId, projects };
}
