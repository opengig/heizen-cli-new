import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { getProjectsCachedOrFetch } from './common/index.js';

const projectsCommand = new Command('projects')
  .description('Dashboard project commands (api.studio.heizen.work)')
  .action(async () => {
    try {
      const projects = await getProjectsCachedOrFetch(false);
      if (projects.length === 0) {
        console.log(chalk.gray('No projects found.'));
        return;
      }
      const table = new Table({
        head: ['#', 'ID', 'Title', 'Unique Name'],
        colWidths: [4, 28, 30, 20],
      });
      projects.forEach((p, i) => {
        table.push([i + 1, p.id, p.title ?? '-', p.uniqueName ?? '-']);
      });
      console.log(table.toString());
      console.log(chalk.dim('Use hz link <#> to link a project to this repo.'));
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  })
  .addCommand(
    new Command('list')
      .description('Fetch all projects from Studio Heizen')
      .option('-a, --active', 'Show only active projects')
      .option('--inactive', 'Show only inactive projects')
      .action(async (opts) => {
        try {
          let active: boolean | undefined;
          if (opts.active) active = true;
          else if (opts.inactive) active = false;

          const projects = await getProjectsCachedOrFetch(active);

          if (projects.length === 0) {
            console.log(chalk.gray('No projects found.'));
            return;
          }

          const table = new Table({
            head: ['#', 'ID', 'Title', 'Unique Name', 'Active'],
            colWidths: [4, 28, 30, 20, 8],
          });

          for (let i = 0; i < projects.length; i++) {
            const p = projects[i];
            table.push([
              i + 1,
              p.id,
              p.title ?? '-',
              p.uniqueName ?? '-',
              p.active !== undefined ? String(p.active) : '-',
            ]);
          }
          console.log(table.toString());
        } catch (err) {
          console.error(chalk.red((err as Error).message));
          process.exit(2);
        }
      })
  );

export { projectsCommand };
