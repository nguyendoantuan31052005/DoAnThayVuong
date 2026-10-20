import { scanWhere } from './filters';
import { ScanResponse, MessageResponse, ApiPage } from './responses';
import { Controller, Post, Get, Delete, Body, Param, Req, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiOkResponse, ApiCreatedResponse, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { randomUUID } from 'node:crypto';
import { Scan } from '@prisma/client';
import { Db } from './database';
import { AiService } from './ai';
import { AuthGuard } from './auth';
import { AuthRequest, PaginationDto, paged, pagination, requireRecord } from './common';
import { ScanDto, ScanQueryDto } from './dto';
import { normalizeUrl } from './url';

export function scanResult(record: Scan) { return { ...record, reasons: JSON.parse(record.reasons) as string[] }; }
@ApiTags('Scans') @ApiBearerAuth()
@ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
@ApiResponse({ status: 401, description: 'Phiên đăng nhập không hợp lệ' })
@ApiResponse({ status: 404, description: 'Bản ghi không tồn tại hoặc không thuộc tài khoản' })
@ApiResponse({ status: 429, description: 'Quá giới hạn yêu cầu; xem Retry-After' })
@Controller('scans') @UseGuards(AuthGuard)
export class ScanController {
  constructor(private db: Db, private ai: AiService) {}
  @Post() @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Phân tích URL bằng FastAPI và lưu lịch sử khi thành công' })
  @ApiCreatedResponse({ type: ScanResponse })
  @ApiResponse({ status: 503, description: 'AI không khả dụng hoặc trả kết quả sai hợp đồng; không lưu scan' })
  async scan(@Req() req: AuthRequest, @Body() dto: ScanDto) {
    const url = normalizeUrl(dto.url);
    const startedAt = Date.now();
    const result = await this.ai.predict(url);
    const processingMs = Date.now() - startedAt;
    return scanResult(await this.db.scan.create({ data: { userId: req.user.id, url, processingMs, ...result, reasons: JSON.stringify(result.reasons) } }));
  }
  @Get() @ApiOperation({ summary: 'Lịch sử kiểm tra của người đăng nhập, phân trang' })
  @ApiPage(ScanResponse)
  async history(@Req() req: AuthRequest, @Query() query: ScanQueryDto) {
    const where = { ...scanWhere(query), userId: req.user.id };
    const [items, total] = await this.db.$transaction([
      this.db.scan.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], ...pagination(query) }), this.db.scan.count({ where }),
    ]);
    return paged(items.map(scanResult), total, query);
  }
  @Get('summary') @ApiOperation({ summary: 'Tổng số lần quét, số lượt nguy cơ cao và lần quét mới nhất của chính mình' })
  async summary(@Req() req: AuthRequest) {
    const [total, dangerousScans, lastScan] = await this.db.$transaction([
      this.db.scan.count({ where: { userId: req.user.id } }),
      this.db.scan.count({ where: { userId: req.user.id, riskLevel: 'DANGEROUS' } }),
      this.db.scan.findFirst({ where: { userId: req.user.id }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], select: { id: true, createdAt: true } }),
    ]);
    return { total, dangerousScans, lastScan };
  }
  @Get(':id') @ApiOperation({ summary: 'Chi tiết lần kiểm tra thuộc tài khoản hiện tại' })
  @ApiOkResponse({ type: ScanResponse })
  async detail(@Req() req: AuthRequest, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return scanResult(requireRecord(await this.db.scan.findFirst({ where: { id, userId: req.user.id } })));
  }
  @Delete(':id') @ApiOperation({ summary: 'Xóa một bản ghi lịch sử của chính mình' })
  @ApiOkResponse({ type: MessageResponse })
  async remove(@Req() req: AuthRequest, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    requireRecord(await this.db.scan.findFirst({ where: { id, userId: req.user.id } }));
    await this.db.scan.delete({ where: { id } });
    return { message: 'Đã xóa lịch sử' };
  }
}

@ApiTags('Guest')
@Controller('public/scans')
export class GuestScanController {
  constructor(private ai: AiService) {}
  @Post() @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Phân tích URL không cần đăng nhập; không lưu lịch sử' })
  @ApiResponse({ status: 503, description: 'Dịch vụ AI không khả dụng' })
  async scan(@Body() dto: ScanDto) {
    const url = normalizeUrl(dto.url); const startedAt = Date.now();
    const result = await this.ai.predict(url);
    return { id: randomUUID(), userId: null, url, ...result, processingMs: Date.now() - startedAt, createdAt: new Date().toISOString(), saved: false };
  }
}
