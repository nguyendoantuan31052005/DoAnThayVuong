const { spawn } = require('node:child_process');
const { lookup } = require('node:dns/promises');
const { existsSync, mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
async function main() {
  const temporaryConfig = process.env.DOCKER_CONFIG ? undefined : mkdtempSync(join(tmpdir(), 'phishing-docker-build-'));
  const args = ['--config', process.env.DOCKER_CONFIG || temporaryConfig, 'build'];
  if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) {
    args.push('--network', 'host');
    const hosts = new Set();
    for (const variable of ['HTTP_PROXY', 'HTTPS_PROXY']) {
      if (!process.env[variable]) continue;
      const hostname = new URL(process.env[variable]).hostname;
      if (!hosts.has(hostname)) {
        hosts.add(hostname);
        const { address } = await lookup(hostname, { family: 4 });
        args.push('--add-host', `${hostname}:${address}`);
      }
      args.push('--build-arg', variable);
    }
    if (process.env.NO_PROXY) args.push('--build-arg', 'NO_PROXY');
    if (process.env.NODE_EXTRA_CA_CERTS && existsSync(process.env.NODE_EXTRA_CA_CERTS)) args.push('--secret', `id=proxy_ca,src=${process.env.NODE_EXTRA_CA_CERTS}`);
  }
  args.push('-t', process.env.DOCKER_IMAGE || 'phishing-backend:local', '.');
  try {
    const child = spawn('docker', args, { stdio: 'inherit' });
    const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('exit', resolve); });
    process.exitCode = code || 0;
  } finally { if (temporaryConfig) rmSync(temporaryConfig, { recursive: true, force: true }); }
}
main().catch(() => { console.error('Docker build failed; check daemon, registry access and proxy configuration.'); process.exitCode = 1; });
