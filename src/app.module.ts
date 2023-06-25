import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/user.entity';
import { ShopModule } from './shop/shop.module';
import { Product } from './entity/product.entity';
import { ProductBrand } from './entity/ProductBrands.entity';
import { ProductType } from './entity/productTypes.entity';
import { SeedService } from './SeedData/shop.service';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('SMTP_HOST'),
          port: Number(config.get<string>('SMTP_PORT')),
          secure: Boolean(config.get<string>('SMTP_SECURE')),
          auth: {
            user: config.get<string>('SMTP_USERNAME'),
            pass: config.get<string>('SMTP_PASSWORD'),
          },
        },
      }),
    }),
    
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbUrl = new URL(config.get<string>('DATABASE_URL'));
        const routingId = dbUrl.searchParams.get('options');
        dbUrl.searchParams.delete('options');

        return {
          type: 'cockroachdb',
          url: dbUrl.toString(),
          ssl: true,
          extra: {
            options: routingId,
          },
          entities: [User, Product, ProductBrand, ProductType],
          synchronize: true,
        };
      },
    }),
    UserModule,
    ShopModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
