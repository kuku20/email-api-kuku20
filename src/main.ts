import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
const cookieSession = require('cookie-session');
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
    // const seedService = app.get(SeedService);
  // await seedService.seedData();
    // 🚀 Allow larger JSON and form payloads (default is 100KB)
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ limit: '10mb', extended: true }));
  app.enableCors({
    origin: ['http://localhost:4200','http://localhost:3001','https://audio-for-you.web.app','https://onlinebuyer.web.app','https://stockmarkets000.web.app','https://lewisluu.web.app','https://locluu.web.app','https://lucasluu.web.app'],
    // origin: '*',
    credentials: true,
    methods: 'GET,PUT,POST,DELETE,HEAD,OPTIONS,PATCH',
    allowedHeaders: ['Content-Type', 'Range'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
  });
  app.use(cookieParser());
  app.use(cookieSession({
    keys:['mynameLoc'],
    secure:true,
  }))

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0', function () {
    console.log(`Application listening on port ${port}`);
  });
}

bootstrap();