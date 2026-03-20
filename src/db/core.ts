import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { JSONFilePreset } from 'lowdb/node';
import type { Db } from '../schemas/db.js';
import { DEFAULT_DB } from '../schemas/db.js';

const DB_DIR = path.join(os.homedir(), '.hz');
const DB_PATH = path.join(DB_DIR, 'db.json');

let dbPromise: Promise<{ data: Db; read: () => Promise<void>; write: () => Promise<void> }> | null = null;

export async function getDb() {
  if (!dbPromise) {
    await fs.promises.mkdir(DB_DIR, { recursive: true });
    dbPromise = JSONFilePreset<Db>(DB_PATH, DEFAULT_DB);
  }
  return dbPromise;
}

export function getWorkspaceKey(): string {
  return process.cwd();
}
