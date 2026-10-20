import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const { normalizeUrl } = require('../dist/url');
const { validatePrediction, riskLevel } = require('../dist/ai');

test('URL: chuẩn hóa scheme/host, giữ query và loại fragment', () => {
  assert.equal(normalizeUrl('HTTPS://EXAMPLE.COM:443/a?b=1#section'), 'https://example.com/a?b=1');
});
test('URL: từ chối giao thức, thông tin đăng nhập và URL không có scheme', () => {
  for (const url of ['example.com', 'javascript:alert(1)', 'file:///etc/passwd', 'https://user:pass@example.com', 'not-a-url']) assert.throws(() => normalizeUrl(url));
});
test('AI: ngưỡng phân loại chính xác', () => {
  for (const [score, level] of [[0,'SAFE'], [29.99,'SAFE'], [30,'SUSPICIOUS'], [69.99,'SUSPICIOUS'], [70,'DANGEROUS'], [100,'DANGEROUS']]) assert.equal(riskLevel(score), level);
});
test('AI: từ chối payload sai schema, non-finite, điểm ngoài miền và giải thích không hợp lệ', () => {
  const good = { riskScore: 50, reasons: ['Tên miền đáng ngờ'], modelVersion: 'test' };
  assert.equal(validatePrediction(good).riskLevel, 'SUSPICIOUS');
  for (const value of [null, [], {}, { ...good, riskScore: NaN }, { ...good, riskScore: Infinity }, { ...good, riskScore: -1 }, { ...good, riskScore: 101 }, { ...good, riskScore: '50' }, { ...good, reasons: [''] }, { ...good, reasons: [1] }, { ...good, modelVersion: ' ' }]) assert.throws(() => validatePrediction(value));
});
