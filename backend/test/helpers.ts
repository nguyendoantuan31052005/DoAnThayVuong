import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

export async function setup() {
  const dir = mkdtempSync(join(tmpdir(), 'phishing-test-'));
  process.env.DATABASE_URL = `file:${join(dir, 'test.db')}`;
  process.env.JWT_SECRET = randomBytes(32).toString('hex');
  process.env.NODE_ENV = 'test';
  delete process.env.AI_API_URL;
  delete process.env.AI_API_TOKEN;
  process.env.AI_TIMEOUT_MS = '10000';
  execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { env: process.env, stdio: 'pipe' });
  const { bootstrap } = require('../dist/main');
  const { createDb } = require('../dist/database');
  const db = createDb();
  const app = await bootstrap(0);
  const address = app.getHttpServer().address();
  const base = `http://127.0.0.1:${address.port}/api`;
  async function request(path: string, method = 'GET', body?: unknown, token?: string) {
    const response = await fetch(base + path, {
      method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, data: await response.json() as any, headers: response.headers };
  }
  async function close() { await app.close(); await db.$disconnect(); rmSync(dir, { recursive: true, force: true }); }
  return { app, db, base, request, close, dir };
}
