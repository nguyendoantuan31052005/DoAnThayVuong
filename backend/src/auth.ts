import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException, Controller, Post, Get, Patch, Body, Req, UseGuards, HttpCode, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { compare, hash, hashSync } from 'bcryptjs';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiOkResponse, ApiCreatedResponse, ApiResponse } from '@nestjs/swagger';
import { Db } from './database';
import { AuthRequest, publicUser, assertPasswordBytes } from './common';
import { RegisterDto, LoginDto, ProfileDto, PasswordDto } from './dto';

import { AuthResponse, UserResponse, MessageResponse } from './responses';

const JWT_OPTIONS = { issuer: 'phishing-backend', audience: 'phishing-web' };
// Equal bcrypt work for unknown emails; this is a dummy hash, not an account credential.
const DUMMY_HASH = hashSync('dummy-account-password', 12);
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwt: JwtService, private db: Db) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException();
    let payload: { sub: string; jti: string };
    try {
      payload = await this.jwt.verifyAsync(header.slice(7), { ...JWT_OPTIONS, algorithms: ['HS256'] });
      if (typeof payload.sub !== 'string' || typeof payload.jti !== 'string') throw new Error();
    } catch { throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn'); }
    const session = await this.db.session.findUnique({ where: { id: payload.jti }, include: { user: { select: publicUser } } });
    if (!session || session.userId !== payload.sub || session.revokedAt || session.expiresAt <= new Date() || session.user.blocked) throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn');
    req.user = session.user;
    req.sessionId = session.id;
    return true;
  }
}
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    if (context.switchToHttp().getRequest<AuthRequest>().user?.role !== 'ADMIN') throw new ForbiddenException('Cần quyền quản trị viên');
    return true;
  }
}
@Injectable()
export class AuthService {
  constructor(private db: Db, private jwt: JwtService) {}
  async issue(user: { id: string }) {
    const expiresIn = 3600;
    const session = await this.db.session.create({ data: { userId: user.id, expiresAt: new Date(Date.now() + expiresIn * 1000) } });
    return { accessToken: await this.jwt.signAsync({ sub: user.id }, { ...JWT_OPTIONS, jwtid: session.id, expiresIn, algorithm: 'HS256' }), expiresIn };
  }
}
@ApiTags('Auth')
@ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
@ApiResponse({ status: 401, description: 'Sai thông tin đăng nhập hoặc phiên đã hết hạn/thu hồi' })
@ApiResponse({ status: 429, description: 'Quá giới hạn yêu cầu; xem Retry-After' })
@Controller('auth')
export class AuthController {
  constructor(private db: Db, private auth: AuthService) {}
  @Post('register') @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Đăng ký tài khoản USER và tạo phiên đăng nhập' })
  @ApiCreatedResponse({ type: AuthResponse })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại' })
  async register(@Body() dto: RegisterDto) {
    assertPasswordBytes(dto.password);
    try {
      const user = await this.db.user.create({ data: { email: dto.email, name: dto.name, passwordHash: await hash(dto.password, 12) }, select: publicUser });
      return { user, ...await this.auth.issue(user) };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') throw new ConflictException('Email đã tồn tại');
      throw e;
    }
  }
  @Post('login') @HttpCode(200) @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Đăng nhập bằng email và mật khẩu' })
  @ApiOkResponse({ type: AuthResponse })
  async login(@Body() dto: LoginDto) {
    assertPasswordBytes(dto.password);
    const user = await this.db.user.findUnique({ where: { email: dto.email } });
    const valid = await compare(dto.password, user?.passwordHash || DUMMY_HASH);
    if (!user || !valid || user.blocked) throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    const { passwordHash: _, ...safe } = user;
    return { user: safe, ...await this.auth.issue(user) };
  }
  @Get('me') @UseGuards(AuthGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Thông tin tài khoản hiện tại' })
  @ApiOkResponse({ type: UserResponse })
  me(@Req() req: AuthRequest) { return req.user; }
  @Patch('me') @UseGuards(AuthGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật tên hiển thị' })
  @ApiOkResponse({ type: UserResponse })
  update(@Req() req: AuthRequest, @Body() dto: ProfileDto) {
    return this.db.user.update({ where: { id: req.user.id }, data: { name: dto.name }, select: publicUser });
  }
  @Post('logout') @HttpCode(200) @UseGuards(AuthGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Thu hồi phiên hiện tại; token cũ không dùng lại được' })
  @ApiOkResponse({ type: MessageResponse })
  async logout(@Req() req: AuthRequest) {
    await this.db.session.update({ where: { id: req.sessionId }, data: { revokedAt: new Date() } });
    return { message: 'Đã đăng xuất' };
  }
  @Patch('password') @UseGuards(AuthGuard) @ApiBearerAuth() @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Đổi mật khẩu và thu hồi toàn bộ phiên; cần đăng nhập lại' })
  @ApiOkResponse({ type: MessageResponse })
  async password(@Req() req: AuthRequest, @Body() dto: PasswordDto) {
    assertPasswordBytes(dto.currentPassword); assertPasswordBytes(dto.newPassword);
    const user = await this.db.user.findUniqueOrThrow({ where: { id: req.user.id } });
    if (!await compare(dto.currentPassword, user.passwordHash)) throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    const passwordHash = await hash(dto.newPassword, 12);
    await this.db.$transaction([
      this.db.user.update({ where: { id: user.id }, data: { passwordHash } }),
      this.db.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    return { message: 'Đã đổi mật khẩu. Vui lòng đăng nhập lại' };
  }
}
