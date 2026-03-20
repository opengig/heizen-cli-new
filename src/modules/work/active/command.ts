import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { getLinkedWorklogProject, setLinkedWorklogProject } from '../../../db/repositories/workspace.repository.js';
import { createWorklogClient } from '../../../api/index.js';
import { requireWorklogAuth, projectDisplayName } from '../common/index.js';
import { clearWorklogAuth } from '../../../db/repositories/worklog-auth.repository.js';

export const activeCommand = new Command('active')
  .description('Show or set active project')
  .argument('[name]', 'Project name to set as active')
  .action(async (name) => {
    try {
      const { cookie } = await requireWorklogAuth();
      const onUnauthorized = async () => {
        await clearWorklogAuth();
        console.error(chalk.red('Session expired. Run hz work login to sign in again.'));
        process.exit(2);
      };
      const client = createWorklogClient(cookie, onUnauthorized);
      const { projects } = await client.getUserData();

      if (!name) {
        const linked = await getLinkedWorklogProject();
        if (!linked) {
          console.log(chalk.gray('No active project. Run hz work active "project name" to set one.'));
          return;
        }
        console.log(chalk.cyan(linked.name));
        return;
      }

      const q = name.trim();
      const exact = projects.find((p) => projectDisplayName(p).toLowerCase() === q.toLowerCase());
      if (exact) {
        const linked = await getLinkedWorklogProject();
        if (linked?.id === exact.id) {
          console.log(chalk.green('Active project already set.'));
          return;
        }
        const prevName = linked?.name;
        await setLinkedWorklogProject({ id: exact.id, name: projectDisplayName(exact) });
        if (prevName) {
          console.log(
            chalk.green(
              `Active project changed from '${prevName}' to '${projectDisplayName(exact)}' for this directory.`
            )
          );
        } else {
          console.log(chalk.green(`${projectDisplayName(exact)} project set as active for this directory.`));
        }
        return;
      }

      const filtered = projects.filter(
        (p: { name?: string; title?: string; id?: string }) =>
          (p.name ?? '').toLowerCase().includes(q.toLowerCase()) ||
          (p.title ?? '').toLowerCase().includes(q.toLowerCase())
      );

      if (filtered.length === 0) {
        console.error(chalk.red('No project found.'));
        process.exit(2);
      }
      if (filtered.length === 1) {
        const p = filtered[0];
        const linked = await getLinkedWorklogProject();
        if (linked?.id === p.id) {
          console.log(chalk.green('Active project already set.'));
          return;
        }
        const prevName = linked?.name;
        await setLinkedWorklogProject({ id: p.id, name: projectDisplayName(p) });
        if (prevName) {
          console.log(
            chalk.green(`Active project changed from '${prevName}' to '${projectDisplayName(p)}' for this directory.`)
          );
        } else {
          console.log(chalk.green(`${projectDisplayName(p)} project set as active for this directory.`));
        }
        return;
      }
      if (filtered.length >= 2 && filtered.length <= 5) {
        console.error(chalk.red('Multiple projects found. Type exact name or unique keyword to choose 1 project.'));
        process.exit(2);
      }
      const table = new Table({ head: ['#', 'Name'], colWidths: [4, 40] });
      filtered
        .slice(0, 5)
        .forEach((p: { id: string; name?: string; title?: string }, i: number) =>
          table.push([i + 1, projectDisplayName(p)])
        );
      console.log(table.toString());
      console.error(chalk.red(`+${filtered.length - 5} more projects found.`));
      process.exit(2);
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  });
