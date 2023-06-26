import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cors from 'cors';
import { ValidationPipe } from '@nestjs/common';
import { ShopService } from './shop/shop.service';
import { SeedService } from './SeedData/shop.service';
const cookieSession = require('cookie-session');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // const seedService = app.get(SeedService);
  // await seedService.seedData();
  app.use(cookieSession({
    keys:['mynameLoc']
  }))
  // Enable CORS
  app.use(cors());
  app.useGlobalPipes(new ValidationPipe({
    whitelist:true,
    forbidNonWhitelisted:true
  }))
  
  const port = process.env.PORT || 3000;
  app.listen(port, '0.0.0.0', function () {
    console.log(`Application listening on port ${port}`);
  });
}

bootstrap();