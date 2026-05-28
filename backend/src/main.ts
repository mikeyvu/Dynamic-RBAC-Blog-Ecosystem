import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';

//The entry file of the application which uses the core function NestFactory to create a Nest application instance.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
  //This line make every request that enter the backend system have to go throgh the Validation pipe
  // whitelist: true will automatically delete values that were not defined in DTO
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
