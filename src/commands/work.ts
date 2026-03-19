import { Command } from 'commander';
import chalk from 'chalk';
import prompts from 'prompts';
import Table from 'cli-table3';
import {
  addWork,
  getWorks,
  getWorkByIndex,
  pauseWork,
  resumeWork,
  removeWork,
  completeWork,
  computeWorkDuration,
  getWorkspaceState,
  setLinkedWorklogProject,
} from '../db/index.js';
import { createWorklogClient } from '../api/worklog.js';
import { requireWorklogAuth, getWorklogUserIdFromCookie } from '../config/index.js';

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours.toFixed(1)}h`;
}

const startCommand = new Command('start').description('Start work, prompt for name').action(async () => {
  try {
    const { name } = await prompts({
      type: 'text',
      name: 'name',
      message: 'Enter work name:',
      validate: (v: string) => (v?.trim() ? true : 'Name is required'),
    });
    if (!name?.trim()) {
      process.exit(1);
    }
    const work = await addWork({
      id: crypto.randomUUID(),
      name: name.trim(),
      startTime: Date.now(),
      status: 'active',
    });
    console.log(chalk.green(`Started: ${work.name}`));
  } catch (err) {
    console.error(chalk.red((err as Error).message));
    process.exit(2);
  }
});

const wlistCommand = new Command('wlist')
  .description('List ongoing works')
  .option('-a, --all', 'Include done tasks')
  .action(async (opts) => {
    try {
      const works = await getWorks(opts.all);
      if (works.length === 0) {
        console.log(chalk.gray('No works found.'));
        return;
      }
      const table = new Table({
        head: ['#', 'Name', 'Status', 'Duration'],
        colWidths: [4, 40, 10, 10],
      });
      works.forEach((w, i) => {
        const hours = computeWorkDuration(w);
        table.push([i + 1, w.name, w.status, formatHours(hours)]);
      });
      console.log(table.toString());
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  });

const pauseCommand = new Command('pause')
  .description('Pause work by index')
  .argument('<id>', 'Work index')
  .action(async (idStr) => {
    try {
      const index = parseInt(idStr, 10);
      if (isNaN(index) || index < 1) {
        console.error(chalk.red('Invalid index. Use a positive number.'));
        process.exit(1);
      }
      const work = await pauseWork(index);
      if (!work) {
        console.error(chalk.red('Work not found or not active.'));
        process.exit(2);
      }
      console.log(chalk.green(`Paused: ${work.name}`));
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  });

const resumeCommand = new Command('resume')
  .description('Resume paused work by index')
  .argument('<id>', 'Work index')
  .action(async (idStr) => {
    try {
      const index = parseInt(idStr, 10);
      if (isNaN(index) || index < 1) {
        console.error(chalk.red('Invalid index. Use a positive number.'));
        process.exit(1);
      }
      const work = await resumeWork(index);
      if (!work) {
        console.error(chalk.red('Work not found or not paused.'));
        process.exit(2);
      }
      console.log(chalk.green(`Resumed: ${work.name}`));
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  });

const removeCommand = new Command('remove')
  .description('Remove work by index')
  .argument('<id>', 'Work index')
  .action(async (idStr) => {
    try {
      const index = parseInt(idStr, 10);
      if (isNaN(index) || index < 1) {
        console.error(chalk.red('Invalid index. Use a positive number.'));
        process.exit(1);
      }
      const ok = await removeWork(index);
      if (!ok) {
        console.error(chalk.red('Work not found or already done.'));
        process.exit(2);
      }
      console.log(chalk.green('Removed.'));
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  });

const doneCommand = new Command('done')
  .description('Complete work, calculate hours, submit to worklog')
  .argument('<id>', 'Work index')
  .option('-n, --no-submit', 'Skip worklog submission')
  .action(async (idStr, opts) => {
    try {
      const index = parseInt(idStr, 10);
      if (isNaN(index) || index < 1) {
        console.error(chalk.red('Invalid index. Use a positive number.'));
        process.exit(1);
      }
      const work = await getWorkByIndex(index);
      if (!work) {
        console.error(chalk.red('Work not found.'));
        process.exit(2);
      }
      if (work.status === 'done') {
        console.error(chalk.red('Work already done.'));
        process.exit(2);
      }
      const completed = await completeWork(index);
      if (!completed) {
        console.error(chalk.red('Failed to complete work.'));
        process.exit(2);
      }
      const hours = computeWorkDuration(completed);
      console.log(chalk.green(`Done: ${completed.name} (${formatHours(hours)})`));

      if (opts.submit !== false) {
        try {
          const cookie = requireWorklogAuth();
          const userId = getWorklogUserIdFromCookie(cookie);
          if (!userId) {
            console.log(chalk.yellow('Could not get userId from cookie. Use hz worklog add to submit manually.'));
            return;
          }
          const ws = await getWorkspaceState();
          let projectId = ws.linkedWorklogProjectId;
          if (!projectId) {
            const client = createWorklogClient(cookie);
            const { projects } = await client.getUserData();
            if (projects.length === 0) {
              console.log(chalk.yellow('No worklog projects. Run hz worklog projects to see.'));
              return;
            }
            const { idx } = await prompts({
              type: 'select',
              name: 'idx',
              message: 'Select worklog project:',
              choices: projects.map((p, i) => ({
                title: `${p.title ?? p.name ?? p.id}`,
                value: i,
              })),
            });
            if (idx == null) return;
            const proj = projects[idx];
            if (!proj) return;
            projectId = proj.id;
            await setLinkedWorklogProject(projectId);
          }
          const client = createWorklogClient(cookie);
          await client.addWorklog({
            projectId,
            userId: getWorklogUserIdFromCookie(cookie) ?? '',
            taskPhase: 'DEVELOPMENT',
            workLogType: 'TECH',
            hoursWorked: hours,
            notes: completed.name,
            date: new Date(completed.endTime ?? Date.now()).toISOString(),
          });
          console.log(chalk.green(`Submitted to worklog: ${formatHours(hours)}`));
        } catch (err) {
          console.log(chalk.yellow(`Worklog submit skipped: ${(err as Error).message}`));
        }
      }
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  });

export { startCommand, wlistCommand, pauseCommand, resumeCommand, removeCommand, doneCommand };
