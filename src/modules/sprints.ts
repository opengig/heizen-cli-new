import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import {
  getWorkspaceState,
  getLinkedDashboardProjectId,
  setActiveSprint,
} from '../db/repositories/workspace.repository.js';
import { getProjectsCachedOrFetch } from './common/index.js';
import { sortSprintsByLatest } from './projects.js';
import type { Sprint } from '../schemas/dashboard.js';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getLatestActiveSprint(sprints: Sprint[]): Sprint | null {
  const active = sprints.filter((s) => s.status === 'Active');
  const sorted = sortSprintsByLatest(active);
  return sorted[0] ?? null;
}

function getLatestSprint(sprints: Sprint[]): Sprint | null {
  const sorted = sortSprintsByLatest(sprints);
  return sorted[0] ?? null;
}

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
        table.push([i + 1, s.name ?? '-', s.status ?? '-', formatDate(s.startDate), formatDate(s.endDate)]);
      });
      console.log(table.toString());
      console.log(chalk.dim('Use hz sprints set to set working sprint.'));
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  })
  .addCommand(
    new Command('set')
      .description('Set working sprint (latest active, or latest, or by -n index)')
      .argument('[index]', 'Sprint index from end: -0=latest, -1=second latest')
      .action(async (indexStr) => {
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
            if (indexStr) {
              console.error(chalk.red('No sprints in this project.'));
              process.exit(2);
            }
            console.log(chalk.gray('No sprints in this project.'));
            return;
          }

          let sprint: Sprint | null;
          if (indexStr) {
            const m = indexStr.match(/^-(\d+)$/);
            const n = m ? parseInt(m[1], 10) : parseInt(indexStr, 10);
            if (isNaN(n) || n < 0) {
              console.error(chalk.red('Invalid index. Use -0, -1, -2, etc.'));
              process.exit(1);
            }
            sprint = sprints[n] ?? null;
            if (!sprint) {
              console.error(chalk.red(`Sprint index ${n} not found. Only ${sprints.length} sprints.`));
              process.exit(2);
            }
          } else {
            sprint = getLatestActiveSprint(project.sprints ?? []) ?? getLatestSprint(project.sprints ?? []);
          }

          if (sprint) {
            await setActiveSprint(sprint.id);
            console.log(chalk.green(`Working sprint: ${sprint.name}`));
          }
        } catch (err) {
          console.error(chalk.red((err as Error).message));
          process.exit(2);
        }
      })
  );
