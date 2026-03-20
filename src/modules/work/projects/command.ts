import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { getRecentWorklogProjects } from '../../../db/repositories/recent-worklog-projects.repository.js';
import { createWorklogClient } from '../../../api/index.js';
import { requireWorklogAuth, projectDisplayName } from '../common/index.js';
import { clearWorklogAuth } from '../../../db/repositories/worklog-auth.repository.js';

export const projectsCommand = new Command('projects')
  .description('List worklog projects')
  .option('-a, --all', 'Show all projects')
  .argument('[filter]', 'Case-insensitive filter')
  .action(async (filter, opts) => {
    try {
      const { cookie } = await requireWorklogAuth();
      const onUnauthorized = async () => {
        await clearWorklogAuth();
        console.error(chalk.red('Session expired. Run hz work login to sign in again.'));
        process.exit(2);
      };
      const client = createWorklogClient(cookie, onUnauthorized);
      const { projects } = await client.getUserData();

      if (opts.all || filter) {
        let list = projects;
        if (filter) {
          const q = filter.toLowerCase();
          list = projects.filter(
            (p: { name?: string; title?: string; id?: string }) =>
              (p.name ?? '').toLowerCase().includes(q) ||
              (p.title ?? '').toLowerCase().includes(q) ||
              (p.id ?? '').toLowerCase().includes(q)
          );
        }
        if (list.length === 0) {
          console.log(chalk.gray('No projects found.'));
          return;
        }
        const table = new Table({ head: ['#', 'ID', 'Name'], colWidths: [4, 28, 40] });
        list.forEach((p: { id: string; name?: string; title?: string }, i: number) =>
          table.push([i + 1, p.id, projectDisplayName(p)])
        );
        console.log(table.toString());
        return;
      }

      const recent = await getRecentWorklogProjects();
      if (recent.length === 0) {
        if (projects.length === 0) {
          console.log(chalk.gray('No projects found.'));
          return;
        }
        const table = new Table({ head: ['#', 'ID', 'Name'], colWidths: [4, 28, 40] });
        projects
          .slice(0, 10)
          .forEach((p: { id: string; name?: string; title?: string }, i: number) =>
            table.push([i + 1, p.id, projectDisplayName(p)])
          );
        console.log(table.toString());
        if (projects.length >= 10) {
          console.log(chalk.dim('Use hz work projects --all to see all projects.'));
        }
        return;
      }

      const table = new Table({ head: ['#', 'ID', 'Name'], colWidths: [4, 28, 40] });
      recent.forEach((p, i) => table.push([i + 1, p.id, p.name]));
      console.log(table.toString());
      if (recent.length >= 10) {
        console.log(chalk.dim('Use hz work projects --all to see all projects.'));
      }
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  });
