import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { getProjectsCachedOrFetch } from './common/index.js';
import {
  getLinkedDashboardProjectId,
  setLinkedDashboardProject,
  setActiveSprint,
  getWorkspaceState,
} from '../db/repositories/workspace.repository.js';
import type { DashboardProject, Sprint } from '../schemas/dashboard.js';

function sortSprintsByLatest(sprints: Sprint[]): Sprint[] {
  return [...sprints].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
}

function getLatestSprint(sprints: Sprint[]): Sprint | null {
  const sorted = sortSprintsByLatest(sprints);
  return sorted[0] ?? null;
}

function getLatestActiveSprint(sprints: Sprint[]): Sprint | null {
  const active = sprints.filter((s) => s.status === 'Active');
  return getLatestSprint(active);
}

function getSprintCounts(sprints: Sprint[]) {
  const total = sprints.length;
  const active = sprints.filter((s) => s.status === 'Active').length;
  // const completed = sprints.filter((s) => s.status === 'Completed').length;
  const left = sprints.filter((s) => s.status === 'Not Started').length;
  const paused = sprints.filter((s) => s.status === 'Paused').length;
  return { total, active, left, paused };
}

function resolveProjectByName(projects: DashboardProject[], name: string): DashboardProject | null {
  const q = name.trim().toLowerCase();
  const exact = projects.find((p) => (p.title ?? '').toLowerCase() === q || (p.uniqueName ?? '').toLowerCase() === q);
  if (exact) return exact;

  const filtered = projects.filter(
    (p) => (p.title ?? '').toLowerCase().includes(q) || (p.uniqueName ?? '').toLowerCase().includes(q)
  );
  if (filtered.length === 1) return filtered[0];
  return null;
}

const projectsCommand = new Command('projects')
  .description('List dashboard projects or link project to this directory')
  .option('-v, --verbose', 'Para-wise output instead of table')
  .action(async (opts) => {
    try {
      const projects = await getProjectsCachedOrFetch(false);
      if (projects.length === 0) {
        console.log(chalk.gray('No projects found.'));
        return;
      }

      if (opts.verbose) {
        for (const p of projects) {
          const sprints = p.sprints ?? [];
          const { total, active, left, paused } = getSprintCounts(sprints);
          const latest = getLatestSprint(sprints);
          const parts: string[] = [];
          if (total > 0) parts.push(`total:${total}`);
          if (active > 0) parts.push(`active:${active}`);
          if (left > 0) parts.push(`left:${left}`);
          if (paused > 0) parts.push(`paused:${paused}`);
          const sprintLine = parts.length > 0 ? `Sprints: ${parts.join(', ')}` : '';
          console.log(chalk.bold(p.title ?? p.uniqueName ?? '-'));
          if (sprintLine) console.log(sprintLine);
          if (latest) console.log(`Latest: ${latest.name}`);
          console.log('');
        }
      } else {
        const table = new Table({
          head: ['#', 'Project', 'Sprints', 'Latest Sprint'],
          colWidths: [4, 30, 10, 25],
        });
        projects.forEach((p, i) => {
          const sprints = p.sprints ?? [];
          const latest = getLatestSprint(sprints);
          table.push([i + 1, p.title ?? p.uniqueName ?? '-', sprints.length, latest?.name ?? '-']);
        });
        console.log(table.toString());
        console.log(chalk.dim('Use hz projects open "project name" to link a project.'));
      }
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  })
  .addCommand(
    new Command('open')
      .description('Link project to this directory (resolve by name)')
      .argument('[name]', 'Project name to link')
      .action(async (name) => {
        try {
          const ws = await getWorkspaceState();
          const projects = await getProjectsCachedOrFetch(false);

          if (!name) {
            if (!getLinkedDashboardProjectId(ws)) {
              console.log(chalk.gray('No project linked. Run hz projects open "project name".'));
              return;
            }
            const project = projects.find((p) => p.id === getLinkedDashboardProjectId(ws));
            if (!project) {
              console.log(chalk.gray('Linked project not found. Run hz projects open "project name" to re-link.'));
              return;
            }
            const sprints = project.sprints ?? [];
            const sprint = ws.activeSprintId ? sprints.find((s) => s.id === ws.activeSprintId) : null;
            console.log(chalk.cyan(`Project: ${project.title ?? project.uniqueName}`));
            if (sprint) {
              console.log(chalk.cyan(`Working sprint: ${sprint.name}`));
            } else {
              console.log(chalk.gray("No working sprint. Set using 'hz sprints set'."));
            }
            return;
          }

          const project = resolveProjectByName(projects, name);
          if (project) {
            await setLinkedDashboardProject(project.id);
            const sprints = project.sprints ?? [];
            const activeSprint = getLatestActiveSprint(sprints) ?? getLatestSprint(sprints);
            if (activeSprint) {
              await setActiveSprint(activeSprint.id);
              console.log(chalk.green(`Linked: ${project.title ?? project.uniqueName}`));
              console.log(chalk.green(`Working sprint: ${activeSprint.name}`));
            } else {
              console.log(chalk.green(`Linked: ${project.title ?? project.uniqueName}`));
              console.log(chalk.gray('No sprints in this project.'));
            }
            return;
          }

          const q = name.trim().toLowerCase();
          const filtered = projects.filter(
            (p) => (p.title ?? '').toLowerCase().includes(q) || (p.uniqueName ?? '').toLowerCase().includes(q)
          );

          if (filtered.length === 0) {
            console.error(chalk.red('No project found.'));
            process.exit(2);
          }
          if (filtered.length >= 2 && filtered.length <= 5) {
            console.error(chalk.red('Multiple projects found. Type exact name or unique keyword to choose 1 project.'));
            process.exit(2);
          }
          const table = new Table({ head: ['#', 'Name'], colWidths: [4, 40] });
          filtered.slice(0, 5).forEach((p, i) => table.push([i + 1, p.title ?? p.uniqueName ?? '']));
          console.log(table.toString());
          console.error(chalk.red(`+${filtered.length - 5} more projects found.`));
          process.exit(2);
        } catch (err) {
          console.error(chalk.red((err as Error).message));
          process.exit(2);
        }
      })
  );

export { projectsCommand };
export { getLatestSprint, getLatestActiveSprint, sortSprintsByLatest };
