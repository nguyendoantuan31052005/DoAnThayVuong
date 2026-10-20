const { readFileSync, writeFileSync } = require('node:fs');
const spec = JSON.parse(readFileSync('docs/openapi.json', 'utf8'));
const bodies = {
  RegisterDto: { email: '{{email}}', name: 'Demo User', password: '{{password}}' },
  LoginDto: { email: '{{email}}', password: '{{password}}' },
  ProfileDto: { name: 'Tên hiển thị mới' },
  PasswordDto: { currentPassword: '{{password}}', newPassword: '{{newPassword}}' },
  ScanDto: { url: '{{url}}' },
  ReportDto: { url: '{{url}}', description: 'Website có dấu hiệu giả mạo thương hiệu' },
  BlockDto: { blocked: true }, ReviewDto: { status: 'REVIEWING', adminNote: 'Đang xác minh báo cáo' },
};
const groups = new Map();
for (const [path, methods] of Object.entries(spec.paths)) {
  for (const [method, op] of Object.entries(methods)) {
    const destructive = path.endsWith('/logout') || path.endsWith('/password');
    const group = destructive ? 'Session — chạy sau cùng' : op.tags?.[0] || 'Other';
    if (!groups.has(group)) groups.set(group, []);
    const admin = path.startsWith('/api/admin/');
    const id = path.includes('/reports/') ? 'reportId' : path.includes('/users/') ? 'userId' : 'scanId';
    let url = '{{baseUrl}}' + path.replace(/^\/api/, '').replace('{id}', `{{${id}}}`);
    if (op.parameters?.some(p => p.in === 'query' && p.name === 'page')) url += '?page=1&pageSize=20';
    const req = { method: method.toUpperCase(), header: [], url, description: op.summary };
    if (op.security?.length) req.auth = { type: 'bearer', bearer: [{ key: 'token', value: admin ? '{{adminToken}}' : '{{token}}', type: 'string' }] };
    else req.auth = { type: 'noauth' };
    const ref = op.requestBody?.content?.['application/json']?.schema?.$ref?.split('/').pop();
    if (ref) {
      req.header.push({ key: 'Content-Type', value: 'application/json' });
      req.body = { mode: 'raw', raw: JSON.stringify(bodies[ref] || {}, null, 2), options: { raw: { language: 'json' } } };
    }
    const item = { name: `${method.toUpperCase()} ${path}`, request: req };
    let script;
    if (path === '/api/auth/login' || path === '/api/auth/register') script = "if (pm.response.code < 300) { const b = pm.response.json(); pm.collectionVariables.set('token', b.accessToken); pm.collectionVariables.set('userId', b.user.id); }";
    if (path === '/api/scans' && method === 'post') script = "if (pm.response.code === 201) pm.collectionVariables.set('scanId', pm.response.json().id);";
    if (path === '/api/reports' && method === 'post') script = "if (pm.response.code === 201) pm.collectionVariables.set('reportId', pm.response.json().id);";
    if (script) item.event = [{ listen: 'test', script: { type: 'text/javascript', exec: [script] } }];
    groups.get(group).push(item);
  }
}
const values = { baseUrl: 'http://localhost:3000/api', email: 'demo@example.com', password: 'change-this-demo-password', newPassword: 'another-demo-password', url: 'https://example.com', token: '', adminToken: '', userId: '', scanId: '', reportId: '' };
const collection = {
  info: { name: 'Phishing Backend — NestJS', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json', description: 'Collection tương tác. Cập nhật biến email/password; đăng ký hoặc đăng nhập để tự lưu token. Admin cần adminToken riêng. Kiểm tra URL cần FastAPI thật. Logout/password/delete/block thay đổi trạng thái: chạy có chủ ý, không dùng Run Collection như một test suite độc lập.' },
  variable: Object.entries(values).map(([key, value]) => ({ key, value, type: 'string' })),
  item: [...groups.entries()].sort(([a], [b]) => Number(a.startsWith('Session')) - Number(b.startsWith('Session'))).map(([name, item]) => ({ name, item })),
};
writeFileSync('docs/postman.collection.json', JSON.stringify(collection, null, 2) + '\n');
console.log('Exported Postman collection');
