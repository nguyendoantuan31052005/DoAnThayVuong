import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, Res, StreamableFile, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { Db } from './database';
import { AuthGuard } from './auth';
import { AuthRequest, requireRecord } from './common';
export const evidenceMetadata = { evidence: { select: { fileName: true, mimeType: true, size: true } } } as const;
@ApiTags('Reports') @ApiBearerAuth()
@Controller('reports/:id/evidence') @UseGuards(AuthGuard)
export class EvidenceController {
  constructor(private db: Db) {}
  private async authorize(req: AuthRequest, id: string) {
    return requireRecord(await this.db.report.findFirst({ where: { id, ...(req.user.role === 'ADMIN' ? {} : { userId: req.user.id }) } }));
  }
  @Post() @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Đính kèm hoặc thay thế ảnh bằng chứng PNG/JPG tối đa 5 MiB; chủ báo cáo hoặc ADMIN' })
  async upload(@Req() req: AuthRequest, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @UploadedFile() file?: Express.Multer.File) {
    await this.authorize(req, id);
    if (!file) throw new BadRequestException('Cần đính kèm ảnh bằng chứng');
    const png = file.buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpg = file.buffer.length >= 3 && file.buffer[0] === 255 && file.buffer[1] === 216 && file.buffer[2] === 255;
    const mimeType = png ? 'image/png' : jpg ? 'image/jpeg' : '';
    if (!mimeType || file.mimetype !== mimeType) throw new BadRequestException('Chỉ nhận ảnh PNG/JPG có định dạng hợp lệ');
    const data = { data: new Uint8Array(file.buffer), mimeType, size: file.size, fileName: file.originalname.replace(/[^\p{L}\p{N}._-]/gu, '_').slice(0, 120) || 'bang-chung' };
    return this.db.$transaction(async tx => {
      const report = requireRecord(await tx.report.findUnique({ where: { id } }));
      if (!['PENDING', 'REVIEWING'].includes(report.status)) throw new BadRequestException('Báo cáo đã xử lý; không thể thay đổi bằng chứng');
      const evidence = await tx.evidence.upsert({ where: { reportId: id }, create: { reportId: id, ...data }, update: data, select: { fileName: true, mimeType: true, size: true } });
      if (req.user.role === 'ADMIN') await tx.auditLog.create({ data: { actorId: req.user.id, action: 'EVIDENCE_UPLOAD', targetId: id, details: JSON.stringify({ mimeType, size: file.size }) } });
      return evidence;
    });
  }
  @Get() @ApiOperation({ summary: 'Tải ảnh bằng chứng; chỉ chủ báo cáo hoặc ADMIN, không có URL công khai' })
  async download(@Req() req: AuthRequest, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Res({ passthrough: true }) res: Response) {
    await this.authorize(req, id);
    const record = requireRecord(await this.db.evidence.findUnique({ where: { reportId: id } }));
    res.setHeader('Cache-Control', 'no-store');
    return new StreamableFile(Buffer.from(record.data), { type: record.mimeType, disposition: `attachment; filename*=UTF-8''${encodeURIComponent(record.fileName)}` });
  }
}
