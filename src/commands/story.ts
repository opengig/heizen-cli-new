import { Command } from 'commander';
import chalk from 'chalk';
import prompts from 'prompts';
import Table from 'cli-table3';
import { createDashboardClient } from '../api/dashboard.js';
import { requireDashboardAuth } from '../config/index.js';
import { getWorkspaceState } from '../db/index.js';
import type { FeatureTask, UserStory } from '../schemas/dashboard.js';

async function getSprintBoardTasks(): Promise<FeatureTask[]> {
  const ws = await getWorkspaceState();
  if (!ws.activeSprintId) {
    throw new Error('No active sprint. Run hz sprint <index> first.');
  }
  const token = requireDashboardAuth();
  const client = createDashboardClient(token);
  const { tasks } = await client.getSprintBoard(ws.activeSprintId);
  return tasks;
}

const taskCommand = new Command('task')
  .description('List stories in task (by index from hz sprint)')
  .argument('[index]', 'Task index')
  .action(async (indexStr) => {
    try {
      let taskIndex: number;
      if (indexStr) {
        taskIndex = parseInt(indexStr, 10);
        if (isNaN(taskIndex) || taskIndex < 1) {
          console.error(chalk.red('Invalid task index.'));
          process.exit(1);
        }
      } else {
        const tasks = await getSprintBoardTasks();
        if (tasks.length === 0) {
          console.log(chalk.gray('No tasks. Run hz sprint <index> first.'));
          return;
        }
        const { taskId } = await prompts({
          type: 'number',
          name: 'taskId',
          message: 'Enter task number:',
          min: 1,
          max: tasks.length,
          initial: 1,
        });
        if (taskId == null) process.exit(1);
        taskIndex = taskId;
      }
      const tasks = await getSprintBoardTasks();
      const task = tasks[taskIndex - 1];
      if (!task) {
        console.error(chalk.red('Task not found.'));
        process.exit(2);
      }
      const stories = task.stories ?? [];
      if (stories.length === 0) {
        console.log(chalk.gray(`Task ${taskIndex}: ${task.title ?? 'Task'} (empty)`));
        return;
      }
      console.log(chalk.bold(`Task ${taskIndex}: ${task.title ?? 'Task'}\n`));
      const table = new Table({
        head: ['#', 'ID', 'Title', 'Status'],
        colWidths: [4, 28, 40, 12],
      });
      stories.forEach((s, i) => {
        table.push([i + 1, s.id, (s.title ?? '').slice(0, 38), s.status ?? '-']);
      });
      console.log(table.toString());
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  });

const storyCommand = new Command('story')
  .description('Story details or mark done')
  .argument('[taskIndex]', 'Task index')
  .argument('[storyIndex]', 'Story index')
  .argument('[action]', 'Action: done')
  .action(async (taskIndexStr, storyIndexStr, actionStr) => {
    try {
      let taskIndex: number;
      let storyIndex: number;
      const tasks = await getSprintBoardTasks();
      if (tasks.length === 0) {
        console.log(chalk.gray('No tasks. Run hz sprint <index> first.'));
        return;
      }
      if (taskIndexStr) {
        taskIndex = parseInt(taskIndexStr, 10);
        if (isNaN(taskIndex) || taskIndex < 1) {
          console.error(chalk.red('Invalid task index.'));
          process.exit(1);
        }
      } else {
        const res = await prompts({
          type: 'number',
          name: 'taskId',
          message: 'Enter task number:',
          min: 1,
          max: tasks.length,
          initial: 1,
        });
        if (res.taskId == null) process.exit(1);
        taskIndex = res.taskId;
      }
      const task = tasks[taskIndex - 1];
      if (!task) {
        console.error(chalk.red('Task not found.'));
        process.exit(2);
      }
      const stories = task.stories ?? [];
      if (stories.length === 0) {
        console.log(chalk.gray('No stories in this task.'));
        return;
      }
      if (storyIndexStr) {
        storyIndex = parseInt(storyIndexStr, 10);
        if (isNaN(storyIndex) || storyIndex < 1) {
          console.error(chalk.red('Invalid story index.'));
          process.exit(1);
        }
      } else {
        const res = await prompts({
          type: 'number',
          name: 'storyId',
          message: 'Enter story number:',
          min: 1,
          max: stories.length,
          initial: 1,
        });
        if (res.storyId == null) process.exit(1);
        storyIndex = res.storyId;
      }
      const story = stories[storyIndex - 1];
      if (!story) {
        console.error(chalk.red('Story not found.'));
        process.exit(2);
      }
      if (actionStr === 'done') {
        const token = requireDashboardAuth();
        const client = createDashboardClient(token);
        const fullStory = await client.getStory(story.id).catch(() => story as UserStory);
        (fullStory as UserStory).status = 'Done';
        await client.updateStory(fullStory as UserStory);
        console.log(chalk.green(`Marked story as Done: ${story.title ?? story.id}`));
      } else {
        console.log(chalk.bold(`Story: ${story.title ?? story.id}\n`));
        console.log(chalk.dim(`ID: ${story.id}`));
        console.log(chalk.dim(`Status: ${story.status ?? '-'}`));
        console.log(chalk.dim(`Description: ${(story.description ?? '').slice(0, 200)}`));
      }
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  });

export { taskCommand, storyCommand };
