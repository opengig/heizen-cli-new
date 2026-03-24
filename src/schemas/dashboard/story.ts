/** User reference (assignee, creator) */
export interface UserRef {
  id?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  email?: string;
}

/** Project reference in story */
export interface ProjectRef {
  id?: string;
  title?: string;
  uniqueName?: string;
}

/** Sprint reference */
export interface SprintRef {
  id?: string;
  name?: string;
}

/** Task reference */
export interface TaskRef {
  id?: string;
  title?: string;
  type?: string;
}

export type StoryStatus = 'Done' | 'InReview' | 'Todo' | 'InProgress' | 'In Progress' | string;

/** User story - full object for GET /tasks/user-stories/story/{id} and sprint board */
export interface UserStory {
  id?: string;
  projectId?: string;
  sprintId?: string | null;
  title?: string;
  description?: string;
  estimation?: number;
  order?: number | null;
  storyNumber?: number;
  figmaImages?: unknown[];
  acceptanceCriteria?: unknown[];
  status?: StoryStatus;
  assignedTo?: string | null;
  priority?: number;
  assignee?: UserRef | null;
  creator?: UserRef | null;
  testCases?: unknown[];
  storyGithubPRs?: unknown[];
  project?: ProjectRef;
  sprint?: SprintRef | null;
  task?: TaskRef;
  createdAt?: string;
  updatedAt?: string;
}

/** FeatureTask - task with stories (sprint board response) */
export interface FeatureTask {
  id?: string;
  title?: string;
  description?: string;
  type?: string;
  storyStatus?: string;
  sprintId?: string;
  projectId?: string;
  stories?: UserStory[];
  createdAt?: string;
  updatedAt?: string;
}

/** Response from GET /tasks/sprint-board/{sprintId} - array of FeatureTask */
export type SprintBoardResponse = FeatureTask[];
