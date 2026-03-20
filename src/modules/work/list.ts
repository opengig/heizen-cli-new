import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { getPendingWorks } from '../../db/repositories/pending-works.repository.js';
import { createWorklogClient } from '../../api/index.js';
import { requireWorklogAuth, getDateRangeForDay } from './common/index.js';
import { clearWorklogAuth } from '../../db/repositories/worklog-auth.repository.js';

export function createListCommand() {
  return new Command('work')
    .description('Worklog commands (worklog.opengig.work)')
    .option('-p, --pending', 'List locally pending works')
    .argument('[days]', 'Days ago (e.g. -5 for 5 days ago, 0 for today)', (v) => (v ? parseInt(v, 10) : 0))
    .action(async (daysArg: number, opts: { pending?: boolean }) => {
      try {
        if (opts.pending) {
          const works = await getPendingWorks();
          if (works.length === 0) {
            console.log(chalk.gray('No pending works.'));
            return;
          }
          const table = new Table({
            head: ['Hash', 'Name', 'Started', 'Project'],
            colWidths: [8, 36, 22, 24],
          });
          works.forEach((w) => {
            table.push([w.id, w.name, new Date(w.startTime).toLocaleString(), w.projectName]);
          });
          console.log(table.toString());
          return;
        }

        const daysAgo = daysArg ?? 0;
        const { cookie, userId } = await requireWorklogAuth();
        const onUnauthorized = async () => {
          await clearWorklogAuth();
          console.error(chalk.red('Session expired. Run hz work login to sign in again.'));
          process.exit(2);
        };
        const client = createWorklogClient(cookie, onUnauthorized);
        const { start, end, displayDate } = getDateRangeForDay(daysAgo);
        const worklogs = await client.getWorklogs({ startDate: start, endDate: end, userId });

        if (worklogs.length === 0) {
          console.log(chalk.gray('No worklogs found.'));
          return;
        }

        console.log(chalk.bold(displayDate));
        console.log('');
        const table = new Table({
          head: ['Project', 'Hours', 'Phase', 'Notes'],
          colWidths: [20, 8, 14, 36],
        });
        for (const w of worklogs) {
          const proj = (w as { project?: { title?: string; name?: string } }).project;
          table.push([
            proj?.title ?? proj?.name ?? w.projectId,
            w.hoursWorked,
            w.taskPhase,
            (w.notes ?? '').slice(0, 34),
          ]);
        }
        console.log(table.toString());
      } catch (err) {
        console.error(chalk.red((err as Error).message));
        process.exit(2);
      }
    });
}
