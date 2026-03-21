import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { createDashboardClient } from '../api/index.js';
import { requireDashboardAuth } from '../config/index.js';
import { getWorkspaceState, setActiveSprint } from '../db/repositories/workspace.repository.js';
import { getProjectsCachedOrFetch } from './common/index.js';

const sprintCommand = new Command('sprint')
  .description('Sprint commands (api.studio.heizen.work)')
  .argument('[index]', 'Sprint index from hz sprints (or use board/done subcommands)')
  .action(async (indexStr) => {
    if (!indexStr) return;
    try {
      const index = parseInt(indexStr, 10);
      if (isNaN(index) || index < 1) return;
      const ws = await getWorkspaceState();
      if (!ws.linkedProjectId) {
        console.error(chalk.red('No project linked. Run hz link <index> first.'));
        process.exit(2);
      }
      const projects = await getProjectsCachedOrFetch();
      const project = projects.find((p) => p.id === ws.linkedProjectId);
      const sprints = project?.sprints ?? [];
      const sprint = sprints[index - 1];
      if (!sprint) {
        console.error(chalk.red('Sprint not found. Run hz sprints first.'));
        process.exit(2);
      }
      await setActiveSprint(sprint.id);
      const token = requireDashboardAuth();
      const client = createDashboardClient(token);
      const { tasks, columns } = await client.getSprintBoard(sprint.id);
      console.log(chalk.blue(`Sprint: ${sprint.name ?? sprint.id}\n`));
      const displayTasks =
        tasks.length > 0
          ? tasks
          : columns.map((c, i) => ({
              id: c.id ?? String(i),
              title: c.title,
              stories: c.stories ?? [],
            }));
      if (displayTasks.length === 0) {
        console.log(chalk.gray('No tasks in sprint board.'));
        return;
      }
      displayTasks.forEach((t, i) => {
        const stories = t.stories ?? [];
        console.log(chalk.bold(`${i + 1}. ${t.title ?? 'Task'}`));
        if (stories.length === 0) {
          console.log(chalk.gray('  (empty)'));
        } else {
          stories.forEach((s: { id?: string; title?: string; status?: string }, j: number) => {
            console.log(chalk.dim(`  ${j + 1}. ${(s.title ?? '').slice(0, 50)} [${s.status ?? '-'}]`));
          });
        }
        console.log('');
      });
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  })
  .addCommand(
    new Command('board')
      .description('Fetch sprint board')
      .argument('<sprintId>', 'Sprint ID')
      .action(async (sprintId) => {
        try {
          const token = requireDashboardAuth();
          const client = createDashboardClient(token);
          const { columns, sprint } = await client.getSprintBoard(sprintId);

          if (sprint) {
            console.log(chalk.blue(`Sprint: ${sprint.name ?? sprintId}\n`));
          }

          if (columns.length === 0) {
            console.log(chalk.gray('No columns/stories in sprint board.'));
            return;
          }

          for (const col of columns) {
            console.log(chalk.bold(col.title ?? 'Column'));
            const stories = col.stories ?? col.tasks ?? [];
            if (stories.length === 0) {
              console.log(chalk.gray('  (empty)'));
            } else {
              const table = new Table({
                head: ['ID', 'Title', 'Status', 'Story #'],
                colWidths: [28, 35, 12, 10],
              });
              for (const s of stories) {
                const story =
                  typeof s === 'object' && s !== null
                    ? (s as { id?: string; title?: string; status?: string; storyNumber?: number })
                    : {};
                table.push([
                  story.id ?? '-',
                  (story.title ?? '').slice(0, 33),
                  story.status ?? '-',
                  story.storyNumber ?? '-',
                ]);
              }
              console.log(table.toString());
            }
            console.log('');
          }
        } catch (err) {
          console.error(chalk.red((err as Error).message));
          process.exit(2);
        }
      })
  )
  .addCommand(
    new Command('done')
      .description('Mark user story as Done')
      .argument('<storyId>', 'Story ID')
      .option('-s, --sprint <sprintId>', 'Sprint ID (fallback: fetch story from board if GET story fails)')
      .action(async (storyId, opts) => {
        try {
          const token = requireDashboardAuth();
          const client = createDashboardClient(token);

          let story;
          try {
            story = await client.getStory(storyId);
          } catch {
            if (opts.sprint) {
              const { columns } = await client.getSprintBoard(opts.sprint);
              for (const col of columns) {
                const stories = col.stories ?? col.tasks ?? [];
                const found = stories.find((s: { id?: string }) => (s as { id?: string }).id === storyId);
                if (found) {
                  story = found as Parameters<typeof client.updateStory>[0];
                  break;
                }
              }
            }
            if (!story) {
              console.error(
                chalk.red(
                  `Could not fetch story ${storyId}. Try --sprint <sprintId> if the story is in a sprint board.`
                )
              );
              process.exit(2);
            }
          }

          story.status = 'Done';
          await client.updateStory(story);

          console.log(chalk.green(`Marked story ${storyId} as Done`));
        } catch (err) {
          console.error(chalk.red((err as Error).message));
          process.exit(2);
        }
      })
  );

export { sprintCommand };
