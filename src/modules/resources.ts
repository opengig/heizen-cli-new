import { Command } from 'commander';
import chalk, { ChalkInstance } from 'chalk';
import { createDashboardClient } from '../api/index.js';
import { requireDashboardAuth } from '../config/index.js';
import { getLinkedProject } from './common/index.js';

function resourceTypeColor(type: string): ChalkInstance {
  const t = (type ?? '').toLowerCase();
  if (t === 'document') return chalk.blue;
  if (t === 'figma') return chalk.magenta;
  if (t === 'repository') return chalk.green;
  return chalk.gray;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

      resources.forEach((r) => {
        const typeStr = (r.resourceType ?? 'unknown') as string;
        const typeColored = resourceTypeColor(typeStr)(`[${typeStr}]`);
        console.log(`${r.resourceName} ${typeColored}`);
        console.log(chalk.dim(`Added: ${formatDateTime(r.updatedAt)}`));
        console.log(r.resourceURL);
        console.log('');
      });
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  });
