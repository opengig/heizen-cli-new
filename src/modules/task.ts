import { Command } from 'commander';
import chalk, { ChalkInstance } from 'chalk';
import Table from 'cli-table3';
import prompts from 'prompts';
import { createDashboardClient } from '../api/index.js';
import { requireDashboardAuth } from '../config/index.js';
import { getSprintBoardTasks, getActiveSprintInfo, missing, requireStringForAction } from './common/index.js';
import type { UserStory } from '../schemas/dashboard/index.js';

type StoryStatus = 'Done' | 'InReview' | 'Todo' | 'InProgress' | 'In Progress';

const STATUS_MAP: Record<string, StoryStatus> = {
  done: 'Done',
  review: 'InReview',
  todo: 'Todo',
  inprogress: 'InProgress',
  'in progress': 'InProgress',
};

function parseStatus(shorthand: string): StoryStatus | null {
  const key = shorthand.trim().toLowerCase();
  return STATUS_MAP[key] ?? null;
}

function statusColor(status: string | undefined): ChalkInstance {
  const s = (status ?? '').toLowerCase();
  if (s === 'done') return chalk.green;
  if (s === 'inreview') return chalk.yellow;
  if (s === 'inprogress' || s === 'in progress') return chalk.cyan;
  if (s === 'todo') return chalk.gray;
  return chalk.reset;
}

function formatStoryLine(i: number, s: UserStory): string {
  const color = statusColor(s.status);
  return color(`${i + 1}. ${missing(s.title)} [${missing(s.estimation)} hrs]`);
}

function printStoryDetails(story: UserStory) {
  console.log(chalk.bold(`Story: ${missing(story.title)}\n`));
  console.log(chalk.dim(`Status: ${missing(story.status)}`));
  console.log(chalk.dim(`Priority: ${missing(story.priority)}`));
  if (story.assignee) {
    const name = [story.assignee.firstName, story.assignee.lastName].filter(Boolean).join(' ');
    if (name) console.log(chalk.dim(`Assignee: ${name} (${missing(story.assignee.email)})`));
  }
  console.log(chalk.dim(`Estimation: ${missing(story.estimation)}`));
  if (story.description) {
    console.log(chalk.dim(`Description: ${story.description.slice(0, 300)}`));
  }
  if (story.acceptanceCriteria?.length) {
    console.log(chalk.dim('Acceptance criteria:'));
    story.acceptanceCriteria.forEach((c) => {
      const text = typeof c === 'string' ? c : (c as { criteria: string }).criteria;
      console.log(chalk.dim(`  - ${text}`));
    });
  }
}

