import { Command } from 'commander';
import chalk from 'chalk';
import prompts from 'prompts';
import axios from 'axios';
import { setDashboardToken } from '../credentials/index.js';
import type { UserProfile } from '../schemas/user.js';

const API_BASE = 'https://api.studio.heizen.work';

function normalizeToken(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('Bearer ') ? trimmed : `Bearer ${trimmed}`;
}

async function validateToken(token: string): Promise<UserProfile> {
  const res = await axios.get<UserProfile>(`${API_BASE}/users/me`, {
    headers: { Authorization: token, Accept: 'application/json' },
    validateStatus: () => true,
  });
  if (res.status !== 200) {
    const msg = typeof res.data === 'object' && res.data !== null ? JSON.stringify(res.data) : String(res.data);
    throw new Error(`Token invalid (${res.status}): ${msg}`);
  }
  return res.data;
}

export const tokenCommand = new Command('token')
  .description('Set dashboard API token (validated against /users/me)')
  .argument('[token]', 'Token to set (or prompted if omitted)')
  .action(async (tokenArg: string | undefined) => {
    try {
      let token: string;
      if (tokenArg?.trim()) {
        token = normalizeToken(tokenArg);
      } else {
        const { value } = await prompts({
          type: 'password',
          name: 'value',
          message: 'Enter token:',
          validate: (v: string) => (v?.trim() ? true : 'Token is required'),
        });
        if (!value?.trim()) process.exit(1);
        token = normalizeToken(value);
      }

      await validateToken(token);
      const { usedKeytar } = await setDashboardToken(token);
      console.log(chalk.green('Token saved successfully.'));
      if (!usedKeytar) {
        console.log(chalk.yellow('Token saved (keytar unavailable, stored in local db).'));
      }
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  });
