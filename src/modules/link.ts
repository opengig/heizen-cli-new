import { Command } from 'commander';
import chalk from 'chalk';
import { setLinkedProject } from '../db/repositories/workspace.repository.js';
import { getProjectsCachedOrFetch } from './common/index.js';

export const linkCommand = new Command('link')
  .description('Link project to this repo')
  .argument('<index>', 'Project index from hz projects')
  .action(async (indexStr) => {
    try {
      const index = parseInt(indexStr, 10);
      if (isNaN(index) || index < 1) {
        console.error(chalk.red('Invalid index. Use a positive number.'));
        process.exit(1);
      }
      const projects = await getProjectsCachedOrFetch();
      const project = projects[index - 1];
      if (!project) {
        console.error(chalk.red('Project not found. Run hz projects first.'));
        process.exit(2);
      }
      await setLinkedProject(project.id);
      console.log(chalk.green(`Linked: ${project.title ?? project.id}`));
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  });
