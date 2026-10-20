require('dotenv/config');
try {
  const { validateConfig } = require('../dist/config');
  validateConfig();
  console.log('Cấu hình môi trường hợp lệ.');
  console.log(process.env.AI_API_URL ? 'Đã cấu hình endpoint AI; cần kiểm tra kết nối với dịch vụ thật.' : 'Chưa cấu hình AI_API_URL: chức năng kiểm tra URL sẽ trả 503, các API khác vẫn dùng được.');
} catch (error) {
  console.error(error.code === 'MODULE_NOT_FOUND' ? 'Chưa có bản build. Chạy npm run setup trước.' : error.message);
  process.exitCode = 1;
}
