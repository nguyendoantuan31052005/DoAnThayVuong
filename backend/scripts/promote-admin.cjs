require('dotenv/config');
const { createDb } = require('../dist/database');
const db = createDb();
async function main() {
  const email = process.argv[2];
  if (!email) throw new Error('Usage: node scripts/promote-admin.cjs user@example.com');
  await db.user.update({ where: { email: email.toLowerCase() }, data: { role: 'ADMIN' } });
  console.log('Đã cấp quyền ADMIN cho tài khoản có sẵn.');
}
main().catch(() => { console.error('Không thể cấp quyền. Kiểm tra email đã đăng ký và kết nối database.'); process.exitCode = 1; }).finally(() => db.$disconnect());
