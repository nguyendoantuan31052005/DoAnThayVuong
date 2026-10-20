import { UserResponse, ReportResponse, ScanResponse, StatsResponse, ApiPage } from './responses';
import { Controller, Get, Patch, Body, Param, Req, Query, UseGuards, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiOkResponse, ApiCreatedResponse, ApiResponse } from '@nestjs/swagger';
import { Db } from './database';
import { AuthGuard, AdminGuard } from './auth';
import { AuthRequest, PaginationDto, publicUser, paged, pagination } from './common';
import { BlockDto, ReviewDto } from './dto';
import { scanResult } from './scans';

@ApiTags('Admin') @ApiBearerAuth()
@ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
@ApiResponse({ status: 401, description: 'Phiên đăng nhập không hợp lệ' })
@ApiResponse({ status: 404, description: 'Bản ghi không tồn tại hoặc không thuộc tài khoản' })
@ApiResponse({ status: 429, description: 'Quá giới hạn yêu cầu; xem Retry-After' })
@ApiResponse({ status: 403, description: 'Cần quyền ADMIN' })
@Controller('admin') @UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(private db: Db) {}
  @Get('users') @ApiOperation({ summary: 'ADMIN: danh sách người dùng, không trả mật khẩu' })
  @ApiPage(UserResponse)
  async users(@Query() query: PaginationDto) {
    const [items, total] = await this.db.$transaction([
      this.db.user.findMany({ select: publicUser, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], ...pagination(query) }), this.db.user.count(),
    ]);
    return paged(items, total, query);
  }
  @Patch('users/:id/block') @ApiOperation({ summary: 'ADMIN: khóa/mở khóa tài khoản; khóa sẽ thu hồi mọi phiên' })
  @ApiOkResponse({ type: UserResponse })
  async block(@Req() req: AuthRequest, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() dto: BlockDto) {
    if (id === req.user.id) throw new BadRequestException('Không thể tự khóa tài khoản');
    return this.db.$transaction(async tx => {
      const user = await tx.user.update({ where: { id }, data: { blocked: dto.blocked }, select: publicUser });
      if (dto.blocked) await tx.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      return user;
    });
  }
  @Get('reports') @ApiOperation({ summary: 'ADMIN: tất cả báo cáo, phân trang' })
  @ApiPage(ReportResponse)
  async reports(@Query() query: PaginationDto) {
    const [items, total] = await this.db.$transaction([
      this.db.report.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], ...pagination(query) }), this.db.report.count(),
    ]);
    return paged(items, total, query);
  }
  @Patch('reports/:id') @ApiOperation({ summary: 'ADMIN: xử lý trạng thái và ghi chú báo cáo' })
  @ApiOkResponse({ type: ReportResponse })
  review(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() dto: ReviewDto) {
    return this.db.report.update({ where: { id }, data: { status: dto.status, adminNote: dto.adminNote } });
  }
  @Get('scans') @ApiOperation({ summary: 'ADMIN: tất cả lịch sử kiểm tra, phân trang' })
  @ApiPage(ScanResponse)
  async scans(@Query() query: PaginationDto) {
    const [items, total] = await this.db.$transaction([
      this.db.scan.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], ...pagination(query) }), this.db.scan.count(),
    ]);
    return paged(items.map(scanResult), total, query);
  }
  @Get('stats') @ApiOperation({ summary: 'ADMIN: tổng người dùng, lượt kiểm tra, lượt nguy hiểm và báo cáo chờ' })
  @ApiOkResponse({ type: StatsResponse })
  async stats() {
    const [users, scans, dangerousScans, pendingReports, reviewedReports] = await this.db.$transaction([
      this.db.user.count(), this.db.scan.count(), this.db.scan.count({ where: { riskLevel: 'DANGEROUS' } }),
      this.db.report.count({ where: { status: 'PENDING' } }), this.db.report.count({ where: { status: { in: ['CONFIRMED', 'REJECTED'] } } }),
    ]);
    return { users, scans, dangerousScans, pendingReports, reviewedReports };
  }
  @Get('ai/status') @ApiOperation({ summary: 'ADMIN: cấu hình AI và các phiên bản đã trả kết quả; không phải đánh giá độ chính xác' })
  async aiStatus() {
    const versions = await this.db.scan.groupBy({ by: ['modelVersion'], _count: { _all: true }, _max: { createdAt: true } });
    return { configured: Boolean(process.env.AI_API_URL), versions: versions.map(v => ({ modelVersion: v.modelVersion, scans: v._count._all, lastSeenAt: v._max.createdAt })) };
  }
}
