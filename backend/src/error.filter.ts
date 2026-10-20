import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiErrorFilter.name);
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    let status = 500;
    let message: string | string[] = 'Lỗi hệ thống';
    if (error instanceof HttpException) {
      status = error.getStatus();
      const body = error.getResponse();
      message = typeof body === 'string' ? body : (body as { message?: string | string[] }).message || error.message;
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      status = error.code === 'P2025' ? 404 : error.code === 'P2002' ? 409 : 500;
      message = status === 404 ? 'Không tìm thấy bản ghi' : status === 409 ? 'Dữ liệu đã tồn tại' : 'Lỗi xử lý dữ liệu';
    } else if (error && typeof error === 'object' && 'type' in error && error.type === 'entity.parse.failed') {
      status = 400; message = 'JSON không hợp lệ';
    } else if (error && typeof error === 'object' && 'status' in error && error.status === 413) {
      status = 413; message = 'Nội dung yêu cầu quá lớn';
    }
    const requestId = response.getHeader('X-Request-Id');
    if (status >= 500) this.logger.error(`Request failed with status ${status}; requestId=${requestId}`);
    response.status(status).json({ statusCode: status, message, path: request.path, requestId, timestamp: new Date().toISOString() });
  }
}
