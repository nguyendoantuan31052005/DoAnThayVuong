import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ScanQueryDto, ReportQueryDto, UserQueryDto } from './dto';
export function scanWhere(query: ScanQueryDto): Prisma.ScanWhereInput {
  const from = query.from ? new Date(query.from) : undefined;
  const to = query.to ? new Date(new Date(query.to).getTime() + (/^\d{4}-\d{2}-\d{2}$/.test(query.to) ? 86400000 : 1)) : undefined;
  if (from && to && from >= to) throw new BadRequestException('Ngày bắt đầu phải trước ngày kết thúc');
  return {
    ...(query.q ? { OR: [{ url: { contains: query.q } }, { id: { contains: query.q } }] } : {}),
    ...(query.riskLevel ? { riskLevel: query.riskLevel } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}),
  };
}
export function reportWhere(query: ReportQueryDto): Prisma.ReportWhereInput {
  return { ...(query.q ? { OR: [{ url: { contains: query.q } }, { id: { contains: query.q } }] } : {}), ...(query.status ? { status: query.status } : {}) };
}
export function userWhere(query: UserQueryDto): Prisma.UserWhereInput {
  return { ...(query.q ? { OR: [{ email: { contains: query.q } }, { name: { contains: query.q } }, { id: { contains: query.q } }] } : {}), ...(query.role ? { role: query.role } : {}), ...(query.blocked ? { blocked: query.blocked === 'true' } : {}) };
}
