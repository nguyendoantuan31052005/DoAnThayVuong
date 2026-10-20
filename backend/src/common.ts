import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request } from 'express';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export const publicUser = { id: true, email: true, name: true, organization: true, role: true, blocked: true, createdAt: true } satisfies Prisma.UserSelect;
export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUser }>;
export interface AuthRequest extends Request { user: PublicUser; sessionId: string; }
export class PaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, maximum: 100000 })
  @Type(() => Number) @IsInt() @Min(1) @Max(100000) page = 1;
  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
}
export function pagination(query: PaginationDto) { return { skip: (query.page - 1) * query.pageSize, take: query.pageSize }; }
export function paged<T>(items: T[], total: number, query: PaginationDto) {
  return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.ceil(total / query.pageSize) };
}
export function requireRecord<T>(record: T | null): T {
  if (!record) throw new NotFoundException('Không tìm thấy bản ghi');
  return record;
}
export function assertPasswordBytes(password: string) {
  if (Buffer.byteLength(password) > 72) throw new BadRequestException('Mật khẩu vượt quá 72 byte UTF-8');
}
