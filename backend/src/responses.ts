import { applyDecorators, Type } from '@nestjs/common';
import { ApiProperty, ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
export class UserResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'email' }) email!: string;
  @ApiProperty() name!: string;
  @ApiProperty() organization!: string;
  @ApiProperty({ enum: ['USER', 'ADMIN'] }) role!: string;
  @ApiProperty() blocked!: boolean;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
}
export class AuthResponse {
  @ApiProperty({ type: UserResponse }) user!: UserResponse;
  @ApiProperty({ description: 'JWT Bearer token' }) accessToken!: string;
  @ApiProperty({ example: 3600 }) expiresIn!: number;
}
export class ScanResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty({ example: 'https://example.com/' }) url!: string;
  @ApiProperty({ minimum: 0, maximum: 100, example: 85 }) riskScore!: number;
  @ApiProperty({ enum: ['SAFE', 'SUSPICIOUS', 'DANGEROUS'] }) riskLevel!: string;
  @ApiProperty({ type: [String] }) reasons!: string[];
  @ApiProperty() modelVersion!: string;
  @ApiProperty({ description: 'Thời gian xử lý thực tế, mili giây' }) processingMs!: number;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
}
export class EvidenceResponse {
  @ApiProperty() fileName!: string;
  @ApiProperty() mimeType!: string;
  @ApiProperty() size!: number;
}
export class ReportResponse {
  @ApiProperty({ type: EvidenceResponse, nullable: true }) evidence!: EvidenceResponse | null;
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty() url!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ enum: ['LOGIN_IMPERSONATION','BRAND_IMPERSONATION','DATA_THEFT','OTHER'] }) reason!: string;
  @ApiProperty() evidenceUrl!: string;
  @ApiProperty({ nullable: true }) scanId!: string | null;
  @ApiProperty({ nullable: true, type: Number }) scanRiskScore!: number | null;
  @ApiProperty({ nullable: true, type: String }) scanModelVersion!: string | null;
  @ApiProperty({ enum: ['PENDING', 'REVIEWING', 'CONFIRMED', 'REJECTED'] }) status!: string;
  @ApiProperty() adminNote!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}
export class MessageResponse { @ApiProperty() message!: string; }
export class StatsResponse {
  @ApiProperty() users!: number;
  @ApiProperty() scans!: number;
  @ApiProperty({ description: 'Số lượt nguy hiểm, có thể lặp URL' }) dangerousScans!: number;
  @ApiProperty() pendingReports!: number;
  @ApiProperty() reviewedReports!: number;
}
export class HealthResponse {
  @ApiProperty({ example: 'ok' }) status!: string;
  @ApiProperty({ description: 'Chỉ báo có endpoint, không xác minh AI đang hoạt động' }) aiConfigured!: boolean;
}
export function ApiPage(model: Type<unknown>) {
  return applyDecorators(ApiExtraModels(model), ApiOkResponse({ schema: {
    type: 'object', required: ['items', 'total', 'page', 'pageSize', 'totalPages'],
    properties: { items: { type: 'array', items: { $ref: getSchemaPath(model) } }, total: { type: 'integer' }, page: { type: 'integer' }, pageSize: { type: 'integer' }, totalPages: { type: 'integer' } },
  } }));
}
