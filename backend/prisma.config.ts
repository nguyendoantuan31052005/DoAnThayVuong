import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { resolve } from 'node:path';

function databaseUrl() {
  const url = env('DATABASE_URL');
  if (!url.startsWith('file:')) throw new Error('Only local SQLite file: URLs are supported');
  return `file:${resolve('prisma', url.slice(5))}`;
}
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  experimental: { adapter: true },
  engine: 'js',
  adapter: async () => new PrismaLibSQL({ url: databaseUrl() }),
});
