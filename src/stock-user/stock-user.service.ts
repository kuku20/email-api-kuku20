import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockUser } from './entities/stock-user.entity';
import { WatchList } from './entities/watchlist.entity';
import { CreateStockUserDto, WatchListDto, UpdateStockUserDto, UserListOutDto } from './dto';
import { User } from 'src/user/user.entity';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class StockUserService {
  constructor(
    @InjectRepository(StockUser)
    private stockUserRepo: Repository<StockUser>,
    @InjectRepository(WatchList)
    private watchListRepo: Repository<WatchList>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}
  async createStockUser(
    createStockUserDto: CreateStockUserDto,
  ): Promise<StockUser> {
    const user = await this.userRepo.findOneOrFail({
      where: { id: createStockUserDto.id },
    });

    // Create the StockUser entity
    const stockUser = this.stockUserRepo.create({
      userId: user,
      listTickers: createStockUserDto.listTickers,
    });

    // Save the StockUser entity to the database
    return await this.stockUserRepo.save(stockUser);
  }

  async createWatchList(watchListDto: WatchListDto): Promise<WatchList> {
    const user = await this.stockUserRepo.findOneOrFail({
      where: { id: watchListDto.stockUserId },
    });
    const watchlist = this.watchListRepo.create({
      dateAdded: watchListDto.dateAdded,
      pctChangeAtAdded: watchListDto.pctChangeAtAdded,
      priceAtAdded: watchListDto.priceAtAdded,
      spotline: watchListDto.spotline,
      symbol: watchListDto.symbol,
      stockUserId: user,
    });
    return await this.watchListRepo.save(watchlist);
  }

  async findAllStockUsers() {
    const stockUserRepo = await this.stockUserRepo.find({
      // relations: ['userId','watchlists'], // Load the associated userId
      relations: ['watchlists'], // Load the associated userId
    });
    return stockUserRepo;
    return plainToInstance(UserListOutDto, stockUserRepo);
  }

  async findStockUserByUserId(userId: string) {
    const stockUser = await this.stockUserRepo.findOne({
      where: { userId: { id: userId } },
      relations: ['watchlists'], // Load the associated watchlists
    });
  
    if (!stockUser) {
      return null; // Or throw an exception, depending on your use case
    }
  
    return stockUser;
    return plainToInstance(UserListOutDto, stockUser);
  }


  async findAllwatchlists() {
    const watchListRepo = await this.watchListRepo.find({
      relations: ['stockUserId',], // Load the associated userId
    });
    // return watchListRepo;
    return plainToInstance(UserListOutDto, watchListRepo);
  }

  update(id: number, updateStockUserDto: UpdateStockUserDto) {
    return `This action updates a #${id} stockUser`;
  }

  async removeStockUserList(id: string) {
    const user = await this.findOneStockUserList(id);
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return this.stockUserRepo.remove(user);
  }

  findOneStockUserList(id: string) {
    if (!id) throw new NotFoundException('user not found');
    return this.stockUserRepo.findOne({ where: { id } });
  }

  async removeList(id: string) {
    const user = await this.findOneList(id);
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return this.watchListRepo.remove(user);
  }

  findOneList(id: string) {
    if (!id) throw new NotFoundException('user not found');
    return this.watchListRepo.findOne({ where: { id } });
  }
}
