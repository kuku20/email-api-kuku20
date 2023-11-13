import {
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, QueryFailedError, Repository } from 'typeorm';
import { StockUser } from './entities/stock-user.entity';
import { WatchList } from './entities/watchlist.entity';
import {
  CreateStockUserDto,
  WatchListDto,
  UserListOutDto,
} from './dto';
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
    try {
      const user = await this.userRepo.findOneOrFail({
        where: { id: createStockUserDto.id },
      });

      // Create the StockUser entity
      const stockUser = this.stockUserRepo.create({
        userId: user,
        listTickers: createStockUserDto.listTickers,
      });

      // Save the StockUser entity to the database
      const result = await this.stockUserRepo.save(stockUser);
      // return result
      return plainToInstance(UserListOutDto, result);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        // Handle not found exception as needed
        throw new NotFoundException(
          `This user id ${createStockUserDto.id} has list-stock`,
        );
      }
      // Handle other errors or rethrow
      throw error;
    }
  }

  async createWatchList(watchListDto: WatchListDto): Promise<WatchList> {
    try {
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
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        // Handle not found exception as needed
        throw new NotFoundException(
          `StockUser with userId ${watchListDto.stockUserId} not found`,
        );
      } else if (error instanceof QueryFailedError) {
        // Handle query execution error
        throw new InternalServerErrorException('Error executing the query');
      }
      // Handle other errors or rethrow
      throw error;
    }
  }

  async findAllStockUsers() {
    const stockUserRepo = await this.stockUserRepo.find({
      relations: ['userId', 'watchlists'], // Load the associated userId
      // relations: ['watchlists'], // Load the associated userId
    });
    // return stockUserRepo;
    return plainToInstance(UserListOutDto, stockUserRepo);
  }

  async findStockUserByUserId(userId: string) {
    try {
      const stockUser = await this.stockUserRepo.findOne({
        where: { userId: { id: userId } },
        relations: ['watchlists'], // Load the associated watchlists
      });

      if (!stockUser) {
        throw new NotFoundException(`You don't have any list`);
      }

      return stockUser;
      return plainToInstance(UserListOutDto, stockUser);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        // Handle not found exception as needed
        throw new NotFoundException(
          `StockUser with userId ${userId} not found`,
        );
      } else if (error instanceof QueryFailedError) {
        // Handle query execution error
        throw new InternalServerErrorException('Error executing the query');
      }
      // Handle other errors or rethrow
      throw error;
    }
  }

  async findAllwatchlists() {
    const watchListRepo = await this.watchListRepo.find({
      relations: ['stockUserId'], // Load the associated userId
    });
    return watchListRepo;
    return plainToInstance(UserListOutDto, watchListRepo);
  }

  async updateUlist(userId: string, updateStockUserDto: Partial<CreateStockUserDto>) {
    try {
      const userlist = await this.stockUserRepo.findOne({
        where: { userId: { id: userId } },
        relations: ['watchlists'], // Load the associated watchlists
      });
      if (!userlist) {
        throw new NotFoundException('user not found');
      }
      Object.assign(userlist, updateStockUserDto);
      return this.stockUserRepo.save(userlist);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        // Handle not found exception as needed
        throw new NotFoundException(
          `This user id ${updateStockUserDto.id} has list-stock`,
        );
      }
      // Handle other errors or rethrow
      throw error;
    }
  }

  async updatewatchList(
    id: string,
    watchListDto:Partial<WatchListDto>,
  ) {
    try {
      const list = await this.watchListRepo.findOne({ where: { id } });
      if (!list) {
        throw new NotFoundException('List not found');
      }
      Object.assign(list, watchListDto);
      return this.watchListRepo.save(list);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        // Handle not found exception as needed
        throw new NotFoundException(`NOT FOUND THIS LIST`);
      }
      // Handle other errors or rethrow
      throw error;
    }
  }

  async removeStockUserList(userId: string) {
    try {
      const stockUser = await this.stockUserRepo.findOne({
        where: { userId: { id: userId } },
        relations: ['watchlists'], // Load the associated watchlists
      });
      const deleteUList = await this.stockUserRepo.remove(stockUser);
      return deleteUList;
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        // Handle not found exception as needed
        throw new NotFoundException(`This user id ${userId} has list-stock`);
      } else if (error instanceof QueryFailedError) {
        // Handle foreign key constraint violation
        throw new NotAcceptableException('Watchlists is not empty');
      }
      // Handle other errors or rethrow
      throw error;
    }
  }

  async removeList(id: string) {
    try {
      const user = await this.watchListRepo.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundException('List not found');
      }
      return this.watchListRepo.remove(user);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        // Handle not found exception as needed
        throw new NotFoundException(`This list not found`);
      } else if (error instanceof QueryFailedError) {
        // Handle query execution error
        throw new InternalServerErrorException('Error executing the query');
      }
      // Handle other errors or rethrow
      throw error;
    }
  }
}