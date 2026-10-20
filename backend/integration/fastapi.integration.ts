import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { setup } from '../test/helpers';

test('NestJS → FastAPI HTTP thật → SQLite (fixture, không đánh giá ML)', { timeout: 20000 }, async () => {
  const ctx = await setup();
  const child = spawn(process.env.PYTHON_EXECUTABLE || 'python', ['-u', 'integration/fastapi_fixture.py'], { stdio: ['ignore', 'pipe', 'pipe'] });
  child.stderr!.on('data', () => { /* Uvicorn diagnostics are not prediction evidence. */ });
  const lines = createInterface({ input: child.stdout! });
  try {
    const port = await new Promise<number>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('FastAPI startup timed out; install integration/requirements.txt')), 5000);
      child.once('error', error => { clearTimeout(timeout); reject(error); });
      child.once('exit', code => { clearTimeout(timeout); reject(new Error(`FastAPI exited ${code}; install integration/requirements.txt`)); });
      lines.once('line', line => { clearTimeout(timeout); try { resolve(JSON.parse(line).port); } catch { reject(new Error('Invalid fixture startup response')); } });
    });
    let ready = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      try { ready = (await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(200) })).ok; } catch { /* Await readiness. */ }
      if (ready) break;
      await delay(100);
    }
    assert.ok(ready, 'FastAPI did not become ready');
    process.env.AI_API_URL = `http://127.0.0.1:${port}/predict`;
    process.env.AI_API_TOKEN = 'integration-fixture-token';
    const account = await ctx.request('/auth/register', 'POST', { email: 'integration@example.com', name: 'Integration', password: 'Integration-password-123' });
    assert.equal(account.status, 201);
    const token = account.data.accessToken;
    const result = await ctx.request('/scans', 'POST', { url: 'https://example.com' }, token);
    assert.equal(result.status, 201);
    assert.equal(result.data.riskScore, 85);
    assert.equal(result.data.modelVersion, 'fastapi-contract-fixture');
    assert.equal(result.data.riskLevel, 'DANGEROUS');
    const history = await ctx.request('/scans', 'GET', undefined, token);
    assert.equal(history.data.total, 1);
    assert.equal(history.data.items[0].id, result.data.id);
    delete process.env.AI_API_TOKEN;
    assert.equal((await ctx.request('/scans', 'POST', { url: 'https://example.com' }, token)).status, 503);
    assert.equal(await ctx.db.scan.count(), 1);
  } finally {
    lines.close();
    if (child.exitCode === null) { const exited = once(child, 'exit'); child.kill('SIGTERM'); await exited; }
    await ctx.close();
  }
});
