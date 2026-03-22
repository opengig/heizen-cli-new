import { Command } from 'commander';
import chalk, { ChalkInstance } from 'chalk';
import prompts from 'prompts';
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

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatResourceUrl(url: string): string {
  try {
    return encodeURI(url);
  } catch {
    return url;
  }
}

function printResourceDetails(r: ProjectResource) {
  const typeStr = (r.resourceType ?? 'unknown') as string;
  const typeColored = resourceTypeColor(typeStr)(`[${typeStr}]`);
  console.log(`${r.resourceName} ${typeColored}`);
  console.log(chalk.dim(`Added: ${formatDateTime(r.updatedAt)}`));
  console.log(chalk.dim(formatResourceUrl(r.resourceURL)));
  console.log('');
}

export const resourcesCommand = new Command('resources')
  .description('List project resources (documents, Figma, repositories)')
  .option('-d, --details', 'Show full resource details')
  .action(async function () {
    const opts = this.opts();
    try {
      const project = await getLinkedProject();
      const token = await requireDashboardAuth();
      const client = createDashboardClient(token);
      const resources = await client.getProjectResources(project.id);

      if (resources.length === 0) {
        console.log(chalk.gray('No resources in this project.'));
        return;
      }

      if (opts.details) {
        resources.forEach((r) => printResourceDetails(r));
        return;
      }

      resources.forEach((r, i) => {
        const typeStr = (r.resourceType ?? 'unknown') as string;
        const typeColored = resourceTypeColor(typeStr)(`[${typeStr}]`);
        console.log(chalk.cyan(`${i + 1}. ${r.resourceName} `) + typeColored);
      });

      const { resourceNum } = await prompts({
        type: 'number',
        name: 'resourceNum',
        message: 'Enter resource number to view link:',
        min: 1,
        max: resources.length,
        initial: 1,
      });

      if (resourceNum == null) process.exit(1);

      const resource = resources[resourceNum - 1];
      if (!resource) {
        console.error(chalk.red('Resource not found.'));
        process.exit(2);
      }

      console.log('');
      console.log(chalk.dim(`Added: ${formatDateTime(resource.updatedAt)}`));
      console.log(chalk.dim(formatResourceUrl(resource.resourceURL)));
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  });
