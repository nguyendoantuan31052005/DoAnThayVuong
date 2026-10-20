import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, copyFileSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'dotenv';
const { initializeEnv } = require('../scripts/init-env.cjs');

function fixture(run: (directory: string) => void) {
  const directory = mkdtempSync(join(tmpdir(), 'phishing-env-'));
  for (const file of ['.env.example', '.env.docker.example']) copyFileSync(file, join(directory, file));
  try { run(directory); } finally { rmSync(directory, { recursive: true, force: true }); }
}
test('ENV: tạo cấu hình từ tệp mẫu với JWT ngẫu nhiên và đủ biến', () => fixture(directory => {
  const result = initializeEnv({ directory, environment: {} });
  const values = parse(readFileSync(join(directory, '.env')));
  assert.equal(result.created, true); assert.equal(result.generatedSecret, true);
  assert.equal(values.JWT_SECRET.length, 64);
  assert.equal(values.DATABASE_URL, 'file:./dev.db');
  for (const name of Object.keys(parse(readFileSync('.env.example')))) assert.ok(Object.hasOwn(values, name));
}));
test('ENV: giữ nguyên giá trị hiện có và chỉ bổ sung khóa thiếu', () => fixture(directory => {
  const original = '# Cấu hình riêng\nPORT=4321\nJWT_SECRET=fixture-secret-that-is-at-least-32-bytes\nAI_API_TOKEN=fixture-token\nCUSTOM_FLAG=keep-me\n';
  writeFileSync(join(directory, '.env'), original);
  const result = initializeEnv({ directory, environment: {} });
  const text = readFileSync(join(directory, '.env'), 'utf8'); const values = parse(text);
  assert.ok(text.startsWith(original)); assert.equal(values.PORT, '4321');
  assert.equal(values.AI_API_TOKEN, 'fixture-token'); assert.equal(values.CUSTOM_FLAG, 'keep-me');
  assert.equal(result.generatedSecret, false); assert.ok(result.added.includes('HTTP_RATE_LIMIT'));
}));
test('ENV: sao chép tệp mẫu với JWT trống vẫn được tự bổ sung khóa', () => fixture(directory => {
  copyFileSync(join(directory, '.env.example'), join(directory, '.env'));
  assert.equal(initializeEnv({ directory, environment: {} }).generatedSecret, true);
  assert.equal(parse(readFileSync(join(directory, '.env'))).JWT_SECRET.length, 64);
}));
test('ENV: không sao chép khóa được tiêm từ tiến trình vào tệp', () => fixture(directory => {
  const secret = 'fixture-external-secret-that-must-not-be-copied';
  const result = initializeEnv({ directory, environment: { JWT_SECRET: secret } });
  const text = readFileSync(join(directory, '.env'), 'utf8');
  assert.equal(result.generatedSecret, false); assert.ok(!text.includes(secret));
  assert.equal(parse(text).JWT_SECRET, '');
}));
test('ENV: cấu hình Docker dùng đường dẫn volume và chế độ production', () => fixture(directory => {
  initializeEnv({ directory, docker: true, environment: {} });
  const values = parse(readFileSync(join(directory, '.env')));
  assert.equal(values.NODE_ENV, 'production'); assert.equal(values.DATABASE_URL, 'file:/data/phishing.db');
}));
test('ENV: chạy lại không làm đổi khóa hoặc nội dung .env', () => fixture(directory => {
  initializeEnv({ directory, environment: {} });
  const original = readFileSync(join(directory, '.env'), 'utf8');
  const result = initializeEnv({ directory, environment: {} });
  assert.ok(readFileSync(join(directory, '.env'), 'utf8') === original);
  assert.equal(result.generatedSecret, false); assert.deepEqual(result.added, []);
}));
test('ENV: từ chối tệp mẫu có khóa bí mật được điền sẵn', () => fixture(directory => {
  writeFileSync(join(directory, '.env.example'), 'JWT_SECRET=fixture-secret\nAI_API_TOKEN=\n');
  assert.throws(() => initializeEnv({ directory, environment: {} }));
  assert.equal(existsSync(join(directory, '.env')), false);
}));
