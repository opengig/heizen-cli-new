import type { DashboardServiceClient } from '../client.js';
import type { DocumentNode, ProjectDocument } from '../../../schemas/dashboard/index.js';

export async function getWikiTree(client: DashboardServiceClient, projectUniqueName: string): Promise<DocumentNode[]> {
  const raw = await client.request<unknown>(`/wiki/project/${projectUniqueName}`);

  if (!Array.isArray(raw)) {
    return [];
  }
  return raw as DocumentNode[];
}

export async function getWikiDocument(client: DashboardServiceClient, documentId: string): Promise<ProjectDocument> {
  const raw = await client.request<unknown>(`/wiki/${documentId}`);

  if (raw === null || typeof raw !== 'object') {
    return {};
  }
  return raw as ProjectDocument;
}
