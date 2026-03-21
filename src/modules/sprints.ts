import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { getWorkspaceState } from '../db/repositories/workspace.repository.js';
import { getProjectsCachedOrFetch } from './common/index.js';

export const sprintsCommand = new Command('sprints').description('List sprints of linked project').action(async () => {
  try {
    const ws = await getWorkspaceState();
    if (!ws.linkedProjectId) {
      console.error(chalk.red('No project linked. Run hz link <index> first.'));
      process.exit(2);
    }
    const projects = await getProjectsCachedOrFetch();
    const project = projects.find((p) => p.id === ws.linkedProjectId);
    if (!project) {
      console.error(chalk.red('Linked project not found. Run hz projects to refresh.'));
      process.exit(2);
    }
    const sprints = project.sprints ?? [];
    if (sprints.length === 0) {
      console.log(chalk.gray('No sprints in this project.'));
      return;
    }
    const table = new Table({
      head: ['#', 'ID', 'Name', 'Status'],
      colWidths: [4, 28, 30, 12],
    });
    sprints.forEach((s, i) => {
      table.push([i + 1, s.id, s.name ?? '-', s.status ?? '-']);
    });
    console.log(table.toString());
    console.log(chalk.dim('Use hz sprint <#> to set active sprint.'));
  } catch (err) {
    console.error(chalk.red((err as Error).message));
    process.exit(2);
  }
});
