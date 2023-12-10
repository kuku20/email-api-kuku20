import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, QueryFailedError, Repository } from 'typeorm';
import {
  Buy,
  Sell,
  Withdraw,
  Deposit,
  HoldingAmounts,
  StockPortfolio,
} from './entities/index';
import {
  BuyDto,
  DepositDto,
  HoldingAmountsDto,
  SellDto,
  WithdrawDto,
  UserDto,
  CreateStockPortfolioDto,
  UpdateStockPortfolioDto,
} from './dto/index';

import { WalletOutPutDto } from './dto/out/index';
import { UserAuth } from 'src/auth/userAuth.entity';
import { plainToInstance } from 'class-transformer';
@Injectable()
export class StockPortfolioService {
  constructor(
    @InjectRepository(StockPortfolio)
    private PortfolioRepo: Repository<StockPortfolio>,
    @InjectRepository(HoldingAmounts)
    private HoldingRepo: Repository<HoldingAmounts>,
    @InjectRepository(Deposit)
    private DepositRepo: Repository<Deposit>,
    @InjectRepository(Withdraw)
    private WithdrawRepo: Repository<Withdraw>,
    @InjectRepository(Sell)
    private SellRepo: Repository<Sell>,
    @InjectRepository(Buy)
    private BuyRepo: Repository<Buy>,
    @InjectRepository(UserAuth)
    private userRepo: Repository<UserAuth>,
  ) {}

