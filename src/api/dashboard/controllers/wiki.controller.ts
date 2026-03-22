import type { DashboardServiceClient } from '../client.js';
import {
  DocumentNodeSchema,
  ProjectDocumentSchema,
  type DocumentNode,
  type ProjectDocument,
} from '../../../schemas/dashboard/index.js';

const WikiTreeResponseSchema = DocumentNodeSchema.array();

export async function getWikiTree(client: DashboardServiceClient, projectUniqueName: string): Promise<DocumentNode[]> {
  const raw = await client.request<unknown>(`/wiki/project/${projectUniqueName}`);

  const parsed = WikiTreeResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('Schema validation failed:', parsed.error.format());
    console.error('Raw response:', JSON.stringify(raw, null, 2));
    throw new Error('Invalid wiki tree response format');
  }

  return parsed.data;
}

export async function getWikiDocument(client: DashboardServiceClient, documentId: string): Promise<ProjectDocument> {
  const raw = await client.request<unknown>(`/wiki/${documentId}`);

  const parsed = ProjectDocumentSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('Schema validation failed:', parsed.error.format());
    console.error('Raw response:', JSON.stringify(raw, null, 2));
    throw new Error('Invalid wiki document response format');
  }

  return parsed.data;
}
