import { Command } from 'commander';
import chalk from 'chalk';
import crypto from 'node:crypto';
import { getWorkspaceState } from '../../db/repositories/workspace.repository.js';
import {
  addPendingWork,
  removePendingWork,
  findPendingWorkByHashPrefix,
} from '../../db/repositories/pending-works.repository.js';
import { addToRecentWorklogProjects } from '../../db/repositories/recent-worklog-projects.repository.js';
import { createWorklogClient } from '../../api/index.js';
import { missing, requireStringForAction } from '../common/index.js';
import { requireWorklogAuth, formatHours } from './common/index.js';
import { clearWorklogAuth } from '../../db/repositories/worklog-auth.repository.js';

export const startCommand = new Command('start')
  .description('Start work (active project required)')
  .argument('<name>', 'Work name')
  .action(async (name) => {
    try {
      const ws = await getWorkspaceState();
      const linked = ws.linkedWorklogProject;
      if (!linked) {
        console.error(chalk.red('No active project. Run hz work active "project name" first.'));
        process.exit(2);
      }

      const projectId = requireStringForAction('Starting work', 'worklog project id', linked.id);
      const projectName = missing(linked.name);

      const id = crypto.randomBytes(3).toString('hex');
      const work = {
        id,
        name: name.trim(),
        startTime: Date.now(),
        projectId,
        projectName,
      };
      await addPendingWork(work);
      await addToRecentWorklogProjects({ id: projectId, name: projectName });
      console.log(chalk.green(`Started: ${work.name} (${id})`));
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  });

export const doneCommand = new Command('done')
  .description('Mark work done by hash prefix, sync to API')
  .argument('<hash>', 'Hash prefix (e.g. abc)')
  .action(async (hash) => {
    try {
      const work = await findPendingWorkByHashPrefix(hash);
      if (!work) {
        console.error(chalk.red('No pending work found for that hash.'));
        process.exit(2);
      }

      const { cookie, userId } = await requireWorklogAuth();
      const onUnauthorized = async () => {
        await clearWorklogAuth();
        console.error(chalk.red('Session expired. Run hz work login to sign in again.'));
        process.exit(2);
      };
      const client = createWorklogClient(cookie, onUnauthorized);

      const hours = (Date.now() - work.startTime) / (1000 * 60 * 60);
      try {
        await client.addWorklog({
          projectId: work.projectId,
          userId,
          taskPhase: 'DEVELOPMENT',
          workLogType: 'TECH',
          hoursWorked: hours,
          notes: work.name,
          date: new Date().toISOString(),
        });
        await removePendingWork(work.id);
        console.log(chalk.green(`Task "${work.name}" marked as done. Time taken: ${formatHours(hours)}`));
      } catch (err) {
        console.error(chalk.red(`Marking done failed: ${(err as Error).message}`));
        process.exit(2);
      }
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  });
