import { Command } from 'commander';
import chalk from 'chalk';
import prompts from 'prompts';
import { getDb } from '../db/core.js';
import { DEFAULT_DB } from '../schemas/db.js';
import { deleteDashboardToken, deleteWorklogCookie } from '../credentials/index.js';

export const resetCommand = new Command('reset')
  .description('Clear local db, pending work, and auth tokens (with confirmation)')
  .action(async () => {
    try {
      console.log(chalk.red('This will clear any local state, pending worklogs, and auth tokens.'));
      console.log(chalk.dim(`Run 'hz token' and 'hz work login' afterward.`));
      const { confirmed } = await prompts({
        type: 'confirm',
        name: 'confirmed',
        message: 'Reset all local data?',
        initial: false,
      });
      if (!confirmed) {
        console.log(chalk.gray('Reset cancelled.'));
        return;
      }

      await deleteDashboardToken();
      await deleteWorklogCookie();

      const db = await getDb();
      db.data = { ...DEFAULT_DB };
      await db.write();

      console.log(chalk.green('Reset complete. Local db, pending work, and auth tokens cleared.'));
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  });
