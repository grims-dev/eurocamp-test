import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';
import { ApiErrorFilter } from './http-client/api-error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  // Keeps upstream failures from being flattened into a generic 500.
  app.useGlobalFilters(new ApiErrorFilter());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  const port = process.env.PORT || 3333;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
