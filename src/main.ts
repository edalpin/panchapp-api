import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { EnvConfig } from './config/env.schema';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService<EnvConfig, true>);

  // Logger config
  app.useLogger(app.get(Logger));

  // General config
  const port = configService.get('PORT', { infer: true });
  await app.listen(port);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
