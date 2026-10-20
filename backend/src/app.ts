import { EvidenceController } from './evidence';
import { HealthResponse } from './responses';
import { Module, Controller, Get } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ApiOperation, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { Db } from './database';
import { AuthController, AuthService, AuthGuard, AdminGuard } from './auth';
import { AiService } from './ai';
import { ScanController, GuestScanController } from './scans';
import { ReportController } from './reports';
import { AdminController } from './admin';
import { intConfig } from './config';

@ApiTags('Health')
@Controller()
class HealthController {
  constructor(private db: Db) {}
  @Get('health') @ApiOperation({ summary: 'Kiểm tra kết nối database; aiConfigured chỉ cho biết đã cấu hình endpoint' })
  @ApiOkResponse({ type: HealthResponse })
  async health() {
    await this.db.$queryRaw`SELECT 1`;
    return { status: 'ok', aiConfigured: Boolean(process.env.AI_API_URL) };
  }
}
@Module({
  imports: [
    JwtModule.registerAsync({ useFactory: () => ({ secret: process.env.JWT_SECRET }) }),
    ThrottlerModule.forRootAsync({ useFactory: () => [{ name: 'default', ttl: 60000, limit: intConfig('HTTP_RATE_LIMIT', 120, 1, 10000) }] }),
  ],
  controllers: [HealthController, AuthController, EvidenceController, GuestScanController, ScanController, ReportController, AdminController],
  providers: [Db, AuthService, AuthGuard, AdminGuard, AiService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
