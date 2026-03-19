import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { createWorklogClient } from '../api/worklog.js';
import {
  requireWorklogAuth,
  getWorklogUserIdFromCookie,
} from '../config/index.js';

function getDefaultDateRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  end.setMilliseconds(-1);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

const worklogCommand = new Command('worklog')
  .description('Worklog commands (worklog.opengig.work)')
  .addCommand(
    new Command('fetch')
      .description('Fetch worklogs for date range')
      .option('-s, --start <date>', 'Start date (ISO)', getDefaultDateRange().start)
      .option('-e, --end <date>', 'End date (ISO)', getDefaultDateRange().end)
      .option('-u, --userId <id>', 'User ID (default: from cookie)')
      .action(async (opts) => {
        try {
          const cookie = requireWorklogAuth();
          const userId = opts.userId ?? getWorklogUserIdFromCookie(cookie);
          if (!userId) {
            console.error(chalk.red('Could not determine userId. Use --userId or ensure cookie contains user data.'));
            process.exit(1);
          }

          const client = createWorklogClient(cookie);
          const worklogs = await client.getWorklogs({
            startDate: opts.start,
            endDate: opts.end,
            userId,
          });

          if (worklogs.length === 0) {
            console.log(chalk.gray('No worklogs found.'));
            return;
          }

          const table = new Table({
            head: ['Date', 'Project', 'Hours', 'Phase', 'Type', 'Notes'],
            colWidths: [22, 24, 8, 12, 8, 30],
          });

          for (const w of worklogs) {
            table.push([
              w.date?.slice(0, 19) ?? '-',
              (w as { project?: { title?: string } }).project?.title ?? w.projectId,
              w.hoursWorked,
              w.taskPhase,
              w.workLogType,
              (w.notes ?? '').slice(0, 28),
            ]);
          }
          console.log(table.toString());
        } catch (err) {
          console.error(chalk.red((err as Error).message));
          process.exit(2);
        }
      })
  )
  .addCommand(
    new Command('add')
      .description('Add worklog entry')
      .requiredOption('-p, --project <id>', 'Project ID (from worklog projects)')
      .requiredOption('-h, --hours <number>', 'Hours worked', parseFloat)
      .option('-n, --notes <text>', 'Notes')
      .option('-d, --date <iso>', 'Date (default: now)', new Date().toISOString())
      .option('--phase <phase>', 'Task phase', 'DEVELOPMENT')
      .option('--type <type>', 'Work log type', 'TECH')
      .option('-u, --userId <id>', 'User ID (default: from cookie)')
      .action(async (opts) => {
        try {
          const cookie = requireWorklogAuth();
          const userId = opts.userId ?? getWorklogUserIdFromCookie(cookie);
          if (!userId) {
            console.error(chalk.red('Could not determine userId. Use --userId or ensure cookie contains user data.'));
            process.exit(1);
          }

          const client = createWorklogClient(cookie);
          await client.addWorklog({
            projectId: opts.project,
            userId,
            taskPhase: opts.phase,
            workLogType: opts.type,
            hoursWorked: opts.hours,
            notes: opts.notes,
            date: opts.date,
          });

          console.log(chalk.green(`Added ${opts.hours}h worklog to project ${opts.project}`));
        } catch (err) {
          console.error(chalk.red((err as Error).message));
          process.exit(2);
        }
      })
  )
  .addCommand(
    new Command('projects')
      .description('List active projects from user.data')
      .action(async () => {
        try {
          const cookie = requireWorklogAuth();
          const client = createWorklogClient(cookie);
          const { projects } = await client.getUserData();

          if (projects.length === 0) {
            console.log(chalk.gray('No projects found.'));
            return;
          }

          const table = new Table({
            head: ['ID', 'Title'],
            colWidths: [28, 40],
          });

          for (const p of projects) {
            table.push([p.id, p.title ?? p.name ?? '-']);
          }
          console.log(table.toString());
        } catch (err) {
          console.error(chalk.red((err as Error).message));
          process.exit(2);
        }
      })
  );

export default worklogCommand;
