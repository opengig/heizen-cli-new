import { Command } from 'commander';
import chalk from 'chalk';
import prompts from 'prompts';
import Table from 'cli-table3';
import { getSprintBoardTasks } from './common/index.js';

export const taskCommand = new Command('task')
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
      const stories = task.stories;
      if (stories.length === 0) {
        console.log(chalk.gray(`Task ${taskIndex}: ${task.title} (empty)`));
        return;
      }
      console.log(chalk.bold(`Task ${taskIndex}: ${task.title}\n`));
      const table = new Table({
        head: ['#', 'ID', 'Title', 'Status'],
        colWidths: [4, 28, 40, 12],
      });
      stories.forEach((s, i) => {
        table.push([i + 1, s.id, s.title.slice(0, 38), s.status]);
      });
      console.log(table.toString());
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  });
