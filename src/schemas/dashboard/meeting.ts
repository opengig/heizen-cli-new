/** Creator for a meeting record */
export interface MeetingCreator {
  id?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
}

/** Technical metadata regarding the recording timing */
export interface MeetingMetadata {
  startDate?: string;
  endDate?: string;
  durationInSeconds?: number;
}

/** The primary schema for a Meeting Recording / Summary object */
export interface MeetingRecord {
  id?: string;
  projectId?: string;
  resourceId?: string | null;
  createdBy?: string;
  audioUrl?: string;
  creator?: MeetingCreator;
  transcript?: string;
  summary?: string;
  metadata?: MeetingMetadata;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
  isStoriesCreated?: boolean;
}
