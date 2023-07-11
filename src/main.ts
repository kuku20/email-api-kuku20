import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
const cookieSession = require('cookie-session');
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
    // const seedService = app.get(SeedService);
  // await seedService.seedData();
  app.enableCors({
    origin: ['http://localhost:4200','http://localhost:60762'],
    credentials: true,
  });
  
  app.use(cookieSession({
    keys:['mynameLoc'],
    secure: configService.get<boolean>('SECURE'),
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