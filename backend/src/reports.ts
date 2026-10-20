import { evidenceMetadata } from './evidence';
import { ReportResponse, ApiPage } from './responses';
import { Controller, Get, Post, Body, Param, Req, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiOkResponse, ApiCreatedResponse, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Db } from './database';
import { AuthGuard } from './auth';
import { AuthRequest, PaginationDto, paged, pagination, requireRecord } from './common';
import { reportWhere } from './filters';
import { ReportDto, ReportQueryDto } from './dto';
import { normalizeUrl } from './url';

@ApiTags('Reports') @ApiBearerAuth()
@ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
@ApiResponse({ status: 401, description: 'Phiên đăng nhập không hợp lệ' })
@ApiResponse({ status: 404, description: 'Bản ghi không tồn tại hoặc không thuộc tài khoản' })
@ApiResponse({ status: 429, description: 'Quá giới hạn yêu cầu; xem Retry-After' })
@Controller('reports') @UseGuards(AuthGuard)
export class ReportController {
  constructor(private db: Db) {}
  @Post() @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Gửi báo cáo website nghi ngờ phishing' })
  @ApiCreatedResponse({ type: ReportResponse })
  async create(@Req() req: AuthRequest, @Body() dto: ReportDto) {
    const url = normalizeUrl(dto.url);
    const scan = dto.scanId ? requireRecord(await this.db.scan.findFirst({ where: { id: dto.scanId, userId: req.user.id, url } })) : null;
    return this.db.report.create({ data: { userId: req.user.id, url, description: dto.description, reason: dto.reason || 'OTHER', evidenceUrl: dto.evidenceUrl ? normalizeUrl(dto.evidenceUrl) : '', scanId: scan?.id, scanRiskScore: scan?.riskScore, scanModelVersion: scan?.modelVersion }, include: evidenceMetadata });
  }
  @Get() @ApiOperation({ summary: 'Báo cáo của chính mình, phân trang' })
  @ApiPage(ReportResponse)
  async list(@Req() req: AuthRequest, @Query() query: ReportQueryDto) {
    const where = { ...reportWhere(query), userId: req.user.id };
    const [items, total] = await this.db.$transaction([
      this.db.report.findMany({ include: evidenceMetadata, where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], ...pagination(query) }), this.db.report.count({ where }),
    ]);
    return paged(items, total, query);
  }
  @Get(':id') @ApiOperation({ summary: 'Chi tiết báo cáo của chính mình' })
  @ApiOkResponse({ type: ReportResponse })
  async detail(@Req() req: AuthRequest, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return requireRecord(await this.db.report.findFirst({ where: { id, userId: req.user.id }, include: evidenceMetadata }));
  }
}
