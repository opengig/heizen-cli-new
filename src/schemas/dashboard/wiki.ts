import { z } from 'zod';

/** Creator for DocumentNode and ProjectDocument */
export const DocumentCreatorSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  avatar_url: z.string().nullable(),
});
export type DocumentCreator = z.infer<typeof DocumentCreatorSchema>;

/** Represents a document or planning node within a project workspace */
export const DocumentNodeSchema: z.ZodType<{
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  parent_id: string | null;
  confluence_page_id: string | null;
  confluence_space_id: string | null;
  creator: z.infer<typeof DocumentCreatorSchema>;
  children: z.infer<typeof DocumentNodeSchema>[];
}> = z.lazy(() =>
  z.object({
    id: z.string(),
    title: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    created_by: z.string(),
    parent_id: z.string().nullable(),
    confluence_page_id: z.string().nullable(),
    confluence_space_id: z.string().nullable(),
    creator: DocumentCreatorSchema,
    children: z.array(DocumentNodeSchema),
  })
);
export type DocumentNode = z.infer<typeof DocumentNodeSchema>;

const PublicAccessLevelSchema = z.enum(['View', 'Edit']).or(z.string());

/** Represents the detailed view of a document */
export const ProjectDocumentSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  title: z.string(),
  content: z.record(z.string(), z.any()),
  markdown: z.string(),
  parent_id: z.string().nullable(),
  is_public: z.boolean(),
  public_access_level: PublicAccessLevelSchema,
  created_by: z.string(),
  last_embedded_at: z.string().nullable(),
  confluence_page_id: z.string().nullable(),
  confluence_space_id: z.string().nullable(),
  confluence_page_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  creator: DocumentCreatorSchema,
});
export type ProjectDocument = z.infer<typeof ProjectDocumentSchema>;
