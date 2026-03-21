import { getDb, getWorkspaceKey } from '../core.js';
import type { WorkspaceState } from '../../schemas/db.js';

export async function getWorkspaceState(): Promise<WorkspaceState> {
  const db = await getDb();
  const key = getWorkspaceKey();
  return db.data.workspaces[key] ?? {};
}

export async function setLinkedProject(projectId: string): Promise<void> {
  const db = await getDb();
  const key = getWorkspaceKey();
  if (!db.data.workspaces[key]) db.data.workspaces[key] = {};
  db.data.workspaces[key].linkedProjectId = projectId;
  await db.write();
}

export async function setLinkedWorklogProject(projectOrId: string | { id: string; name: string }): Promise<void> {
  const db = await getDb();
  const key = getWorkspaceKey();
  if (!db.data.workspaces[key]) db.data.workspaces[key] = {};
  const project = typeof projectOrId === 'string' ? { id: projectOrId, name: projectOrId } : projectOrId;
  db.data.workspaces[key].linkedWorklogProjectId = project.id;
  db.data.workspaces[key].linkedWorklogProject = project;
  await db.write();
}

export async function setActiveSprint(sprintId: string): Promise<void> {
  const db = await getDb();
  const key = getWorkspaceKey();
  if (!db.data.workspaces[key]) db.data.workspaces[key] = {};
  db.data.workspaces[key].activeSprintId = sprintId;
  await db.write();
}

export async function getLinkedWorklogProject(): Promise<{ id: string; name: string } | null> {
  const db = await getDb();
  const key = getWorkspaceKey();
  const ws = db.data.workspaces[key];
  if (ws?.linkedWorklogProject) return ws.linkedWorklogProject;
  if (ws?.linkedWorklogProjectId) {
    return { id: ws.linkedWorklogProjectId, name: ws.linkedWorklogProjectId };
  }
  return null;
}
