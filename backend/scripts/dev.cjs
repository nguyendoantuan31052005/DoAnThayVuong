const { spawn, spawnSync } = require('node:child_process');
const { join } = require('node:path');
const tsc = join(__dirname, '../node_modules/typescript/bin/tsc');
if (spawnSync(process.execPath, [tsc, '-p', 'tsconfig.json'], { stdio: 'inherit' }).status !== 0) process.exit(1);
const compiler = spawn(process.execPath, [tsc, '--watch', '--preserveWatchOutput'], { stdio: 'inherit' });
const server = spawn(process.execPath, ['--watch', 'dist/main.js'], { stdio: 'inherit' });
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  compiler.kill('SIGTERM'); server.kill('SIGTERM'); process.exitCode = code;
}
compiler.on('exit', code => stop(code || 0));
server.on('exit', code => stop(code || 0));
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
