import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { databaseUrl } from './config';

export function createDb(): PrismaClient {
  return new PrismaClient({ adapter: new PrismaLibSQL({ url: databaseUrl() }) });
}
@Injectable()
export class Db extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() { super({ adapter: new PrismaLibSQL({ url: databaseUrl() }) }); }
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}
