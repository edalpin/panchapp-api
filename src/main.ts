import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { AppModule } from './app.module';
import { CORRELATION_ID_RESPONSE_HEADER } from './common/correlation/correlation-id.util';
import { EnvConfig } from './config/env.schema';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService<EnvConfig, true>);

  // Logger config
  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());

  // CORS for mobile / web clients
  const corsOrigin = configService.get('CORS_ORIGIN', { infer: true });
  app.enableCors({
    origin: corsOrigin?.split(',').map((origin) => origin.trim()) ?? true,
    credentials: true,
    exposedHeaders: [CORRELATION_ID_RESPONSE_HEADER],
  });

  // General config
  const port = configService.get('PORT', { infer: true });
  await app.listen(port);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
