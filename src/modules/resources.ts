import { Command } from 'commander';
import chalk, { ChalkInstance } from 'chalk';
import Table from 'cli-table3';
import { createDashboardClient } from '../api/index.js';
import { requireDashboardAuth } from '../config/index.js';
import { getLinkedProject } from './common/index.js';
import type { ProjectResource } from '../schemas/dashboard/index.js';

function resourceTypeColor(type: string): ChalkInstance {
  const t = (type ?? '').toLowerCase();
  if (t === 'document') return chalk.blue;
  if (t === 'figma') return chalk.magenta;
  if (t === 'repository') return chalk.green;
  return chalk.gray;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export const resourcesCommand = new Command('resources')
  .description('List project resources (documents, Figma, repositories)')
  .action(async () => {
    try {
      const project = await getLinkedProject();
      const token = requireDashboardAuth();
      const client = createDashboardClient(token);
      const resources = await client.getProjectResources(project.id);

      if (resources.length === 0) {
        console.log(chalk.gray('No resources in this project.'));
        return;
      }

      const table = new Table({
        head: ['#', 'Name', 'Type', 'Date', 'URL'],
        colWidths: [4, 30, 14, 12, 50],
      });

      resources.forEach((r, i) => {
        const typeColored = resourceTypeColor(r.resourceType as string)(r.resourceType as string);
        table.push([i + 1, r.resourceName, typeColored, formatDate(r.updatedAt), r.resourceURL]);
      });

      console.log(table.toString());
      console.log(chalk.dim('URLs are copyable; in many terminals they are clickable.'));
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  });
