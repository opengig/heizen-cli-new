import { z } from 'zod';

export const ProjectRoleSchema = z.enum(['Admin', 'Developer', 'Manager', 'Client', 'Designer']);
export type ProjectRole = z.infer<typeof ProjectRoleSchema>;

export const SprintStatusSchema = z.enum(['Completed', 'Active', 'Paused', 'Not Started']);
export type SprintStatus = z.infer<typeof SprintStatusSchema>;

export const HealthStatusSchema = z.enum(['on-track', 'at-risk', 'inactive']);
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

export const ProjectMemberSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  role: ProjectRoleSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  email: z.string(),
  userId: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});
export type ProjectMember = z.infer<typeof ProjectMemberSchema>;

export const ProjectHealthSchema = z.object({
  status: HealthStatusSchema,
  color: z.string(),
  label: z.string(),
  bgColor: z.string(),
  activeSprintCount: z.number(),
  overdueSprints: z.number(),
  soonDueSprints: z.number(),
});
export type ProjectHealth = z.infer<typeof ProjectHealthSchema>;

/** Sprint (from Project.sprints) */
export const SprintSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: SprintStatusSchema,
  startDate: z.string(),
  endDate: z.string(),
});
export type Sprint = z.infer<typeof SprintSchema>;

/** Dashboard project (from GET /projects) */
export const DashboardProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  logoUrl: z.string().nullable(),
  isArchived: z.boolean(),
  projectMembers: z.array(ProjectMemberSchema),
  sprints: z.array(SprintSchema),
  uniqueName: z.string(),
  updatedAt: z.string(),
  health: ProjectHealthSchema,
});
export type DashboardProject = z.infer<typeof DashboardProjectSchema>;

/** Response from GET /projects - array of Projects */
export const ProjectsResponseSchema = z.array(DashboardProjectSchema);

export type ProjectsResponse = z.infer<typeof ProjectsResponseSchema>;
