import { createDashboardClient } from '../../api/index.js';
import { requireDashboardAuth } from '../../config/index.js';
import { getCachedProjects, cacheProjects } from '../../db/index.js';
import { getWorkspaceState, getLinkedDashboardProjectId } from '../../db/repositories/workspace.repository.js';
import type { DashboardProject, FeatureTask } from '../../schemas/dashboard/index.js';

export async function getProjectsCachedOrFetch(active?: boolean): Promise<DashboardProject[]> {
  if (active === undefined || active === false) {
    const cached = await getCachedProjects();
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached as DashboardProject[];
    }
  }
  const token = await requireDashboardAuth();
  const client = createDashboardClient(token);
  const projects = await client.getProjects(active);
  if (active === undefined || active === false) {
    await cacheProjects(projects as unknown[]);
  }
  return projects;
}

export async function getSprintBoardTasks(): Promise<FeatureTask[]> {
  const ws = await getWorkspaceState();
  if (!ws.activeSprintId) {
    throw new Error('No active sprint. Run hz sprints set first.');
  }
  const token = await requireDashboardAuth();
  const client = createDashboardClient(token);
  const { tasks } = await client.getSprintBoard(ws.activeSprintId);
  return tasks;
}

export async function getActiveSprintInfo(): Promise<{ name: string; status: string } | null> {
  const ws = await getWorkspaceState();
  const linkedId = getLinkedDashboardProjectId(ws);
  if (!ws.activeSprintId || !linkedId) return null;
  const projects = await getProjectsCachedOrFetch(false);
  const project = projects.find((p) => p.id === linkedId);
  const sprint = project?.sprints?.find((s) => s.id === ws.activeSprintId);
  return sprint ? { name: sprint.name, status: sprint.status } : null;
}

export async function getLinkedProject(): Promise<DashboardProject> {
  const ws = await getWorkspaceState();
  const linkedId = getLinkedDashboardProjectId(ws);
  if (!linkedId) {
    throw new Error('No project linked. Run hz projects open "project name" first.');
  }
  const projects = await getProjectsCachedOrFetch(false);
  const project = projects.find((p) => p.id === linkedId);
  if (!project) {
    throw new Error('Linked project not found. Run hz projects to refresh.');
  }
  return project;
}
