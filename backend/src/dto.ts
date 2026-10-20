import { IsEmail, IsString, MinLength, MaxLength, IsIn, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
const email = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value;
export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', maxLength: 254 })
  @Transform(email) @IsEmail() @MaxLength(254) email!: string;
  @ApiProperty({ example: 'Nguyễn Văn An', minLength: 2, maxLength: 100 })
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(100) name!: string;
  @ApiProperty({ minLength: 10, maxLength: 72, format: 'password', description: 'Tối đa 72 byte UTF-8' })
  @IsString() @MinLength(10) @MaxLength(72) password!: string;
}
export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @Transform(email) @IsEmail() @MaxLength(254) email!: string;
  @ApiProperty({ format: 'password', maxLength: 72 })
  @IsString() @MinLength(1) @MaxLength(72) password!: string;
}
export class ProfileDto {
  @ApiProperty({ minLength: 2, maxLength: 100 })
  @Transform(trim) @IsString() @MinLength(2) @MaxLength(100) name!: string;
}
export class PasswordDto {
  @ApiProperty({ format: 'password', maxLength: 72 })
  @IsString() @MinLength(1) @MaxLength(72) currentPassword!: string;
  @ApiProperty({ format: 'password', minLength: 10, maxLength: 72 })
  @IsString() @MinLength(10) @MaxLength(72) newPassword!: string;
}
export class ScanDto {
  @ApiProperty({ example: 'https://example.com', maxLength: 2048 })
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(2048) url!: string;
}
export class ReportDto extends ScanDto {
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
