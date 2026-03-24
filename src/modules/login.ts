import { Command } from 'commander';
import chalk from 'chalk';
import http from 'node:http';
import open from 'open';
import { setDashboardToken } from '../credentials/index.js';

const LOCAL_HOST = '127.0.0.1';
const LOCAL_PORT = 7000;
const CALLBACK_PATH = '/oauth2callback';
const AUTH_URL = 'http://studio.heizen.work/auth/cli-callback';
const LOGIN_TIMEOUT_MS = 60_000;

function randomState(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function normalizeToken(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('Bearer ') ? trimmed : `Bearer ${trimmed}`;
}

async function waitForTokenFromCallback(): Promise<string> {
  const expectedState = randomState();
  const redirectUri = `http://${LOCAL_HOST}:${LOCAL_PORT}${CALLBACK_PATH}`;

  return new Promise((resolve, reject) => {
    let settled = false;

    const safeResolve = (token: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      server.close(() => resolve(token));
    };

    const safeReject = (err: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      server.close(() => reject(err));
    };

    const server = http.createServer((req, res) => {
      const url = new URL(req.url || '', `http://${LOCAL_HOST}:${LOCAL_PORT}`);

      if (url.pathname !== CALLBACK_PATH) {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }

      const token = url.searchParams.get('token');
      const returnedState = url.searchParams.get('state');

      if (!returnedState || returnedState !== expectedState) {
        res.statusCode = 400;
        res.end('Invalid state. You can close this tab.');
        safeReject(new Error('State mismatch in OAuth callback.'));
        return;
      }

      if (!token) {
        res.statusCode = 400;
        res.end('Missing token. You can close this tab.');
        safeReject(new Error('Callback did not include token.'));
        return;
      }

      res.statusCode = 200;
      res.end('Auth successful. You can close this tab.');
      safeResolve(normalizeToken(token));
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        safeReject(new Error(`Port ${LOCAL_PORT} is already in use. Close conflicting app and try again.`));
        return;
      }
      safeReject(err);
    });

    const timeout = setTimeout(() => {
      safeReject(new Error('Login timed out after 1 minute. Please run hz login again.'));
    }, LOGIN_TIMEOUT_MS);

    server.listen(LOCAL_PORT, LOCAL_HOST, async () => {
      try {
        const params = new URLSearchParams({
          redirect_uri: redirectUri,
          state: expectedState,
        });
        const url = `${AUTH_URL}?${params.toString()}`;
        console.log(chalk.cyan('Opening browser for auth...'));
        console.log(chalk.dim('If it does not open, use this URL:'));
        console.log(chalk.dim(url));
        await open(url);
      } catch (err) {
        safeReject(err as Error);
      }
    });
  });
}

export const loginCommand = new Command('login')
  .description('Sign in to dashboard using browser OAuth callback')
  .action(async () => {
    try {
      const token = await waitForTokenFromCallback();
      const { usedKeytar } = await setDashboardToken(token);
      console.log(chalk.green('Logged in successfully.'));
      if (!usedKeytar) {
        console.log(chalk.yellow('Token saved (keytar unavailable, stored in local db).'));
      }
    } catch (err) {
      console.error(chalk.red((err as Error).message));
      process.exit(2);
    }
  });
