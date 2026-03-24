/** Represents a resource or document associated with a specific project */
export interface ProjectResource {
  id?: string;
  projectId?: string;
  resourceType?: string;
  resourceURL?: string;
  resourceName?: string;
  scheduleType?: string;
  scheduleTime?: string;
  scheduleDays?: number[];
  scheduleDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
