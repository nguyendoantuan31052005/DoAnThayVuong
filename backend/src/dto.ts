import { PaginationDto } from './common';
import { IsEmail, IsString, MinLength, MaxLength, IsIn, IsBoolean, IsOptional, IsUUID, IsDateString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
const email = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value;
export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', maxLength: 254 })
  @Transform(email) @IsEmail() @MaxLength(254) email!: string;
  @ApiProperty({ example: 'Nguyễn Văn An', minLength: 2, maxLength: 100 })
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(100) name!: string;
  @ApiProperty({ minLength: 12, maxLength: 72, format: 'password', description: 'Tối đa 72 byte UTF-8' })
  @IsString() @MinLength(12, { message: 'Mật khẩu cần ít nhất 12 ký tự' }) @MaxLength(72) @Matches(/(?=.*\p{Lu})(?=.*\p{Ll})(?=.*\p{N})/u, { message: 'Mật khẩu cần có chữ hoa, chữ thường và số' }) password!: string;
}
export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @Transform(email) @IsEmail() @MaxLength(254) email!: string;
  @ApiProperty({ format: 'password', maxLength: 72 })
  @IsString() @MinLength(1) @MaxLength(72) password!: string;
}
export class ProfileDto {
  @ApiPropertyOptional({ maxLength: 160 }) @IsOptional() @Transform(trim) @IsString() @MaxLength(160) organization?: string;
  @ApiProperty({ minLength: 2, maxLength: 100 })
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(100) name!: string;
}
export class PasswordDto {
  @ApiProperty({ format: 'password', maxLength: 72 })
  @IsString() @MinLength(1) @MaxLength(72) currentPassword!: string;
  @ApiProperty({ format: 'password', minLength: 12, maxLength: 72 })
  @IsString() @MinLength(12, { message: 'Mật khẩu mới cần ít nhất 12 ký tự' }) @MaxLength(72) @Matches(/(?=.*\p{Lu})(?=.*\p{Ll})(?=.*\p{N})/u, { message: 'Mật khẩu mới cần có chữ hoa, chữ thường và số' }) newPassword!: string;
}
export class ScanDto {
  @ApiProperty({ example: 'https://example.com', maxLength: 2048 })
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(2048) url!: string;
}
export class ReportDto extends ScanDto {
  @ApiPropertyOptional({ enum: ['LOGIN_IMPERSONATION', 'BRAND_IMPERSONATION', 'DATA_THEFT', 'OTHER'] })
  @IsOptional() @IsIn(['LOGIN_IMPERSONATION', 'BRAND_IMPERSONATION', 'DATA_THEFT', 'OTHER']) reason?: string;
  @ApiPropertyOptional({ maxLength: 2048 }) @IsOptional() @Transform(trim) @IsString() @MaxLength(2048) evidenceUrl?: string;
  @ApiPropertyOptional({ format: 'uuid' }) @IsOptional() @IsUUID('4') scanId?: string;
  @ApiProperty({ minLength: 10, maxLength: 2000 })
  @Transform(trim) @IsString() @MinLength(10) @MaxLength(2000) description!: string;
}
export class BlockDto {
  @ApiProperty() @IsBoolean() blocked!: boolean;
}
export class ReviewDto {
  @ApiProperty({ enum: ['PENDING', 'REVIEWING', 'CONFIRMED', 'REJECTED'] })
  @IsIn(['PENDING', 'REVIEWING', 'CONFIRMED', 'REJECTED']) status!: string;
  @ApiProperty({ maxLength: 2000 })
  @Transform(trim) @IsString() @MaxLength(2000) adminNote!: string;
}

export class ScanQueryDto extends PaginationDto {
  @ApiPropertyOptional({ maxLength: 200 }) @IsOptional() @Transform(trim) @IsString() @MaxLength(200) q?: string;
  @ApiPropertyOptional({ enum: ['SAFE', 'SUSPICIOUS', 'DANGEROUS'] }) @IsOptional() @IsIn(['SAFE', 'SUSPICIOUS', 'DANGEROUS']) riskLevel?: string;
  @ApiPropertyOptional({ format: 'date' }) @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional({ format: 'date' }) @IsOptional() @IsDateString() to?: string;
}
export class ReportQueryDto extends PaginationDto {
  @ApiPropertyOptional({ maxLength: 200 }) @IsOptional() @Transform(trim) @IsString() @MaxLength(200) q?: string;
  @ApiPropertyOptional({ enum: ['PENDING', 'REVIEWING', 'CONFIRMED', 'REJECTED'] }) @IsOptional() @IsIn(['PENDING', 'REVIEWING', 'CONFIRMED', 'REJECTED']) status?: string;
}
export class UserQueryDto extends PaginationDto {
  @ApiPropertyOptional({ maxLength: 200 }) @IsOptional() @Transform(trim) @IsString() @MaxLength(200) q?: string;
  @ApiPropertyOptional({ enum: ['USER', 'ADMIN'] }) @IsOptional() @IsIn(['USER', 'ADMIN']) role?: string;
  @ApiPropertyOptional({ enum: ['true', 'false'] }) @IsOptional() @IsIn(['true', 'false']) blocked?: string;
}

export class CreateUserDto extends RegisterDto {
  @ApiPropertyOptional({ enum: ['USER', 'ADMIN'], default: 'USER' }) @IsOptional() @IsIn(['USER', 'ADMIN']) role?: string;
}
export class RoleDto { @ApiProperty({ enum: ['USER', 'ADMIN'] }) @IsIn(['USER', 'ADMIN']) role!: string; }
