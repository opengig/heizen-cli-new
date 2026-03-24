/** Creator for DocumentNode and ProjectDocument */
export interface DocumentCreator {
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
}

/** Represents a document or planning node within a project workspace */
export interface DocumentNode {
  id?: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  parent_id?: string | null;
  confluence_page_id?: string | null;
  confluence_space_id?: string | null;
  creator?: DocumentCreator;
  children?: DocumentNode[];
}

/** Represents the detailed view of a document */
export interface ProjectDocument {
  id?: string;
  project_id?: string;
  title?: string;
  content?: Record<string, unknown>;
  markdown?: string;
  parent_id?: string | null;
  is_public?: boolean;
  public_access_level?: string;
  created_by?: string;
  last_embedded_at?: string | null;
  confluence_page_id?: string | null;
  confluence_space_id?: string | null;
  confluence_page_url?: string | null;
  created_at?: string;
  updated_at?: string;
  creator?: DocumentCreator;
}
