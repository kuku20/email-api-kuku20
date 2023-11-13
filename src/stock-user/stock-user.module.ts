import { Module } from '@nestjs/common';
import { StockUserService } from './stock-user.service';
import { StockUserController } from './stock-user.controller';
import { StockUser } from './entities/stock-user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatchList } from './entities/watchlist.entity';

@Module({
  controllers: [StockUserController],
  providers: [StockUserService],
  imports: [TypeOrmModule.forFeature([StockUser, WatchList])],
})
export class StockUserModule {}
