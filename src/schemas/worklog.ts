import { z } from 'zod';

/** Single worklog entry (inferred from API usage) */
export const WorklogEntrySchema = z
  .object({
    id: z.string().optional(),
    projectId: z.string(),
    userId: z.string(),
    taskPhase: z.string(),
    workLogType: z.string(),
    hoursWorked: z.number(),
    notes: z.string().optional().nullable(),
    date: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    project: z
      .object({
        id: z.string(),
        title: z.string().optional(),
        name: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

/** Response from POST /action/get-worklogs */
export const GetWorklogsResponseSchema = z.union([
  z.array(WorklogEntrySchema),
  z.object({
    worklogs: z.array(WorklogEntrySchema).optional(),
    data: z.array(WorklogEntrySchema).optional(),
  }),
]);

/** Project from user.data (worklog projects - different IDs from dashboard) */
export const WorklogProjectSchema = z
  .object({
    id: z.string(),
    title: z.string().optional(),
    name: z.string().optional(),
  })
  .passthrough();

/** Request body for adding worklog (POST /dashboard/user.data?index) */
export const AddWorklogRequestSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
  taskPhase: z.string(),
  workLogType: z.string(),
  hoursWorked: z.number().positive(),
  notes: z.string().optional(),
  date: z.string(),
});

/** Parsed response from POST /dashboard/user.data?index (after parseFlight) */
export const AddWorklogResponseSchema = z.object({
  data: z.object({
    success: z.string(),
  }),
});

export type WorklogEntry = z.infer<typeof WorklogEntrySchema>;
export type GetWorklogsResponse = z.infer<typeof GetWorklogsResponseSchema>;
export type WorklogProject = z.infer<typeof WorklogProjectSchema>;
export type AddWorklogRequest = z.infer<typeof AddWorklogRequestSchema>;
export type AddWorklogResponse = z.infer<typeof AddWorklogResponseSchema>;
