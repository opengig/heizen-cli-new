import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import prompts from 'prompts';
import {
  getWorkspaceState,
  getLinkedDashboardProjectId,
  setActiveSprint,
} from '../db/repositories/workspace.repository.js';
import { displayDateOnlyEnGB, getProjectsCachedOrFetch, missing, requireStringForAction } from './common/index.js';
import { sortSprintsByLatest } from './projects.js';

export const sprintsCommand = new Command('sprints')
  .description('List sprints of linked project or set working sprint')
  .action(async () => {
    try {
      const ws = await getWorkspaceState();
      const linkedId = getLinkedDashboardProjectId(ws);
      if (!linkedId) {
        console.error(chalk.red('No project linked. Run hz projects open "project name" first.'));
        process.exit(2);
      }
      const projects = await getProjectsCachedOrFetch(false);
      const project = projects.find((p) => p.id === linkedId);
      if (!project) {
        console.error(chalk.red('Linked project not found. Run hz projects to refresh.'));
        process.exit(2);
      }
      const sprints = sortSprintsByLatest(project.sprints ?? []);
      if (sprints.length === 0) {
        console.log(chalk.gray('No sprints in this project.'));
        return;
      }
      const table = new Table({
        head: ['#', 'Name', 'Status', 'Start', 'End'],
        colWidths: [4, 30, 14, 12, 12],
      });
      sprints.forEach((s, i) => {
        table.push([
          i + 1,
          missing(s.name),
          missing(s.status),
          displayDateOnlyEnGB(s.startDate),
          displayDateOnlyEnGB(s.endDate),
        ]);
      });
      console.log(table.toString());
      console.log(chalk.dim('Use hz sprints set to set working sprint.'));
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  })
  .addCommand(
    new Command('set').description('Set working sprint (interactive)').action(async () => {
      try {
        const ws = await getWorkspaceState();
        const linkedId = getLinkedDashboardProjectId(ws);
        if (!linkedId) {
          console.error(chalk.red('No project linked. Run hz projects open "project name" first.'));
          process.exit(2);
        }
        const projects = await getProjectsCachedOrFetch(false);
        const project = projects.find((p) => p.id === linkedId);
        if (!project) {
          console.error(chalk.red('Linked project not found. Run hz projects to refresh.'));
          process.exit(2);
        }
        const sprints = sortSprintsByLatest(project.sprints ?? []);

        if (sprints.length === 0) {
          console.log(chalk.gray('No sprints in this project.'));
          return;
        }

        sprints.forEach((s, i) => {
          console.log(chalk.cyan(`${i + 1}. ${missing(s.name)}`));
        });

        const { sprintNum } = await prompts({
          type: 'number',
          name: 'sprintNum',
          message: 'Enter sprint number to work on:',
          min: 1,
          max: sprints.length,
          initial: 1,
        });

        if (sprintNum == null) process.exit(1);

        const sprint = sprints[sprintNum - 1];
        if (!sprint) {
          console.error(chalk.red('Invalid sprint number.'));
          process.exit(2);
        }

        const sprintId = requireStringForAction('Setting working sprint', 'sprint id', sprint.id);
        await setActiveSprint(sprintId);
        console.log(chalk.green(`Working sprint: ${missing(sprint.name)}`));
      } catch (err) {
        console.error(chalk.red((err as Error).message));
        process.exit(2);
      }
    })
  );
