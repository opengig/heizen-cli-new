import { Command } from 'commander';
import { Listr } from 'listr2';
import { execa } from 'execa';
import chalk from 'chalk';

const setupCommand = new Command('setup')
  .description('Setup project')
  .action(async () => {
    const tasks = new Listr([
      {
        title: 'Installing dependencies',
        task: async () => {
          await execa('bun', ['install'], { stdio: 'inherit' });
        }
      },
      {
        title: 'Finalizing',
        task: async () => {
          console.log(chalk.blue('Final step...'));
        }
      }
    ]);

    await tasks.run();

    console.log(chalk.green('✔ Setup complete'));
  });

export default setupCommand;