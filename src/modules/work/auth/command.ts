import { Command } from 'commander';
import chalk from 'chalk';
import prompts from 'prompts';
import { setWorklogAuth, clearWorklogAuth } from '../../../db/repositories/worklog-auth.repository.js';
import { worklogLogin, createWorklogClient } from '../../../api/index.js';
import { requireWorklogAuth } from '../common/index.js';

export const loginCommand = new Command('login').description('Interactive login').action(async () => {
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
});

export const refreshCommand = new Command('refresh').description('Refetch from user.data endpoint').action(async () => {
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
});
