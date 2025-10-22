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
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ContentfulModule } from './contentful/contentful.module';
import { StockModule } from './stock/stock.module';
import { AuthModule } from './auth/auth.module';
import { StockUserModule } from './stock-user/stock-user.module';
import { StockUser } from './stock-user/entities/stock-user.entity';
import { WatchList } from './stock-user/entities/watchlist.entity';
import { UserAuth } from './auth/userAuth.entity';
import { StockPortfolioModule } from './stock-portfolio/stock-portfolio.module';
import { Buy, Deposit, HoldingAmounts, Sell, StockPortfolio, Withdraw, LostDay } from './stock-portfolio/entities';
import { AiToolModule } from './ai-tool/ai-tool.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { MegaModule } from './mega/mega.module';
import { AlphavantageModule } from './alphavantage/alphavantage.module';
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
          entities: [
            User,
            Product,
            ProductBrand,
            ProductType,
            StockUser,
            WatchList,
            UserAuth,
            StockPortfolio,Buy, Sell, Withdraw, Deposit, HoldingAmounts, LostDay
          ],
          synchronize: true,
        };
      },
    }),
    UserModule,
    ShopModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '/src/assets/images'), // Specify the path to the assets directory
      serveRoot: '/images', // The URL path to access the assets
    }),
    ContentfulModule,
    StockModule,
    AuthModule,
    StockUserModule,
    StockPortfolioModule,
    AiToolModule,
    WebhooksModule,
    MegaModule,
    AlphavantageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
