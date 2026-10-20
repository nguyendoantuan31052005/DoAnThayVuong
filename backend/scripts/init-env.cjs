const { existsSync, readFileSync, writeFileSync, renameSync, unlinkSync, chmodSync } = require('node:fs');
const { randomBytes, randomUUID } = require('node:crypto');
const { join } = require('node:path');
const { parse } = require('dotenv');

function initializeEnv({ directory = process.cwd(), docker = false, environment = process.env } = {}) {
  const target = join(directory, '.env');
  const template = readFileSync(join(directory, docker ? '.env.docker.example' : '.env.example'), 'utf8');
  const defaults = parse(template);
  if (defaults.JWT_SECRET || defaults.AI_API_TOKEN) throw new Error('Tệp mẫu phải để trống các khóa bí mật');
  const created = !existsSync(target);
  const original = created ? template : readFileSync(target, 'utf8');
  const values = parse(original);
  let updated = original;
  const added = [];
  for (const [key, value] of Object.entries(defaults)) {
    if (Object.hasOwn(values, key)) continue;
    if (!updated.endsWith('\n')) updated += '\n';
    updated += `${key}=${JSON.stringify(value)}\n`;
    added.push(key);
  }
  let generatedSecret = false;
  if (!values.JWT_SECRET && !environment.JWT_SECRET) {
    const secret = randomBytes(32).toString('hex');
    updated = updated.replace(/^\s*(?:export\s+)?JWT_SECRET\s*=.*$/gm, `JWT_SECRET=${secret}`);
    generatedSecret = true;
  }
  if (created) writeFileSync(target, updated, { flag: 'wx', mode: 0o600 });
  else if (updated !== original) {
    const temporary = join(directory, `.env.${randomUUID()}.tmp`);
    try {
      writeFileSync(temporary, updated, { flag: 'wx', mode: 0o600 });
      renameSync(temporary, target);
    } finally { if (existsSync(temporary)) unlinkSync(temporary); }
  }
  chmodSync(target, 0o600);
  return { created, added, generatedSecret };
}
module.exports = { initializeEnv };
if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    if (args.some(arg => arg !== '--docker')) throw new Error('Cách dùng: npm run env:init [-- --docker]');
    const result = initializeEnv({ docker: args.includes('--docker') });
    console.log(result.created ? 'Đã tạo tệp .env riêng cho môi trường này.' : 'Đã kiểm tra và giữ nguyên các giá trị cấu hình đang có.');
    if (result.added.length) console.log('Đã bổ sung biến còn thiếu: ' + result.added.join(', '));
    if (result.generatedSecret) console.log('Đã sinh JWT_SECRET ngẫu nhiên; giá trị chỉ lưu trong .env.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
