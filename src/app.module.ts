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
import {DataHistory1mo,DataHistory1d,DataHistory4h,DataHistory1h,DataHistory30m,DataHistory15m,DataHistory5m ,DataHistory1m} from './stock/entities';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './stock/tasks.service';
import { StockHelperService } from './stock/stockHelper.service';
import { WebhooksService } from './webhooks/webhooks.service';
import { LocalPLWR } from './stock/runlocal.service';
import { AlphavantageService } from './alphavantage/alphavantage.service';
import { TasksUSMKService } from './stock/task_usmk.service';
@Module({
  imports: [
    ScheduleModule.forRoot(),
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
            StockPortfolio,Buy, Sell, Withdraw, Deposit, HoldingAmounts, LostDay,
            DataHistory4h,DataHistory1h,DataHistory30m,DataHistory15m,DataHistory5m,DataHistory1m,DataHistory1d,DataHistory1mo
          ],
          synchronize: true,
        };
      },
    }),
    UserModule,
    ShopModule,
    TypeOrmModule.forFeature([DataHistory1mo,DataHistory1d,DataHistory4h,DataHistory1h,DataHistory30m,DataHistory15m,DataHistory5m,DataHistory1m ]),
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
  providers: [AppService, TasksService,StockHelperService, WebhooksService, LocalPLWR, AlphavantageService,TasksUSMKService],
})
export class AppModule {}