export const taskCommand = new Command('tasks')
  .description('List tasks in working sprint, view stories, or update story status')
  .option('-d, --details', 'Show all tasks with all stories')
  .option('-v, --view', 'Interactive mode')
  .argument('[taskIndex]', 'Task index (1-based)')
  .argument('[storyIndex]', 'Story index (1-based)')
  .argument('[status]', 'Set story status: done, review, todo, inprogress')
  .action(async (taskIndexStr, storyIndexStr, statusStr, opts) => {
    try {
      const tasks = await getSprintBoardTasks();
      const sprintInfo = await getActiveSprintInfo();

      if (tasks.length === 0) {
        console.log(chalk.gray('No tasks in sprint.'));
        return;
      }

      const header = sprintInfo ? `${sprintInfo.name} (${sprintInfo.status})` : 'Sprint';
      console.log(chalk.bold(header));
      console.log('');

      if (opts.view) {
        for (let i = 0; i < tasks.length; i++) {
          console.log(chalk.cyan(`${i + 1}. ${missing(tasks[i].title)}`));
        }
        const { taskNum } = await prompts({
          type: 'number',
          name: 'taskNum',
          message: 'Enter task number:',
          min: 1,
          max: tasks.length,
          initial: 1,
        });
        if (taskNum == null) process.exit(1);
        const task = tasks[taskNum - 1];
        if (!task) {
          console.error(chalk.red('Task not found.'));
          process.exit(2);
        }
        const stories = task.stories ?? [];
        if (stories.length === 0) {
          console.log(chalk.gray('No stories in this task.'));
          return;
        }
        stories.forEach((s, i) => {
          console.log(formatStoryLine(i, s));
        });
        const { storyNum } = await prompts({
          type: 'number',
          name: 'storyNum',
          message: 'Enter story number:',
          min: 1,
          max: stories.length,
          initial: 1,
        });
        if (storyNum == null) process.exit(1);
        const story = stories[storyNum - 1];
        if (!story) {
          console.error(chalk.red('Story not found.'));
          process.exit(2);
        }
        console.log('');
        printStoryDetails(story);
        return;
      }

      if (opts.details) {
        tasks.forEach((t, i) => {
          console.log(chalk.bold(`${i + 1}. ${missing(t.title)}`));
          const stories = t.stories ?? [];
          if (stories.length === 0) {
            console.log(chalk.gray('  (empty)'));
          } else {
            const table = new Table({
              head: ['#', 'Name', 'Estimate', 'Status'],
              colWidths: [4, 40, 10, 12],
            });
            stories.forEach((s, j) => {
              table.push([j + 1, missing(s.title), missing(s.estimation), missing(s.status)]);
            });
            console.log(table.toString());
          }
          console.log('');
        });
        return;
      }

      if (statusStr) {
        const apiStatus = parseStatus(statusStr);
        if (!apiStatus) {
          console.error(chalk.red(`Invalid status. Use: done, review, todo, inprogress`));
          process.exit(1);
        }
        if (!taskIndexStr || !storyIndexStr) {
          console.error(chalk.red('Task and story index required to update status.'));
          process.exit(1);
        }
        const taskIndex = parseInt(taskIndexStr, 10);
        const storyIndex = parseInt(storyIndexStr, 10);
        if (isNaN(taskIndex) || taskIndex < 1 || isNaN(storyIndex) || storyIndex < 1) {
          console.error(chalk.red('Invalid task or story index.'));
          process.exit(1);
        }
        const task = tasks[taskIndex - 1];
        if (!task) {
          console.error(chalk.red('Task not found.'));
          process.exit(2);
        }
        const storyList = task.stories ?? [];
        const story = storyList[storyIndex - 1];
        if (!story) {
          console.error(chalk.red('Story not found.'));
          process.exit(2);
        }
        const storyId = requireStringForAction('Updating story status', 'story id', story.id);
        const token = await requireDashboardAuth();
        const client = createDashboardClient(token);
        const fullStory = await client.getStory(storyId).catch(() => story as UserStory);
        (fullStory as UserStory).status = apiStatus;
        await client.updateStory(fullStory as UserStory);
        console.log(chalk.green(`Marked story as ${apiStatus}: ${missing(story.title)}`));
        return;
      }

      if (storyIndexStr && !statusStr) {
        const taskIndex = parseInt(taskIndexStr, 10);
        const storyIndex = parseInt(storyIndexStr, 10);
        if (isNaN(taskIndex) || taskIndex < 1 || isNaN(storyIndex) || storyIndex < 1) {
          console.error(chalk.red('Invalid task or story index.'));
          process.exit(1);
        }
        const task = tasks[taskIndex - 1];
        if (!task) {
          console.error(chalk.red('Task not found.'));
          process.exit(2);
        }
        const storyList = task.stories ?? [];
        const story = storyList[storyIndex - 1];
        if (!story) {
          console.error(chalk.red('Story not found.'));
          process.exit(2);
        }
        printStoryDetails(story);
        return;
      }

      if (taskIndexStr) {
        const taskIndex = parseInt(taskIndexStr, 10);
        if (isNaN(taskIndex) || taskIndex < 1) {
          console.error(chalk.red('Invalid task index.'));
          process.exit(1);
        }
        const task = tasks[taskIndex - 1];
        if (!task) {
          console.error(chalk.red('Task not found.'));
          process.exit(2);
        }
        console.log(chalk.bold(`Task: ${missing(task.title)}\n`));
        const stories = task.stories ?? [];
        if (stories.length === 0) {
          console.log(chalk.gray('No stories in this task.'));
        } else {
          stories.forEach((s, i) => {
            console.log(
              chalk.dim(`${i + 1}. ${missing(s.title)} | est:${missing(s.estimation)} | ${missing(s.status)}`)
            );
          });
        }
        return;
      }

      tasks.forEach((t, i) => {
        console.log(chalk.cyan(`${i + 1}. ${missing(t.title)}`));
      });
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  });
