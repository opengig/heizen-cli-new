import { z } from 'zod';

/** Creator for a meeting record */
export const MeetingCreatorSchema = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  avatar_url: z.string().nullable(),
});
export type MeetingCreator = z.infer<typeof MeetingCreatorSchema>;

/** Technical metadata regarding the recording timing */
export const MeetingMetadataSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  durationInSeconds: z.number(),
});
export type MeetingMetadata = z.infer<typeof MeetingMetadataSchema>;

/** The primary schema for a Meeting Recording / Summary object */
export const MeetingRecordSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  resourceId: z.string().nullable(),
  createdBy: z.string(),
  audioUrl: z.string(),
  creator: MeetingCreatorSchema,
  transcript: z.string(),
  summary: z.string(),
  metadata: MeetingMetadataSchema,
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  isStoriesCreated: z.boolean(),
});
export type MeetingRecord = z.infer<typeof MeetingRecordSchema>;
