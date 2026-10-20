const { execFileSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const { mkdtempSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const dir = mkdtempSync(join(tmpdir(), 'phishing-docker-smoke-'));
const dockerConfig = process.env.DOCKER_CONFIG || join(dir, 'docker-config');
const suffix = randomBytes(6).toString('hex');
const name = 'phishing-smoke-' + suffix;
const volume = name + '-data';
const image = process.env.DOCKER_IMAGE || 'phishing-backend:local';
function docker(...args) { return execFileSync('docker', ['--config', dockerConfig, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
function check(ok, message) { if (!ok) throw new Error(message); }
async function waitReady(base) {
  for (let attempt = 0; attempt < 80; attempt++) {
    try { const r = await fetch(base + '/health', { signal: AbortSignal.timeout(500) }); if (r.ok && (await r.json()).status === 'ok') return; } catch {}
    await delay(250);
  }
  throw new Error('Container did not become ready');
}
async function main() {
  const envFile = join(dir, 'runtime.env');
  writeFileSync(envFile, 'JWT_SECRET=' + randomBytes(32).toString('hex') + '\n', { mode: 0o600 });
  try {
    docker('run', '-d', '--name', name, '--env-file', envFile, '-p', '127.0.0.1::3000', '-v', volume + ':/data', image);
    function baseUrl() { return 'http://127.0.0.1:' + docker('inspect', '--format', '{{(index (index .NetworkSettings.Ports "3000/tcp") 0).HostPort}}', name) + '/api'; }
    let base = baseUrl();
    await waitReady(base);
    const response = await fetch(base + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'smoke@example.com', name: 'Smoke Test', password: 'Aa1-' + randomBytes(16).toString('hex') }) });
    check(response.status === 201, 'Container registration failed');
    const { accessToken } = await response.json();
    docker('restart', name);
    base = baseUrl();
    await waitReady(base);
    const auth = { Authorization: 'Bearer ' + accessToken };
    check((await fetch(base + '/auth/me', { headers: auth })).status === 200, 'Session/database did not survive restart');
    check((await fetch(base + '/auth/logout', { method: 'POST', headers: auth })).status === 200, 'Logout failed');
    check((await fetch(base + '/auth/me', { headers: auth })).status === 401, 'Revoked token still works');
    console.log('Docker smoke PASS: startup, migration, registration, restart persistence, logout/token revocation.');
  } catch (error) {
    try { console.error(docker('logs', '--tail', '35', name)); } catch {}
    throw error;
  } finally {
    try { docker('rm', '-f', name); } catch {}
    try { docker('volume', 'rm', volume); } catch {}
    rmSync(dir, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
