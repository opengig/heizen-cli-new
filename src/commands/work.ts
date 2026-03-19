import { Command } from 'commander';
import chalk from 'chalk';
import prompts from 'prompts';
import Table from 'cli-table3';
import crypto from 'node:crypto';
import {
  getWorklogCookie,
  getWorklogUserData,
  setWorklogAuth,
  clearWorklogAuth,
  getRecentWorklogProjects,
  addToRecentWorklogProjects,
  getLinkedWorklogProject,
  setLinkedWorklogProject,
  getPendingWorks,
  addPendingWork,
  removePendingWork,
  findPendingWorkByHashPrefix,
} from '../db/index.js';
import { worklogLogin, createWorklogClient } from '../api/worklog.js';

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours.toFixed(1)}h`;
}

function getDateRangeForDay(daysAgo: number): { start: string; end: string } {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  const start = d.toISOString();
  const end = new Date(d);
  end.setDate(end.getDate() + 1);
  end.setMilliseconds(-1);
  return { start, end: end.toISOString() };
}

function projectDisplayName(p: { id: string; name?: string; title?: string }): string {
  return p.name ?? p.title ?? p.id;
}

async function requireWorklogAuth(): Promise<{ cookie: string; userId: string }> {
  const cookie = await getWorklogCookie();
  if (!cookie) {
    console.error(chalk.red('Run hz work login to sign in.'));
    process.exit(2);
  }
  const userData = await getWorklogUserData();
  if (!userData?.userId) {
    console.error(chalk.red('Session expired. Run hz work login to sign in again.'));
    await clearWorklogAuth();
    process.exit(2);
  }
  return { cookie, userId: userData.userId };
}

const workCommand = new Command('work')
  .description('Worklog commands (worklog.opengig.work)')
  .option('-p, --pending', 'List locally pending works')
  .option('-1', 'List worklogs for yesterday')
  .option('-n, --days <n>', 'List worklogs for n days ago', (v) => parseInt(v, 10))
  .argument('[days]', 'Days ago (e.g. 1 for yesterday)', (v) => (v ? parseInt(v, 10) : undefined))
  .action(async (daysArg, opts) => {
    try {
      if (opts.pending) {
        const works = await getPendingWorks();
        if (works.length === 0) {
          console.log(chalk.gray('No pending works.'));
          return;
        }
        const table = new Table({
          head: ['Hash', 'Name', 'Started', 'Project'],
          colWidths: [8, 36, 22, 24],
        });
        works.forEach((w) => {
          table.push([w.id, w.name, new Date(w.startTime).toLocaleString(), w.projectName]);
        });
        console.log(table.toString());
        return;
      }

      const daysAgo = opts['1'] ? 1 : (opts.days ?? daysArg ?? 0);
      const { cookie, userId } = await requireWorklogAuth();
      const onUnauthorized = async () => {
        await clearWorklogAuth();
        console.error(chalk.red('Session expired. Run hz work login to sign in again.'));
        process.exit(2);
      };
      const client = createWorklogClient(cookie, onUnauthorized);
      const { start, end } = getDateRangeForDay(daysAgo);
      const worklogs = await client.getWorklogs({ startDate: start, endDate: end, userId });

      if (worklogs.length === 0) {
        console.log(chalk.gray('No worklogs found.'));
        return;
      }

      const table = new Table({
        head: ['Date', 'Project', 'Hours', 'Phase', 'Type', 'Notes'],
        colWidths: [22, 24, 8, 12, 8, 30],
      });
      for (const w of worklogs) {
        const proj = (w as { project?: { title?: string; name?: string } }).project;
        const dateStr = (w as { date?: string; createdAt?: string }).date ?? (w as { date?: string; createdAt?: string }).createdAt;
        table.push([
          dateStr?.slice(0, 19) ?? '-',
          proj?.title ?? proj?.name ?? w.projectId,
          w.hoursWorked,
          w.taskPhase,
          w.workLogType,
          (w.notes ?? '').slice(0, 28),
        ]);
      }
      console.log(table.toString());
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  });

workCommand
  .addCommand(
    new Command('login').description('Interactive login').action(async () => {
      try {
        const { email } = await prompts({
          type: 'text',
          name: 'email',
          message: 'Enter email:',
          validate: (v: string) => (v?.trim() ? true : 'Email is required'),
        });
        if (!email?.trim()) process.exit(1);

        const { password } = await prompts({
          type: 'password',
          name: 'password',
          message: 'Enter password:',
          validate: (v: string) => (v ? true : 'Password is required'),
        });
        if (!password) process.exit(1);

        const cookies = await worklogLogin(email.trim(), password);
        if (cookies.length === 0) {
          console.error(chalk.red('No cookies received. Login may have failed.'));
          process.exit(2);
        }

        const cookieString = cookies
          .map((c) => c.split(';')[0])
          .filter(Boolean)
          .join('; ');

        const client = createWorklogClient(cookieString);
        const { userId, projects } = await client.getUserData();
        if (!userId) {
          console.error(chalk.red('Could not fetch user data. Login may have failed.'));
          process.exit(2);
        }

        await setWorklogAuth(cookieString, { userId, projects });
        console.log(chalk.green('Logged in successfully.'));
      } catch (err) {
        console.error(chalk.red((err as Error).message));
        process.exit(2);
      }
    })
  )
  .addCommand(
    new Command('refresh').description('Refetch from user.data endpoint').action(async () => {
      try {
        const { cookie } = await requireWorklogAuth();
        const onUnauthorized = async () => {
          await clearWorklogAuth();
          console.error(chalk.red('Session expired. Run hz work login to sign in again.'));
          process.exit(2);
        };
        const client = createWorklogClient(cookie, onUnauthorized);
        const { userId, projects } = await client.getUserData();
        await setWorklogAuth(cookie, { userId, projects });
        console.log(chalk.green('Refreshed user data.'));
      } catch (err) {
        console.error(chalk.red((err as Error).message));
        process.exit(2);
      }
    })
  )
  .addCommand(
    new Command('projects')
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
                (p) =>
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
            list.forEach((p, i) => table.push([i + 1, p.id, projectDisplayName(p)]));
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
            projects.slice(0, 10).forEach((p, i) => table.push([i + 1, p.id, projectDisplayName(p)]));
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
      })
  )
  .addCommand(
    new Command('active')
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
            (p) =>
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
                chalk.green(
                  `Active project changed from '${prevName}' to '${projectDisplayName(p)}' for this directory.`
                )
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
          filtered.slice(0, 5).forEach((p, i) => table.push([i + 1, projectDisplayName(p)]));
          console.log(table.toString());
          console.error(chalk.red(`+${filtered.length - 5} more projects found.`));
          process.exit(2);
        } catch (err) {
          console.error(chalk.red((err as Error).message));
          process.exit(2);
        }
      })
  )
  .addCommand(
    new Command('start')
      .description('Start work (active project required)')
      .argument('<name>', 'Work name')
      .action(async (name) => {
        try {
          const linked = await getLinkedWorklogProject();
          if (!linked) {
            console.error(chalk.red('No active project. Run hz work active "project name" first.'));
            process.exit(2);
          }

          const id = crypto.randomBytes(3).toString('hex');
          const work = {
            id,
            name: name.trim(),
            startTime: Date.now(),
            projectId: linked.id,
            projectName: linked.name,
          };
          await addPendingWork(work);
          await addToRecentWorklogProjects({ id: linked.id, name: linked.name });
          console.log(chalk.green(`Started: ${work.name} (${id})`));
        } catch (err) {
          console.error(chalk.red((err as Error).message));
          process.exit(2);
        }
      })
  )
  .addCommand(
    new Command('done')
      .description('Mark work done by hash prefix, sync to API')
      .argument('<hash>', 'Hash prefix (e.g. abc)')
      .action(async (hash) => {
        try {
          const work = await findPendingWorkByHashPrefix(hash);
          if (!work) {
            console.error(chalk.red('No pending work found for that hash.'));
            process.exit(2);
          }

          const { cookie, userId } = await requireWorklogAuth();
          const onUnauthorized = async () => {
            await clearWorklogAuth();
            console.error(chalk.red('Session expired. Run hz work login to sign in again.'));
            process.exit(2);
          };
          const client = createWorklogClient(cookie, onUnauthorized);

          const hours = (Date.now() - work.startTime) / (1000 * 60 * 60);
          try {
            await client.addWorklog({
              projectId: work.projectId,
              userId,
              taskPhase: 'DEVELOPMENT',
              workLogType: 'TECH',
              hoursWorked: hours,
              notes: work.name,
              date: new Date().toISOString(),
            });
            await removePendingWork(work.id);
            console.log(chalk.green(`Task "${work.name}" marked as done. Time taken: ${formatHours(hours)}`));
          } catch (err) {
            console.error(chalk.red(`Marking done failed: ${(err as Error).message}`));
            process.exit(2);
          }
        } catch (err) {
          console.error(chalk.red((err as Error).message));
          process.exit(2);
        }
      })
  );

// todo later - edit, delete

export { workCommand };
