import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
const cookieSession = require('cookie-session');
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
    // const seedService = app.get(SeedService);
  // await seedService.seedData();
  app.enableCors({
    origin: ['https://onlinebuyer.web.app','http://localhost:4200','https://stockmarkets000.web.app','https://lewisluu.web.app'],
    // origin: '*',
    credentials: true,
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