  async createPortfolio(
    createPortfolio: CreateStockPortfolioDto,
  ): Promise<StockPortfolio> {
    try {
      const user = await this.userRepo.findOneOrFail({
        where: { id: createPortfolio.id },
      });

      // Create the PortfolioRepo entity
      const stockPortfolio = this.PortfolioRepo.create({
        userId: user,
        balance: 0,
      });

      // Save the stockPortfolio entity to the database
      const result = await this.PortfolioRepo.save(stockPortfolio);
      return result;
      // return plainToInstance(WalletOutPutDto, result);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        // Handle not found exception as needed
        throw new NotFoundException(
          `This user id ${createPortfolio.id} has list-stock`,
        );
      } else if (error instanceof QueryFailedError) {
        // Handle query execution error
        throw new NotAcceptableException(
          'You cannot have more than 1 user-list',
        );
      }
      // Handle other errors or rethrow
      throw error;
    }
  }

  async findStockUserByUserId(userId: string) {
    try {
      const stockUser = await this.PortfolioRepo.findOne({
        where: { userId: { id: userId } },
        relations: [
          'deposits',
          'withdraws',
          'buys',
          'sells',
          'holding_amounts',
        ], // Load the associated userId
      });

      if (!stockUser) {
        throw new NotFoundException(`You don't have any list`);
      }

      return stockUser;
      // return plainToInstance(UserListOutDto, stockUser);
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

  async findAllPortfolios() {
    const PortfolioRepo = await this.PortfolioRepo.find({
      // relations: ['userId', 'watchlists'], // Load the associated userId
      relations: [
        'userId',
        'deposits',
        'withdraws',
        'buys',
        'sells',
        'holding_amounts',
      ], // Load the associated userId
    });
    // return PortfolioRepo;
    return plainToInstance(WalletOutPutDto, PortfolioRepo);
  }

  async deposits(depositDto: DepositDto): Promise<Deposit> {
    try {
      const stockPortfolio = await this.PortfolioRepo.findOne({
        where: { userId: { id: depositDto.id } },
        relations: ['deposits'], // Load the associated watchlists
      });

      if (stockPortfolio.id !== depositDto.sPortfolioId) {
        throw new InternalServerErrorException('Error executing the query');
      }
      const user = await this.PortfolioRepo.findOneOrFail({
        where: { id: depositDto.sPortfolioId },
      });
      const deposit = this.DepositRepo.create({
        dateDeposit: depositDto.dateDeposit,
        amount: depositDto.amount,
        method: depositDto.method,
        status:depositDto.status,
        sPortfolioId: user,
      });
      const newDeposit= await this.DepositRepo.save(deposit);
      return newDeposit;
      // return plainToInstance(ListOutDto, newList);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        // Handle not found exception as needed
        throw new NotFoundException(
          `stockPortfolio with userId ${depositDto.sPortfolioId} not found`,
        );
      } else if (error instanceof QueryFailedError) {
        // Handle query execution error
        throw new InternalServerErrorException('Error executing the query');
      }
      // Handle other errors or rethrow
      throw error;
    }
  }

  async withdraws(withdrawDto: WithdrawDto): Promise<Withdraw> {
    try {
      const stockPortfolio = await this.PortfolioRepo.findOne({
        where: { userId: { id: withdrawDto.id } },
        relations: ['withdraws'], // Load the associated watchlists
      });

      if (stockPortfolio.id !== withdrawDto.sPortfolioId) {
        throw new InternalServerErrorException('Error executing the query');
      }
      const user = await this.PortfolioRepo.findOneOrFail({
        where: { id: withdrawDto.sPortfolioId },
      });
      const withdraw = this.WithdrawRepo.create({
        dateWithdraw: withdrawDto.dateWithdraw,
        amount: withdrawDto.amount,
        method: withdrawDto.method,
        status:withdrawDto.status,
        sPortfolioId: user,
      });
      const newWithdraw= await this.WithdrawRepo.save(withdraw);
      return newWithdraw;
      // return plainToInstance(ListOutDto, newList);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        // Handle not found exception as needed
        throw new NotFoundException(
          `stockPortfolio with userId ${withdrawDto.sPortfolioId} not found`,
        );
      } else if (error instanceof QueryFailedError) {
        // Handle query execution error
        throw new InternalServerErrorException('Error executing the query');
      }
      // Handle other errors or rethrow
      throw error;
    }
  }

  async buys(BuyDto: BuyDto): Promise<Buy> {
    try {
      const stockPortfolio = await this.PortfolioRepo.findOne({
        where: { userId: { id: BuyDto.id } },
        relations: ['buys'], // Load the associated watchlists
      });

      if (stockPortfolio.id !== BuyDto.sPortfolioId) {
        throw new InternalServerErrorException('Error executing the query');
      }
      const user = await this.PortfolioRepo.findOneOrFail({
        where: { id: BuyDto.sPortfolioId },
      });
      const buy = this.BuyRepo.create({
        dateBuy:BuyDto.dateBuy,
        symbol:BuyDto.symbol,
        amount:BuyDto.amount,
        matchPrice:BuyDto.matchPrice,
        marketCap:BuyDto.marketCap,
        sPortfolioId: user,
      });
      const newBuy= await this.BuyRepo.save(buy);
      return newBuy;
      // return plainToInstance(ListOutDto, newList);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        // Handle not found exception as needed
        throw new NotFoundException(
          `stockPortfolio with userId ${BuyDto.sPortfolioId} not found`,
        );
      } else if (error instanceof QueryFailedError) {
        // Handle query execution error
        throw new InternalServerErrorException('Error executing the query');
      }
      // Handle other errors or rethrow
      throw error;
    }
  }

  async sells(SellDto: SellDto): Promise<Sell> {
    try {
      const stockPortfolio = await this.PortfolioRepo.findOne({
        where: { userId: { id: SellDto.id } },
        relations: ['withdraws'], // Load the associated watchlists
      });

      if (stockPortfolio.id !== SellDto.sPortfolioId) {
        throw new InternalServerErrorException('Error executing the query');
      }
      const user = await this.PortfolioRepo.findOneOrFail({
        where: { id: SellDto.sPortfolioId },
      });
      const sell = this.SellRepo.create({
        dateSell:SellDto.dateSell,
        symbol:SellDto.symbol,
        amount:SellDto.amount,
        matchPrice:SellDto.matchPrice,
        marketCap:SellDto.marketCap,
        sPortfolioId: user,
      });
      const newSell= await this.SellRepo.save(sell);
      return newSell;
      // return plainToInstance(ListOutDto, newList);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        // Handle not found exception as needed
        throw new NotFoundException(
          `stockPortfolio with userId ${SellDto.sPortfolioId} not found`,
        );
      } else if (error instanceof QueryFailedError) {
        // Handle query execution error
        throw new InternalServerErrorException('Error executing the query');
      }
      // Handle other errors or rethrow
      throw error;
    }
  }

  create(createStockPortfolioDto: CreateStockPortfolioDto) {
    return 'This action adds a new stockPortfolio';
  }

  findAll() {
    return `This action returns all stockPortfolio`;
  }

  findOne(id: number) {
    return `This action returns a #${id} stockPortfolio`;
  }

  update(id: number, updateStockPortfolioDto: UpdateStockPortfolioDto) {
    return `This action updates a #${id} stockPortfolio`;
  }

  remove(id: number) {
    return `This action removes a #${id} stockPortfolio`;
  }
}
