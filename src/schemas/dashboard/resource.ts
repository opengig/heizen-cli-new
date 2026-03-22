import { z } from 'zod';

const ResourceTypeSchema = z.enum(['document', 'figma', 'repository']).or(z.string());
const ScheduleTypeSchema = z.enum(['none', 'daily', 'weekly']).or(z.string());

/** Represents a resource or document associated with a specific project */
export const ProjectResourceSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  resourceType: ResourceTypeSchema,
  resourceURL: z.string(),
  resourceName: z.string(),
  scheduleType: ScheduleTypeSchema,
  scheduleTime: z.string(),
  scheduleDays: z.array(z.number()),
  scheduleDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProjectResource = z.infer<typeof ProjectResourceSchema>;
