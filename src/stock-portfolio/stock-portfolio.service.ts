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
          // 'deposits', 'withdraws', 'buys', 'sells',
          'holding_amounts',
        ],
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
      const userwallet = await this.PortfolioRepo.findOneOrFail({
        where: { id: depositDto.sPortfolioId },
      });
      // update balance
      const newBalance = userwallet.balance + depositDto.amount;
      const netDeposit = userwallet.netDeposit + depositDto.amount;
      const maxAllow = 100000;
      if (netDeposit > maxAllow) {
        throw new NotAcceptableException(
          `You reach the limit 100k, You deposit up to ${
            maxAllow - userwallet.netDeposit
          }, connect admin for more `,
        );
      }
      if (newBalance > 0) {
        Object.assign(userwallet, { balance: newBalance ,netDeposit:netDeposit});
        this.PortfolioRepo.save(userwallet);
      } else {
        throw new NotAcceptableException("Balance Not Enough")
      }
      const deposit = this.DepositRepo.create({
        date: depositDto.date,
        amount: depositDto.amount,
        method: depositDto.method,
        status:depositDto.status,
        sPortfolioId: userwallet,
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
      const userwallet = await this.PortfolioRepo.findOneOrFail({
        where: { id: withdrawDto.sPortfolioId },
      });
      // update balance
      const newBalance = userwallet.balance - withdrawDto.amount;
      const netDeposit = userwallet.netDeposit - withdrawDto.amount;
      if (newBalance > 0) {
        Object.assign(userwallet, { balance: newBalance ,netDeposit:netDeposit});
        this.PortfolioRepo.save(userwallet);
      } else {
        throw new NotAcceptableException("Balance Not Enough")
      }

      const withdraw = this.WithdrawRepo.create({
        date: withdrawDto.date,
        amount: withdrawDto.amount,
        method: withdrawDto.method,
        status:withdrawDto.status,
        sPortfolioId: userwallet,
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

  async buys(BuyDto: BuyDto): Promise<any> {
    try {
      const stockPortfolio = await this.PortfolioRepo.findOne({
        where: { userId: { id: BuyDto.id } },
        relations: ['buys','holding_amounts'], // Load the associated watchlists
      });

      if (stockPortfolio.id !== BuyDto.sPortfolioId) {
        throw new InternalServerErrorException('Error executing the query');
      }
      const userwallet = await this.PortfolioRepo.findOneOrFail({
        where: { id: BuyDto.sPortfolioId },
      });

      // update balance
      const newBalance = userwallet.balance - BuyDto.amount*BuyDto.matchPrice;
      if (newBalance > 0) {
        Object.assign(userwallet, { balance: newBalance });
        this.PortfolioRepo.save(userwallet);
      } else {
        throw new NotAcceptableException("Balance Not Enough")
      }

      const buy = this.BuyRepo.create({
        date:BuyDto.date,
        symbol:BuyDto.symbol,
        amount:BuyDto.amount,
        matchPrice:BuyDto.matchPrice,
        netvalue:BuyDto.netvalue,
        marketCap:BuyDto.marketCap,
        sPortfolioId: userwallet,
      });
      const newBuy= await this.BuyRepo.save(buy);
      //check in holding
      const stockInHolding = await this.PortfolioRepo.createQueryBuilder('portfolio')
      .leftJoinAndSelect('portfolio.holding_amounts', 'holding_amount')
      .where('portfolio.userId = :userId', { userId: BuyDto.id })
      .andWhere('holding_amount.symbol = :symbol', { symbol: BuyDto.symbol }).getOne();
      let h_Symbol;
      if (!stockInHolding) {
        //set to database in holding
        h_Symbol = this.HoldingRepo.create({
          symbol: BuyDto.symbol,
          amount: BuyDto.amount,
          matchPrice: BuyDto.matchPrice,
          marketCap: BuyDto.marketCap,
          sPortfolioId: userwallet,
        });
      } else {
        h_Symbol = stockInHolding.holding_amounts[0];
        const n_Amount = BuyDto.amount + h_Symbol.amount;
        const n_Price =
          (BuyDto.matchPrice * BuyDto.amount +
            h_Symbol.matchPrice * h_Symbol.amount) /
          n_Amount;
        const up_H_Symbol = {
          amount: n_Amount,
          matchPrice: n_Price,
          marketCap: BuyDto.marketCap,
        };
        Object.assign(h_Symbol, up_H_Symbol);
      }
      const holdingSymbol = await this.HoldingRepo.save(h_Symbol);
      // Create the response DTO
      const response = {
        statusCode: 200,
        transaction: newBuy,
        newHolding: holdingSymbol,
      };
      return response;
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

  async sells(SellDto: SellDto): Promise<any> {
    try {
      const stockPortfolio = await this.PortfolioRepo.findOne({
        where: { userId: { id: SellDto.id } },
        relations: ['withdraws'], // Load the associated watchlists
      });

      if (stockPortfolio.id !== SellDto.sPortfolioId) {
        throw new InternalServerErrorException('Error executing the query');
      }
      const userwallet = await this.PortfolioRepo.findOneOrFail({
        where: { id: SellDto.sPortfolioId },
      });
      // update balance
      const newBalance = userwallet.balance + SellDto.amount*SellDto.matchPrice;
      if (newBalance > 0) {
        Object.assign(userwallet, { balance: newBalance });
        this.PortfolioRepo.save(userwallet);
      } else {
        throw new NotAcceptableException("Balance Not Enough")
      }
      const sell = this.SellRepo.create({
        date:SellDto.date,
        symbol:SellDto.symbol,
        amount:SellDto.amount,
        matchPrice:SellDto.matchPrice,
        marketCap:SellDto.marketCap,
        netvalue:SellDto.netvalue,
        sPortfolioId: userwallet,
      });
      //check in holding
      const stockInHolding = await this.PortfolioRepo.createQueryBuilder('portfolio')
      .leftJoinAndSelect('portfolio.holding_amounts', 'holding_amount')
      .where('portfolio.userId = :userId', { userId: SellDto.id })
      .andWhere('holding_amount.symbol = :symbol', { symbol: SellDto.symbol }).getOne();
      let h_Symbol;
      if (!stockInHolding) {
        //set to database in holding
        throw new NotAcceptableException("You don't Have this")
      } else {
        h_Symbol = stockInHolding.holding_amounts[0];
        const n_Amount = h_Symbol.amount - SellDto.amount;
        if(n_Amount<0){
          throw new NotAcceptableException("You don't that much")
        }
        const up_H_Symbol = {
          amount: n_Amount,
          marketCap: SellDto.marketCap,
        };
        Object.assign(h_Symbol, up_H_Symbol);
      }
      const holdingSymbol = await this.HoldingRepo.save(h_Symbol);
      const newSell = await this.SellRepo.save(sell);
      const res = {
        statusCode: 200,
        transaction: newSell,
        stockHolding: holdingSymbol,
      };
      return res;
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
