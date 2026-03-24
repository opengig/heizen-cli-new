import { getDb, getWorkspaceKey } from '../core.js';
import type { WorkspaceState } from '../../schemas/db.js';
import { requireForAction } from '../../modules/common/format.js';

export async function getWorkspaceState(): Promise<WorkspaceState> {
  const db = await getDb();
  const key = getWorkspaceKey();
  return db.data.workspaces[key] ?? {};
}

export async function setLinkedDashboardProject(projectId: string): Promise<void> {
  const db = await getDb();
  const key = getWorkspaceKey();
  if (!db.data.workspaces[key]) db.data.workspaces[key] = {};
  db.data.workspaces[key].linkedDashboardProjectId = projectId;
  await db.write();
}

/** Persist linked worklog project; display formatting is done when reading (see `linkedWorklogProjectFromWorkspace`). */
export async function setLinkedWorklogProject(project: { id: string; name?: string | null }): Promise<void> {
  requireForAction('Setting linked worklog project', 'project id', project.id);
  const db = await getDb();
  const key = getWorkspaceKey();
  if (!db.data.workspaces[key]) db.data.workspaces[key] = {};
  db.data.workspaces[key].linkedWorklogProject = { id: project.id, name: project.name };
  await db.write();
}

export async function setActiveSprint(sprintId: string): Promise<void> {
  const db = await getDb();
  const key = getWorkspaceKey();
  if (!db.data.workspaces[key]) db.data.workspaces[key] = {};
  db.data.workspaces[key].activeSprintId = sprintId;
  await db.write();
}
