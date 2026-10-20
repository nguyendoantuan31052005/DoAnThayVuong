const { spawnSync } = require('node:child_process');
const { join } = require('node:path');
const { initializeEnv } = require('./init-env.cjs');
try {
  const result = initializeEnv();
  console.log(result.created ? 'Đã tạo .env riêng cho môi trường phát triển.' : 'Đã kiểm tra .env và giữ nguyên cấu hình đang dùng.');
  if (result.generatedSecret) console.log('Đã sinh khóa JWT riêng; không đưa .env lên GitHub.');
  for (const args of [
    ['node_modules/prisma/build/index.js', 'generate'],
    ['node_modules/prisma/build/index.js', 'migrate', 'deploy'],
    ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json'],
  ]) {
    const command = spawnSync(process.execPath, args.map((arg, index) => index === 0 ? join(process.cwd(), arg) : arg), { stdio: 'inherit' });
    if (command.status !== 0) process.exit(command.status || 1);
  }
  require('dotenv/config');
  require('../dist/config').validateConfig();
  console.log('Backend đã được thiết lập. Chạy npm start để khởi động.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
