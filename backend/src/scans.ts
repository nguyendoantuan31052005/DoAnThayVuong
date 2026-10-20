import { ScanResponse, MessageResponse, ApiPage } from './responses';
import { Controller, Post, Get, Delete, Body, Param, Req, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiOkResponse, ApiCreatedResponse, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Scan } from '@prisma/client';
import { Db } from './database';
import { AiService } from './ai';
import { AuthGuard } from './auth';
import { AuthRequest, PaginationDto, paged, pagination, requireRecord } from './common';
import { ScanDto } from './dto';
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
    const result = await this.ai.predict(url);
    return scanResult(await this.db.scan.create({ data: { userId: req.user.id, url, ...result, reasons: JSON.stringify(result.reasons) } }));
  }
  @Get() @ApiOperation({ summary: 'Lịch sử kiểm tra của người đăng nhập, phân trang' })
  @ApiPage(ScanResponse)
  async history(@Req() req: AuthRequest, @Query() query: PaginationDto) {
    const where = { userId: req.user.id };
    const [items, total] = await this.db.$transaction([
      this.db.scan.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], ...pagination(query) }), this.db.scan.count({ where }),
    ]);
    return paged(items.map(scanResult), total, query);
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
