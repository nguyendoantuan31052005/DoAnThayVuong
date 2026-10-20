import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { AppModule } from './app';
import { NextFunction, Request, Response } from 'express';
import { ApiErrorFilter } from './error.filter';
import { intConfig, validateConfig } from './config';

export async function createApplication() {
  validateConfig();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: process.env.NODE_ENV === 'test' ? false : ['log', 'warn', 'error'] });
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.use((req: unknown, res: { setHeader: (name: string, value: string) => void }, next: () => void) => {
    res.setHeader('X-Request-Id', randomUUID()); next();
  });
  // Swagger's inline initializer needs this narrowly scoped CSP exception.
  app.use(helmet());
  app.use('/api/docs', helmet({ contentSecurityPolicy: { directives: { scriptSrc: ["'self'", "'unsafe-inline'"] } } }));
  app.useBodyParser('json', { limit: '16kb' });
  app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
    if (error && typeof error === 'object' && 'type' in error && error.type === 'entity.parse.failed') next(new BadRequestException('JSON không hợp lệ'));
    else next(error);
  });
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new ApiErrorFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, validationError: { target: false, value: false } }));
  app.enableCors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173', exposedHeaders: ['X-Request-Id'], methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] });
  const config = new DocumentBuilder().setTitle('Phishing Detection Backend').setVersion('1.0.0')
    .setDescription('API NestJS + SQLite. JWT 1 giờ; logout thu hồi phiên. API AI bên ngoài, không tự sinh dự đoán khi AI vắng mặt. Các API danh sách trả {items,total,page,pageSize,totalPages}.')
    .addServer('/').addBearerAuth().build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, { jsonDocumentUrl: 'api/openapi.json', swaggerOptions: { persistAuthorization: false } });
  app.enableShutdownHooks();
  return { app, document };
}
export async function bootstrap(port = intConfig('PORT', 3000, 1, 65535)) {
  const { app } = await createApplication();
  await app.listen(port, '0.0.0.0');
  return app;
}
if (require.main === module) bootstrap().catch(() => { console.error('Không thể khởi động. Kiểm tra cấu hình, database và JWT_SECRET.'); process.exitCode = 1; });
