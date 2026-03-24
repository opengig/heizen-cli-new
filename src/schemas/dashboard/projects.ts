export type ProjectRole = 'Admin' | 'Developer' | 'Manager' | 'Client' | 'Designer' | string;
export type SprintStatus = 'Completed' | 'Active' | 'Paused' | 'NotStarted' | string;
export type HealthStatus = 'on-track' | 'at-risk' | 'inactive' | string;

export interface ProjectMember {
  id?: string;
  projectId?: string;
  role?: ProjectRole;
  createdAt?: string;
  updatedAt?: string;
  email?: string;
  userId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}

export interface ProjectHealth {
  status?: HealthStatus;
  color?: string;
  label?: string;
  bgColor?: string;
  activeSprintCount?: number;
  overdueSprints?: number;
  soonDueSprints?: number;
}

/** Sprint (from Project.sprints) */
export interface Sprint {
  id?: string;
  name?: string;
  status?: SprintStatus;
  startDate?: string;
  endDate?: string;
}

/** Dashboard project (from GET /projects) */
export interface DashboardProject {
  id?: string;
  title?: string;
  logoUrl?: string | null;
  isArchived?: boolean;
  projectMembers?: ProjectMember[];
  sprints?: Sprint[];
  uniqueName?: string;
  updatedAt?: string;
  health?: ProjectHealth;
}

/** Response from GET /projects - array of Projects */
export type ProjectsResponse = DashboardProject[];
