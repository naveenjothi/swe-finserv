import { NestFactory, Reflector } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load } from 'js-yaml';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/infrastructure/filters/global-exception.filter';
import { RolesGuard } from './shared/infrastructure/guards/roles.guard';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 8000);
  const corsOrigin = config.get<string>('CORS_ORIGIN', '*');

  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.enableCors({ origin: corsOrigin, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalGuards(new RolesGuard(app.get(Reflector)));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SENTINEL API')
    .setDescription('Risk classification, KYC, and audit backend for Halcyon Capital Partners')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const staticSpecPath = join(process.cwd(), 'specs', 'sentinel-api.openapi.yaml');
  const staticDocument = existsSync(staticSpecPath)
    ? (load(readFileSync(staticSpecPath, 'utf8')) as OpenAPIObject)
    : null;

  const document: OpenAPIObject =
    staticDocument ?? SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  Logger.log(`SENTINEL API listening on http://localhost:${port} (docs: /docs)`, 'Bootstrap');
}

void bootstrap();
