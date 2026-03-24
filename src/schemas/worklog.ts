/** Nested project on a worklog entry */
export interface WorklogEntryProject {
  id?: string;
  name?: string;
  [key: string]: unknown;
}

/** Single worklog entry (inferred from API usage) */
export interface WorklogEntry {
  id?: string;
  projectId?: string;
  userId?: string;
  taskPhase?: string;
  workLogType?: string;
  hoursWorked?: number;
  notes?: string | null;
  date?: string;
  createdAt?: string;
  updatedAt?: string;
  project?: WorklogEntryProject;
  [key: string]: unknown;
}

/** Response from POST /action/get-worklogs */
export type GetWorklogsResponse =
  | WorklogEntry[]
  | {
      worklogs?: WorklogEntry[];
      data?: WorklogEntry[];
    };

/** Project from user.data (worklog projects - different IDs from dashboard) */
export interface WorklogProject {
  id?: string;
  name?: string;
  [key: string]: unknown;
}

/** Request body for adding worklog (POST /dashboard/user.data?index) */
export interface AddWorklogRequest {
  projectId: string;
  userId: string;
  taskPhase: string;
  workLogType: string;
  hoursWorked: number;
  notes?: string;
  date: string;
}

/** Parsed response from POST /dashboard/user.data?index (after parseFlight) */
export interface AddWorklogResponse {
  data?: {
    success?: string;
  };
}
