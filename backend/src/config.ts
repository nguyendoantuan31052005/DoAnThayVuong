import { resolve } from 'node:path';

export function intConfig(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  const value = raw === undefined || raw === '' ? fallback : Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${name} phải là số nguyên trong khoảng ${min}..${max}`);
  return value;
}
export function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith('file:') || !url.slice(5) || /[?#]/.test(url.slice(5))) throw new Error('DATABASE_URL phải là đường dẫn SQLite local bắt đầu bằng file:');
  return `file:${resolve(__dirname, '../prisma', url.slice(5))}`;
}
export function validateConfig() {
  if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET) < 32) throw new Error('JWT_SECRET phải có ít nhất 32 byte');
  databaseUrl();
  intConfig('HTTP_RATE_LIMIT', 120, 1, 10000);
  if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) throw new Error('NODE_ENV chỉ nhận development, production hoặc test');
  intConfig('PORT', 3000, 1, 65535);
  intConfig('AI_TIMEOUT_MS', 10000, 100, 60000);
  if (process.env.AI_API_URL) {
    const url = new URL(process.env.AI_API_URL);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash) throw new Error('AI_API_URL phải là endpoint HTTP(S) không chứa user/password hoặc fragment');
  }
  const origin = new URL(process.env.FRONTEND_ORIGIN || 'http://localhost:5173');
  if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')) throw new Error('FRONTEND_ORIGIN phải là origin HTTP(S), không có đường dẫn hoặc dấu / cuối');
}
