import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { createDashboardClient } from '../api/dashboard.js';
import { requireDashboardAuth } from '../config/index.js';
import { getWorkspaceState, setLinkedProject, cacheProjects, getCachedProjects } from '../db/index.js';
import type { DashboardProject } from '../schemas/dashboard.js';

async function getProjectsCachedOrFetch(): Promise<DashboardProject[]> {
  const cached = await getCachedProjects();
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached as DashboardProject[];
  }
  const token = requireDashboardAuth();
  const client = createDashboardClient(token);
  const projects = await client.getProjects(false);
  await cacheProjects(projects as unknown[]);
  return projects;
}

const linkCommand = new Command('link')
  .description('Link project to this repo')
  .argument('<index>', 'Project index from hz projects')
  .option('-w, --worklog <index>', 'Link worklog project (from hz work projects --all)')
  .action(async (indexStr, opts) => {
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
      if (opts.worklog) {
        const worklogIdx = parseInt(opts.worklog, 10);
        if (!isNaN(worklogIdx) && worklogIdx >= 1) {
          const { createWorklogClient } = await import('../api/worklog.js');
          const { getWorklogCookie, clearWorklogAuth } = await import('../db/index.js');
          const cookie = await getWorklogCookie();
          if (!cookie) {
            console.error(chalk.red('Run hz work login to sign in first.'));
            process.exit(2);
          }
          const onUnauthorized = async () => {
            await clearWorklogAuth();
            console.error(chalk.red('Session expired. Run hz work login to sign in again.'));
            process.exit(2);
          };
          const client = createWorklogClient(cookie, onUnauthorized);
          const { projects: wlProjects } = await client.getUserData();
          const wlProj = wlProjects[worklogIdx - 1];
          if (wlProj) {
            const { setLinkedWorklogProject } = await import('../db/index.js');
            const name = wlProj.name ?? wlProj.title ?? wlProj.id;
            await setLinkedWorklogProject({ id: wlProj.id, name });
            console.log(chalk.green(`Linked worklog: ${name}`));
          }
        }
      }
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  });

const sprintsCommand = new Command('sprints').description('List sprints of linked project').action(async () => {
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

export { linkCommand, sprintsCommand };
