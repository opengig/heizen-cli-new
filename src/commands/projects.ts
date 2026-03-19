import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { createDashboardClient } from '../api/dashboard.js';
import { requireDashboardAuth } from '../config/index.js';

const projectsCommand = new Command('projects')
  .description('Dashboard project commands (api.studio.heizen.work)')
  .addCommand(
    new Command('list')
      .description('Fetch all projects from Studio Heizen')
      .option('-a, --active', 'Show only active projects')
      .option('--inactive', 'Show only inactive projects')
      .action(async (opts) => {
        try {
          const token = requireDashboardAuth();
          const client = createDashboardClient(token);

          let active: boolean | undefined;
          if (opts.active) active = true;
          else if (opts.inactive) active = false;

          const projects = await client.getProjects(active);

          if (projects.length === 0) {
            console.log(chalk.gray('No projects found.'));
            return;
          }

          const table = new Table({
            head: ['ID', 'Title', 'Unique Name', 'Active'],
            colWidths: [28, 30, 20, 8],
          });

          for (const p of projects) {
            table.push([p.id, p.title ?? '-', p.uniqueName ?? '-', p.active !== undefined ? String(p.active) : '-']);
          }
          console.log(table.toString());
        } catch (err) {
          console.error(chalk.red((err as Error).message));
          process.exit(2);
        }
      })
  );

export default projectsCommand;
