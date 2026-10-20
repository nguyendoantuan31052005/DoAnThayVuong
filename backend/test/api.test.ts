import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { setup } from './helpers';

test('API backend tích hợp SQLite', async t => {
  const ctx = await setup();
  const { db, request, base } = ctx;
  let mode = 'ok';
  let score = 85;
  let received: unknown;
  const ai = createServer((req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      received = JSON.parse(body);
      res.setHeader('Content-Type', 'application/json');
      if (mode === 'timeout') return;
      if (mode === 'redirect') { res.writeHead(302, { Location: 'http://127.0.0.1:1' }); res.end(); return; }
      if (mode === 'error') { res.writeHead(500); res.end('{}'); return; }
      if (mode === 'oversized') { res.end('x'.repeat(70000)); return; }
      if (mode === 'invalid') { res.end('{"riskScore":101,"reasons":[],"modelVersion":"bad"}'); return; }
      if (mode === 'null') { res.end('null'); return; }
      res.end(JSON.stringify({ riskScore: score, reasons: ['Test fixture only'], modelVersion: 'test-fixture' }));
    });
  });
  await new Promise<void>(resolve => ai.listen(0, '127.0.0.1', resolve));
  const endpoint = `http://127.0.0.1:${(ai.address() as any).port}/predict`;
  const input = { email: 'user@example.com', password: 'Password-12345', name: 'Test User' };
  let token: string, secondToken: string, admin: string, userId: string, adminId: string, scanId: string, reportId: string;
  try {
    await t.test('health kết nối DB, security headers và request ID', async () => {
      const r = await request('/health');
      assert.equal(r.status, 200); assert.equal(r.data.status, 'ok'); assert.equal(r.data.aiConfigured, false);
      assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
      assert.ok(r.headers.get('x-request-id')); assert.equal(r.headers.get('x-powered-by'), null);
    });
    await t.test('đăng ký không cho tự cấp quyền ADMIN', async () => {
      assert.equal((await request('/auth/register', 'POST', { ...input, role: 'ADMIN' })).status, 400);
    });
    await t.test('đăng ký chuẩn hóa email và không lộ passwordHash', async () => {
      const r = await request('/auth/register', 'POST', { ...input, email: ' User@Example.com ' });
      assert.equal(r.status, 201); assert.equal(r.data.user.email, input.email); assert.equal(r.data.user.role, 'USER');
      assert.equal(r.data.user.passwordHash, undefined); token = r.data.accessToken; userId = r.data.user.id;
    });
    await t.test('email trùng trả 409', async () => { assert.equal((await request('/auth/register', 'POST', input)).status, 409); });
    await t.test('đăng ký từ chối mật khẩu thiếu chữ hoa', async () => {
      assert.equal((await request('/auth/register', 'POST', { ...input, email: 'weak@example.com', password: 'weak-password-123' })).status, 400);
      assert.equal(await db.user.count(), 1);
    });
    await t.test('đăng nhập sai trả 401, đúng tạo phiên riêng', async () => {
      assert.equal((await request('/auth/login', 'POST', { email: input.email, password: 'incorrect-password' })).status, 401);
      const r = await request('/auth/login', 'POST', { email: input.email, password: input.password });
      assert.equal(r.status, 200); secondToken = r.data.accessToken; assert.notEqual(secondToken, token);
    });
    await t.test('thiếu token, token sai và JWT không có session đều bị từ chối', async () => {
      assert.equal((await request('/scans')).status, 401);
      assert.equal((await request('/scans', 'GET', undefined, 'invalid-token')).status, 401);
      const { JwtService } = require('@nestjs/jwt');
      const forged = new JwtService({ secret: process.env.JWT_SECRET }).sign({ sub: userId, jti: randomUUID() }, { issuer: 'phishing-backend', audience: 'phishing-web', expiresIn: '1h' });
      assert.equal((await request('/scans', 'GET', undefined, forged)).status, 401);
    });
    await t.test('User không có quyền gọi Admin', async () => { assert.equal((await request('/admin/stats', 'GET', undefined, token)).status, 403); });
    await t.test('cập nhật hồ sơ và chặn field lạ', async () => {
      const r = await request('/auth/me', 'PATCH', { name: ' Nguyễn Văn An ' }, token);
      assert.equal(r.status, 200); assert.equal(r.data.name, 'Nguyễn Văn An');
      assert.equal((await request('/auth/me', 'PATCH', { name: 'An', blocked: false }, token)).status, 400);
    });
    await t.test('URL không hợp lệ bị từ chối trước khi gọi AI', async () => {
      assert.equal((await request('/scans', 'POST', { url: 'file:///etc/passwd' }, token)).status, 400);
      assert.equal((await request('/scans', 'POST', { url: 'https://u:p@example.com' }, token)).status, 400);
    });
    await t.test('chưa cấu hình AI trả 503, không lưu scan', async () => {
      assert.equal((await request('/scans', 'POST', { url: 'https://example.com' }, token)).status, 503);
      assert.equal(await db.scan.count(), 0);
    });
    await t.test('AI thành công, chuẩn hóa URL, lưu điểm và giải thích', async () => {
      process.env.AI_API_URL = endpoint;
      const r = await request('/scans', 'POST', { url: 'https://EXAMPLE.com#fragment' }, token);
      assert.equal(r.status, 201); scanId = r.data.id;
      assert.deepEqual(received, { url: 'https://example.com/' });
      assert.equal(r.data.riskLevel, 'DANGEROUS'); assert.equal(r.data.riskScore, 85);
      assert.deepEqual(r.data.reasons, ['Test fixture only']); assert.equal(r.data.modelVersion, 'test-fixture');
    });
    for (const [value, level] of [[0, 'SAFE'], [30, 'SUSPICIOUS'], [70, 'DANGEROUS'], [100, 'DANGEROUS']] as const) {
      await t.test(`điểm ${value} trả ${level}`, async () => {
        score = value;
        const r = await request('/scans', 'POST', { url: 'https://example.com' }, token);
        assert.equal(r.status, 201); assert.equal(r.data.riskLevel, level);
      });
    }
    for (const failure of ['invalid', 'null', 'error', 'oversized', 'redirect', 'timeout']) {
      await t.test(`AI ${failure}: trả 503 và không lưu lịch sử lỗi`, async () => {
        mode = failure; process.env.AI_TIMEOUT_MS = '100';
        const before = await db.scan.count();
        assert.equal((await request('/scans', 'POST', { url: 'https://example.com' }, token)).status, 503);
        assert.equal(await db.scan.count(), before);
      });
    }
    mode = 'ok'; process.env.AI_TIMEOUT_MS = '10000';
    await t.test('phân trang lịch sử trả total, kiểm tra giới hạn query', async () => {
      const r = await request('/scans?page=1&pageSize=2', 'GET', undefined, token);
      assert.equal(r.status, 200); assert.equal(r.data.items.length, 2); assert.equal(r.data.total, 5); assert.equal(r.data.totalPages, 3);
      for (const q of ['page=bad', 'page=0', 'pageSize=101', 'pageSize=1.5', 'extra=1']) assert.equal((await request('/scans?' + q, 'GET', undefined, token)).status, 400);
    });
    await t.test('tóm tắt lịch sử có đúng số liệu của người đăng nhập', async () => {
      const r = await request('/scans/summary', 'GET', undefined, token);
      assert.equal(r.status, 200); assert.equal(r.data.total, 5); assert.equal(r.data.dangerousScans, 3); assert.ok(r.data.lastScan.id);
    });
    await t.test('bộ lọc URL, mức rủi ro và khoảng ngày có hiệu lực', async () => {
      assert.equal((await request('/scans?q=not-found', 'GET', undefined, token)).data.total, 0);
      assert.equal((await request('/scans?riskLevel=SAFE', 'GET', undefined, token)).data.total, 1);
      assert.equal((await request('/scans?riskLevel=SUSPICIOUS', 'GET', undefined, token)).data.total, 1);
      assert.equal((await request('/scans?riskLevel=BAD', 'GET', undefined, token)).status, 400);
      assert.equal((await request('/scans?from=2099-01-01&to=2099-01-02', 'GET', undefined, token)).data.total, 0);
      assert.equal((await request('/scans?from=2099-01-02&to=2099-01-01', 'GET', undefined, token)).status, 400);
    });
    await t.test('quét không đăng nhập không tạo bản ghi lịch sử', async () => {
      const before = await db.scan.count();
      const r = await request('/public/scans', 'POST', { url: 'https://example.com' });
      assert.equal(r.status, 201); assert.equal(r.data.saved, false); assert.equal(r.data.userId, null);
      assert.equal(await db.scan.count(), before);
    });
    await t.test('tài khoản khác không đọc hoặc xóa lịch sử người khác', async () => {
      const r = await request('/auth/register', 'POST', { ...input, email: 'admin@example.com' });
      assert.equal(r.status, 201); admin = r.data.accessToken; adminId = r.data.user.id;
      assert.equal((await request('/scans', 'GET', undefined, admin)).data.total, 0);
      assert.equal((await request('/scans/' + scanId, 'GET', undefined, admin)).status, 404);
      assert.equal((await request('/scans/' + scanId, 'DELETE', undefined, admin)).status, 404);
      assert.equal((await request('/scans/' + scanId, 'GET', undefined, token)).status, 200);
    });
    await t.test('gửi và đọc báo cáo, chống sửa status qua API User', async () => {
      const body = { url: 'https://example.com', description: 'Website nghi ngo lua dao' };
      assert.equal((await request('/reports', 'POST', { ...body, status: 'CONFIRMED' }, token)).status, 400);
      const r = await request('/reports', 'POST', body, token); assert.equal(r.status, 201); reportId = r.data.id;
      assert.equal(r.data.status, 'PENDING');
      assert.equal((await request('/reports', 'GET', undefined, token)).data.total, 1);
      assert.equal((await request('/reports/' + reportId, 'GET', undefined, admin)).status, 404);
      assert.equal((await request('/reports/' + reportId, 'GET', undefined, token)).status, 200);
    });
    await t.test('ảnh bằng chứng: PNG/JPG riêng tư, chặn sai định dạng và quá 5 MiB', async () => {
      const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jM1kAAAAASUVORK5CYII=', 'base64');
      async function upload(bytes: Buffer, credential: string) {
        const form = new FormData(); form.append('file', new Blob([bytes], { type: 'image/png' }), 'bang-chung.png');
        return fetch(base + '/reports/' + reportId + '/evidence', { method: 'POST', headers: { Authorization: 'Bearer ' + credential }, body: form });
      }
      assert.equal((await upload(png, admin)).status, 404);
      assert.equal((await upload(Buffer.from('not an image'), token)).status, 400);
      assert.equal((await upload(Buffer.alloc(5 * 1024 * 1024 + 1), token)).status, 413);
      const result = await upload(png, token); assert.equal(result.status, 201);
      const record = await result.json() as any; assert.equal(record.mimeType, 'image/png'); assert.equal(record.data, undefined);
      const download = await fetch(base + '/reports/' + reportId + '/evidence', { headers: { Authorization: 'Bearer ' + token } });
      assert.equal(download.status, 200); assert.equal(download.headers.get('cache-control'), 'no-store');
      assert.ok(download.headers.get('content-disposition')?.startsWith('attachment;'));
      assert.deepEqual(Buffer.from(await download.arrayBuffer()), png);
      assert.equal((await fetch(base + '/reports/' + reportId + '/evidence')).status, 401);
    });
    await t.test('Admin xem danh sách, thống kê và phiên bản AI', async () => {
      await db.user.update({ where: { id: adminId }, data: { role: 'ADMIN' } });
      const r = await request('/admin/stats', 'GET', undefined, admin);
      assert.equal(r.status, 200); assert.equal(r.data.users, 2); assert.equal(r.data.scans, 5); assert.equal(r.data.dangerousScans, 3); assert.equal(r.data.pendingReports, 1);
      const users = (await request('/admin/users', 'GET', undefined, admin)).data.items;
      assert.equal(users.length, 2); assert.equal(users[0].passwordHash, undefined);
      assert.equal((await request('/admin/scans', 'GET', undefined, admin)).data.total, 5);
      assert.equal((await request('/admin/reports', 'GET', undefined, admin)).data.total, 1);
      assert.equal((await request('/admin/ai/status', 'GET', undefined, admin)).data.versions[0].modelVersion, 'test-fixture');
    });
    await t.test('Admin: bộ lọc người dùng, báo cáo và số liệu biểu đồ', async () => {
      assert.equal((await request('/admin/users?role=ADMIN', 'GET', undefined, admin)).data.total, 1);
      assert.equal((await request('/admin/users?q=admin%40example.com', 'GET', undefined, admin)).data.total, 1);
      assert.equal((await request('/admin/users?blocked=true', 'GET', undefined, admin)).data.total, 0);
      assert.equal((await request('/admin/reports?status=PENDING', 'GET', undefined, admin)).data.total, 1);
      const analytics = await request('/admin/analytics', 'GET', undefined, admin);
      assert.equal(analytics.status, 200); assert.equal(analytics.data.days.length, 7);
      assert.equal(analytics.data.days.reduce((sum: number, day: any) => sum + day.count, 0), 5);
    });
    await t.test('báo cáo liên kết đúng scan và xác thực evidence URL', async () => {
      const body = { url: 'https://example.com', description: 'Báo cáo liên kết kiểm thử', reason: 'LOGIN_IMPERSONATION', scanId };
      assert.equal((await request('/reports', 'POST', { ...body, evidenceUrl: 'javascript:alert(1)' }, token)).status, 400);
      assert.equal((await request('/reports', 'POST', body, admin)).status, 404);
      const r = await request('/reports', 'POST', { ...body, evidenceUrl: 'https://evidence.example.com' }, token);
      assert.equal(r.status, 201); assert.equal(r.data.scanRiskScore, 85); assert.equal(r.data.scanModelVersion, 'test-fixture');
      assert.equal(r.data.evidenceUrl, 'https://evidence.example.com/');
    });
    await t.test('Admin xử lý báo cáo; sai trạng thái trả 400, thiếu bản ghi trả 404', async () => {
      assert.equal((await request('/admin/reports/' + reportId, 'PATCH', { status: 'BAD', adminNote: '' }, admin)).status, 400);
      const r = await request('/admin/reports/' + reportId, 'PATCH', { status: 'CONFIRMED', adminNote: 'Đã xác minh' }, admin);
      assert.equal(r.status, 200); assert.equal(r.data.status, 'CONFIRMED');
      const form = new FormData(); form.append('file', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jM1kAAAAASUVORK5CYII=', 'base64')], { type: 'image/png' }), 'replace.png');
      assert.equal((await fetch(base + '/reports/' + reportId + '/evidence', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: form })).status, 400);
      const missing = await request('/admin/reports/' + randomUUID(), 'PATCH', { status: 'REJECTED', adminNote: '' }, admin);
      assert.equal(missing.status, 404); assert.ok(missing.data.requestId); assert.equal(missing.data.stack, undefined);
    });
    await t.test('khóa thu hồi mọi phiên, mở khóa không khôi phục token cũ', async () => {
      assert.equal((await request('/admin/users/' + adminId + '/block', 'PATCH', { blocked: true }, admin)).status, 400);
      assert.equal((await request('/admin/users/' + userId + '/block', 'PATCH', { blocked: true }, admin)).status, 200);
      assert.equal((await request('/auth/me', 'GET', undefined, token)).status, 401);
      assert.equal((await request('/auth/me', 'GET', undefined, secondToken)).status, 401);
      assert.equal((await request('/auth/login', 'POST', { email: input.email, password: input.password })).status, 401);
      await request('/admin/users/' + userId + '/block', 'PATCH', { blocked: false }, admin);
      assert.equal((await request('/auth/me', 'GET', undefined, token)).status, 401);
      token = (await request('/auth/login', 'POST', { email: input.email, password: input.password })).data.accessToken;
    });
    await t.test('đổi mật khẩu yêu cầu mật khẩu cũ và thu hồi phiên', async () => {
      assert.equal((await request('/auth/password', 'PATCH', { currentPassword: 'wrong-password', newPassword: 'New-password-123' }, token)).status, 401);
      assert.equal((await request('/auth/password', 'PATCH', { currentPassword: input.password, newPassword: 'New-password-123' }, token)).status, 200);
      assert.equal((await request('/auth/me', 'GET', undefined, token)).status, 401);
      assert.equal((await request('/auth/login', 'POST', { email: input.email, password: input.password })).status, 401);
      const r = await request('/auth/login', 'POST', { email: input.email, password: 'New-password-123' });
      assert.equal(r.status, 200); token = r.data.accessToken;
    });
    await t.test('chủ sở hữu xóa lịch sử và không còn đọc được', async () => {
      assert.equal((await request('/scans/' + scanId, 'DELETE', undefined, token)).status, 200);
      assert.equal((await request('/scans/' + scanId, 'GET', undefined, token)).status, 404);
      const linked = await db.report.findFirst({ where: { reason: 'LOGIN_IMPERSONATION' } });
      assert.equal(linked.scanId, null); assert.equal(linked.scanRiskScore, 85);
    });
    await t.test('đăng xuất thu hồi token ngay', async () => {
      assert.equal((await request('/auth/logout', 'POST', undefined, token)).status, 200);
      assert.equal((await request('/auth/me', 'GET', undefined, token)).status, 401);
    });
    await t.test('Admin tạo tài khoản, đổi vai trò, thu hồi phiên và ghi nhật ký không có mật khẩu', async () => {
      const r = await request('/admin/users', 'POST', { name: 'Tài khoản được tạo', email: 'created@example.com', password: 'Created-password-123', role: 'USER' }, admin);
      assert.equal(r.status, 201); assert.equal(r.data.passwordHash, undefined);
      const login = await request('/auth/login', 'POST', { email: 'created@example.com', password: 'Created-password-123' });
      assert.equal(login.status, 200);
      assert.equal((await request('/admin/users/' + r.data.id + '/role', 'PATCH', { role: 'ADMIN' }, admin)).status, 200);
      assert.equal((await request('/auth/me', 'GET', undefined, login.data.accessToken)).status, 401);
      assert.equal((await request('/admin/users/' + adminId + '/role', 'PATCH', { role: 'USER' }, admin)).status, 400);
      const logs = await request('/admin/audit-logs', 'GET', undefined, admin);
      assert.equal(logs.status, 200); assert.ok(logs.data.items.some((item: any) => item.action === 'USER_ROLE'));
      assert.ok(logs.data.items.some((item: any) => item.action === 'REPORT_REVIEW'));
      assert.ok(!JSON.stringify(logs.data).includes('Created-password-123'));
      assert.ok(!JSON.stringify(logs.data).includes('passwordHash'));
    });
    await t.test('OpenAPI và Swagger truy cập được, có bảo mật bearer và DTO', async () => {
      const doc = await fetch(base + '/openapi.json'); assert.equal(doc.status, 200);
      const spec = await doc.json() as any;
      assert.ok(spec.paths['/api/auth/logout']); assert.ok(spec.components.securitySchemes.bearer);
      assert.ok(spec.components.schemas.RegisterDto.required.includes('password'));
      assert.equal((await fetch(base + '/docs')).status, 200);
    });
    await t.test('JSON sai cú pháp trả 400', async () => {
      const r = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{broken json' });
      assert.equal(r.status, 400);
      assert.equal((await r.json() as any).message, 'JSON không hợp lệ');
    });
    await t.test('body quá lớn bị từ chối 413', async () => {
      const r = await request('/auth/login', 'POST', { email: input.email, password: 'a'.repeat(20000) });
      assert.equal(r.status, 413);
    });
    await t.test('rate limit trả 429 và Retry-After, không tin X-Forwarded-For', async () => {
      let response: Response | undefined;
      for (let i = 0; i < 125; i++) {
        response = await fetch(base + '/health', { headers: { 'X-Forwarded-For': `192.0.2.${i % 250}` } });
        await response.text();
        if (response.status === 429) break;
      }
      assert.equal(response?.status, 429); assert.ok(response?.headers.get('retry-after'));
    });
  } finally {
    await ctx.close(); ai.closeAllConnections();
    await new Promise<void>(resolve => ai.close(() => resolve()));
  }
});
