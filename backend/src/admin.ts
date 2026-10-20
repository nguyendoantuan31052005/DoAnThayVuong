import { evidenceMetadata } from './evidence';
import { hash } from 'bcryptjs';
import { assertPasswordBytes } from './common';
import { UserResponse, ReportResponse, ScanResponse, StatsResponse, ApiPage } from './responses';
import { Controller, Get, Post, Patch, Body, Param, Req, Query, UseGuards, ParseUUIDPipe, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiOkResponse, ApiCreatedResponse, ApiResponse } from '@nestjs/swagger';
import { Db } from './database';
import { AuthGuard, AdminGuard } from './auth';
import { AuthRequest, PaginationDto, publicUser, paged, pagination } from './common';
import { scanWhere, reportWhere, userWhere } from './filters';
import { BlockDto, ReviewDto, ScanQueryDto, ReportQueryDto, UserQueryDto, CreateUserDto, RoleDto } from './dto';
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
  async users(@Query() query: UserQueryDto) {
    const [items, total] = await this.db.$transaction([
      this.db.user.findMany({ where: userWhere(query), select: publicUser, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], ...pagination(query) }), this.db.user.count({ where: userWhere(query) }),
    ]);
    return paged(items, total, query);
  }
  @Patch('users/:id/block') @ApiOperation({ summary: 'ADMIN: khóa/mở khóa tài khoản; khóa sẽ thu hồi mọi phiên' })
  @ApiOkResponse({ type: UserResponse })
  async block(@Req() req: AuthRequest, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() dto: BlockDto) {
    if (id === req.user.id) throw new BadRequestException('Không thể tự khóa tài khoản');
    return this.db.$transaction(async tx => {
      const actor = await tx.user.findUnique({ where: { id: req.user.id } });
      if (!actor || actor.blocked || actor.role !== 'ADMIN') throw new ForbiddenException();
      const user = await tx.user.update({ where: { id }, data: { blocked: dto.blocked }, select: publicUser });
      if (dto.blocked) await tx.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      await tx.auditLog.create({ data: { actorId: req.user.id, action: 'USER_BLOCK', targetId: id, details: JSON.stringify({ blocked: dto.blocked }) } });
      return user;
    });
  }
  @Post('users') @ApiOperation({ summary: 'ADMIN: tạo tài khoản; mật khẩu không được ghi vào nhật ký' })
  async createUser(@Req() req: AuthRequest, @Body() dto: CreateUserDto) {
    assertPasswordBytes(dto.password); const passwordHash = await hash(dto.password, 12);
    return this.db.$transaction(async tx => {
      const actor = await tx.user.findUnique({ where: { id: req.user.id } });
      if (!actor || actor.blocked || actor.role !== 'ADMIN') throw new ForbiddenException();
      const user = await tx.user.create({ data: { name: dto.name, email: dto.email, passwordHash, role: dto.role || 'USER' }, select: publicUser });
      await tx.auditLog.create({ data: { actorId: req.user.id, action: 'USER_CREATE', targetId: user.id, details: JSON.stringify({ role: user.role }) } });
      return user;
    });
  }
  @Patch('users/:id/role') @ApiOperation({ summary: 'ADMIN: đổi vai trò tài khoản khác và thu hồi phiên của tài khoản đó' })
  async changeRole(@Req() req: AuthRequest, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() dto: RoleDto) {
    if (id === req.user.id) throw new BadRequestException('Không thể tự đổi vai trò');
    return this.db.$transaction(async tx => {
      const actor = await tx.user.findUnique({ where: { id: req.user.id } });
      if (!actor || actor.blocked || actor.role !== 'ADMIN') throw new ForbiddenException();
      const user = await tx.user.update({ where: { id }, data: { role: dto.role }, select: publicUser });
      await tx.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      await tx.auditLog.create({ data: { actorId: req.user.id, action: 'USER_ROLE', targetId: id, details: JSON.stringify({ role: dto.role }) } });
      return user;
    });
  }
  @Get('audit-logs') @ApiOperation({ summary: 'ADMIN: nhật ký tạo tài khoản, đổi vai trò, khóa và kiểm duyệt' })
  async auditLogs(@Query() query: PaginationDto) {
    const [items, total] = await this.db.$transaction([this.db.auditLog.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], ...pagination(query) }), this.db.auditLog.count()]);
    return paged(items.map(item => ({ ...item, details: JSON.parse(item.details) })), total, query);
  }
  @Get('reports') @ApiOperation({ summary: 'ADMIN: tất cả báo cáo, phân trang' })
  @ApiPage(ReportResponse)
  async reports(@Query() query: ReportQueryDto) {
    const [items, total] = await this.db.$transaction([
      this.db.report.findMany({ include: { ...evidenceMetadata, user: { select: { id: true, name: true, email: true } } }, where: reportWhere(query), orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], ...pagination(query) }), this.db.report.count({ where: reportWhere(query) }),
    ]);
    return paged(items, total, query);
  }
  @Patch('reports/:id') @ApiOperation({ summary: 'ADMIN: xử lý trạng thái và ghi chú báo cáo' })
  @ApiOkResponse({ type: ReportResponse })
  async review(@Req() req: AuthRequest, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() dto: ReviewDto) {
    return this.db.$transaction(async tx => {
      const actor = await tx.user.findUnique({ where: { id: req.user.id } });
      if (!actor || actor.blocked || actor.role !== 'ADMIN') throw new ForbiddenException();
      const report = await tx.report.update({ where: { id }, data: { status: dto.status, adminNote: dto.adminNote }, include: evidenceMetadata });
      await tx.auditLog.create({ data: { actorId: req.user.id, action: 'REPORT_REVIEW', targetId: id, details: JSON.stringify({ status: dto.status }) } });
      return report;
    });
  }
  @Get('scans') @ApiOperation({ summary: 'ADMIN: tất cả lịch sử kiểm tra, phân trang' })
  @ApiPage(ScanResponse)
  async scans(@Query() query: ScanQueryDto) {
    const [items, total] = await this.db.$transaction([
      this.db.scan.findMany({ where: scanWhere(query), orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], ...pagination(query) }), this.db.scan.count({ where: scanWhere(query) }),
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
  @Get('analytics') @ApiOperation({ summary: 'ADMIN: lượt quét theo ngày và phân bố rủi ro trong 7 ngày UTC gần nhất' })
  async analytics() {
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const from = new Date(today.getTime() - 6 * 86400000);
    const dates = Array.from({ length: 7 }, (_, index) => new Date(from.getTime() + index * 86400000));
    const counts = await this.db.$transaction(dates.map(day => this.db.scan.count({ where: { createdAt: { gte: day, lt: new Date(day.getTime() + 86400000) } } })));
    const distribution = await this.db.scan.groupBy({ by: ['riskLevel'], where: { createdAt: { gte: from, lt: new Date(today.getTime() + 86400000) } }, _count: { _all: true } });
    return { days: dates.map((day, index) => ({ date: day.toISOString().slice(0, 10), count: counts[index] })), distribution: distribution.map(row => ({ riskLevel: row.riskLevel, count: row._count._all })), timezone: 'UTC' };
  }
  @Get('ai/status') @ApiOperation({ summary: 'ADMIN: cấu hình AI và các phiên bản đã trả kết quả; không phải đánh giá độ chính xác' })
  async aiStatus() {
    const versions = await this.db.scan.groupBy({ by: ['modelVersion'], _count: { _all: true }, _max: { createdAt: true } });
    return { configured: Boolean(process.env.AI_API_URL), versions: versions.map(v => ({ modelVersion: v.modelVersion, scans: v._count._all, lastSeenAt: v._max.createdAt })) };
  }
}
