import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockUser } from './entities/stock-user.entity';
import { WatchList } from './entities/watchlist.entity';
import { CreateStockUserDto, WatchListDto,UpdateStockUserDto } from './dto';

@Injectable()
export class StockUserService {
  constructor(
    @InjectRepository(StockUser)
    private stockUserRepo: Repository<StockUser>,
    @InjectRepository(WatchList)
    private watchListRepo: Repository<WatchList>,
  ) {}
  async createStockUser(
    createStockUserDto: CreateStockUserDto,
  ): Promise<StockUser> {
    const stockUser = this.stockUserRepo.create({
      userId: createStockUserDto.userId,
      listTickers: createStockUserDto.listTickers,
    });
    return await this.stockUserRepo.save(stockUser);
  }

  async createWatchList(watchListDto: WatchListDto): Promise<WatchList> {
    const watchlist = this.watchListRepo.create({
      dateAdded: watchListDto.dateAdded,
      pctChangeAtAdded: watchListDto.pctChangeAtAdded,
      priceAtAdded: watchListDto.priceAtAdded,
      spotline: watchListDto.spotline,
      symbol: watchListDto.symbol,
    });
    return await this.watchListRepo.save(watchlist);
  }

  async findAllStockUsers() {
    const stockUserRepo = await this.stockUserRepo.find()
    return stockUserRepo;
  }

  async findAllwatchlists() {
    const watchListRepo = await this.watchListRepo.find()
    return watchListRepo;
  }

  findOne(id: number) {
    return `This action returns a #${id} stockUser`;
  }

  update(id: number, updateStockUserDto: UpdateStockUserDto) {
    return `This action updates a #${id} stockUser`;
  }

  remove(id: number) {
    return `This action removes a #${id} stockUser`;
  }
}
