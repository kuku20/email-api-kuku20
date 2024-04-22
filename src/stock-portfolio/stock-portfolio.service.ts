import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, QueryFailedError, Repository } from 'typeorm';
import * as ENTITIES from './entities/index';
import {
  InBuySellDto,
  InDepositWithDrawDto,
  CreateStockPortfolioDto,
} from './dto/index';

import {
  BuyOrSellDto,
  DepositOrWithdrawDto,
  UserPortfolioDto,
} from './dto/out/index';
import { UserAuth } from 'src/auth/userAuth.entity';
import { plainToClass, plainToInstance } from 'class-transformer';
import { ValidationError, validateSync } from 'class-validator';
@Injectable()
export class StockPortfolioService {
  constructor(
    @InjectRepository(ENTITIES.StockPortfolio)
    private PortfolioRepo: Repository<ENTITIES.StockPortfolio>,
    @InjectRepository(ENTITIES.HoldingAmounts)
    private HoldingRepo: Repository<ENTITIES.HoldingAmounts>,
    @InjectRepository(ENTITIES.Deposit)
    private DepositRepo: Repository<ENTITIES.Deposit>,
    @InjectRepository(ENTITIES.Withdraw)
    private WithdrawRepo: Repository<ENTITIES.Withdraw>,
    @InjectRepository(ENTITIES.Sell)
    private SellRepo: Repository<ENTITIES.Sell>,
    @InjectRepository(ENTITIES.Buy)
    private BuyRepo: Repository<ENTITIES.Buy>,
    @InjectRepository(UserAuth)
    private userRepo: Repository<UserAuth>,
  ) {}

  async createPortfolio(
    createPortfolio: CreateStockPortfolioDto,
  ): Promise<ENTITIES.StockPortfolio> {
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
  async findAllTypeByUserId(userId: string, queryType:string) {
    try {
      const queryReturnType = await this.PortfolioRepo.findOne({
        where: { userId: { id: userId } },
        relations: [
          queryType,
        ],
      });
      if (!queryReturnType) {
        throw new NotFoundException(`You don't have any ${queryType}`);
      }

      return queryReturnType[queryType];
    } catch (error) {
      const mes = `${queryType} with userId ${userId} not found`;
      this.catchBlock(error, mes);
    }
  }

  async findStockUserByUserId(userId: string) {
    try {
      const stockUser = await this.PortfolioRepo.findOne({
        where: { userId: { id: userId } },
        relations: [
        'holding_amounts',
        ],
      });
      // const walletIdd = '3f9f0167-cac3-4aa5-a2aa-0c7e9ef08d86'
      // await this.HoldingRepo
      // .createQueryBuilder('holding_amounts')
      // .delete()
      // .from(HoldingAmounts)
      // .where('sPortfolioId = :sPortfolioId', { sPortfolioId: walletIdd })
      // .execute();

      // await this.BuyRepo
      // .createQueryBuilder('buys')
      // .delete()
      // .from(Buy)
      // .where('sPortfolioId = :sPortfolioId', { sPortfolioId: walletIdd })
      // .execute();

      // await this.SellRepo
      // .createQueryBuilder('sells')
      // .delete()
      // .from(Sell)
      // .where('sPortfolioId = :sPortfolioId', { sPortfolioId: walletIdd })
      // .execute();

      // await this.DepositRepo
      // .createQueryBuilder('deposits')
      // .delete()
      // .from(Deposit)
      // .where('sPortfolioId = :sPortfolioId', { sPortfolioId: walletIdd })
      // .execute();

      // await this.WithdrawRepo
      // .createQueryBuilder('withdraws')
      // .delete()
      // .from(Withdraw)
      // .where('sPortfolioId = :sPortfolioId', { sPortfolioId: walletIdd })
      // .execute();

      if (!stockUser) {
        throw new NotFoundException(`You don't have any list`);
      }

      return stockUser;
      return plainToInstance(UserPortfolioDto, stockUser);
    } catch (error) {
      const mes = `StockUser with userId ${userId} not found`;
      this.catchBlock(error, mes);
    }
  }

  // async findAllPortfolios() {
  //   const PortfolioRepo = await this.PortfolioRepo.find({
  //     // relations: ['userId', 'watchlists'], // Load the associated userId
  //     relations: [
  //       'userId',
  //       'deposits',
  //       'withdraws',
  //       'buys',
  //       'sells',
  //       'holding_amounts',
  //     ], // Load the associated userId
  //   });
  //   return PortfolioRepo;
  //   // return plainToInstance(WalletOutPutDto, PortfolioRepo);
  // }

  async deposits(requestBody: InDepositWithDrawDto): Promise<DepositOrWithdrawDto> {
    try {
      const stockPortfolio = await this.PortfolioRepo.findOne({
        where: { userId: { id: requestBody.id } },
        relations: ['deposits'], // Load the associated watchlists
      });

      if (stockPortfolio.id !== requestBody.sPortfolioId) {
        throw new InternalServerErrorException('Error executing the query');
      }
      const userwallet = await this.PortfolioRepo.findOneOrFail({
        where: { id: requestBody.sPortfolioId },
      });
      // update balance
      const newBalance = userwallet.balance + requestBody.amount;
      const netDeposit = userwallet.netDeposit + requestBody.amount;
      const maxAllow = 100000;
      if (netDeposit > maxAllow) {
        throw new NotAcceptableException(
          `You reach the limit 100k, You deposit up to ${
            maxAllow - userwallet.netDeposit
          }, connect admin for more `,
        );
      }
      if (newBalance > 0) {
        Object.assign(userwallet, {
          balance: newBalance,
          netDeposit: netDeposit,
        });
        this.PortfolioRepo.save(userwallet);
      } else {
        throw new NotAcceptableException('Balance Not Enough');
      }
      const deposit = this.DepositRepo.create({
        date:requestBody.date,
        method:requestBody.method,
        status:requestBody.status,
        amount:requestBody.amount,
        sPortfolioId: userwallet,
      });
      const newDeposit = await this.DepositRepo.save(deposit);
      const response = {
        statusCode: 200,
        transaction: newDeposit,
      };
      // return response;
      return plainToInstance(DepositOrWithdrawDto, response);
    } catch (error) {
      const mes = `stockPortfolio with userId ${requestBody.sPortfolioId} not found`;
      this.catchBlock(error, mes);
    }
  }

  async withdraws(requestBody: InDepositWithDrawDto): Promise<DepositOrWithdrawDto> {
    try {
      const stockPortfolio = await this.PortfolioRepo.findOne({
        where: { userId: { id: requestBody.id } },
        relations: ['withdraws'], // Load the associated watchlists
      });

      if (stockPortfolio.id !== requestBody.sPortfolioId) {
        throw new InternalServerErrorException('Error executing the query');
      }
      const userwallet = await this.PortfolioRepo.findOneOrFail({
        where: { id: requestBody.sPortfolioId },
      });
      // update balance
      const newBalance = userwallet.balance - requestBody.amount;
      const netDeposit = userwallet.netDeposit - requestBody.amount;
      if (newBalance > 0) {
        Object.assign(userwallet, {
          balance: newBalance,
          netDeposit: netDeposit,
        });
        this.PortfolioRepo.save(userwallet);
      } else {
        throw new NotAcceptableException('Balance Not Enough');
      }

      const withdraw = this.WithdrawRepo.create({
        date:requestBody.date,
        method:requestBody.method,
        status:requestBody.status,
        amount:requestBody.amount,
        sPortfolioId: userwallet,
      });
      const newWithdraw = await this.WithdrawRepo.save(withdraw);
      const response = {
        statusCode: 200,
        transaction: newWithdraw,
      };
      // return response;
      return plainToInstance(DepositOrWithdrawDto, response);
    } catch (error) {
      const mes = `stockPortfolio with userId ${requestBody.sPortfolioId} not found`;
      this.catchBlock(error, mes);
    }
  }

  async buys(requestBody: InBuySellDto): Promise<any> {
    try {
      const stockPortfolio = await this.PortfolioRepo.findOne({
        where: { userId: { id: requestBody.id } },
        relations: ['buys', 'holding_amounts'], // Load the associated watchlists
      });

      if (stockPortfolio.id !== requestBody.sPortfolioId) {
        throw new InternalServerErrorException('Error executing the query');
      }
      const userwallet = await this.PortfolioRepo.findOneOrFail({
        where: { id: requestBody.sPortfolioId },
      });

      // update balance
      const newBalance = userwallet.balance - requestBody.amount * requestBody.matchPrice;
      if (newBalance > 0) {
        Object.assign(userwallet, { balance: newBalance });
        this.PortfolioRepo.save(userwallet);
      } else {
        throw new NotAcceptableException('Balance Not Enough');
      }

      const buy = this.BuyRepo.create({
        date:requestBody.date,
        symbol:requestBody.symbol,
        amount:requestBody.amount,
        matchPrice:requestBody.matchPrice,
        netvalue:requestBody.netvalue,
        marketCap:requestBody.marketCap?requestBody.marketCap:1,
        atPctChange:requestBody.atPctChange,
        sPortfolioId: userwallet,
      });
      const newBuy = await this.BuyRepo.save(buy);
      //check in holding
      const stockInHolding = await this.PortfolioRepo.createQueryBuilder('portfolio',)
        .leftJoinAndSelect('portfolio.holding_amounts', 'holding_amount')
        .where('portfolio.userId = :userId', { userId: requestBody.id })
        .andWhere('holding_amount.symbol = :symbol', { symbol: requestBody.symbol })
        .getOne();
      let h_Symbol;
      let newSymbol;
      if (!stockInHolding) {
        //set to database in holding
        h_Symbol = this.HoldingRepo.create({
          date:requestBody.date,
          symbol:requestBody.symbol,
          amount:requestBody.amount,
          matchPrice:requestBody.matchPrice,
          marketCap:requestBody.marketCap?requestBody.marketCap:1,
          atPctChange:requestBody.atPctChange,
          sPortfolioId: userwallet,
        });
        newSymbol = true
      } else {
        h_Symbol = stockInHolding.holding_amounts[0];
        const n_Amount = requestBody.amount + h_Symbol.amount;
        const n_Price =(requestBody.matchPrice * requestBody.amount +h_Symbol.matchPrice * h_Symbol.amount) / n_Amount;
        const up_H_Symbol = {
          amount: n_Amount,
          matchPrice: n_Price,
          marketCap: requestBody.marketCap?requestBody.marketCap:1,
        };
        Object.assign(h_Symbol, up_H_Symbol);
        newSymbol = false
      }
      const holdingSymbol = await this.HoldingRepo.save(h_Symbol);
      // Create the response DTO
      const response = {
        statusCode: 200,
        transaction: newBuy,
        newHolding: holdingSymbol,
        newSymbol,
      };
      return response
      return plainToClass(BuyOrSellDto, response, {
        // excludeExtraneousValues: true,
      });
    } catch (error) {
      const mes = `stockPortfolio with userId ${requestBody.sPortfolioId} not found`;
      this.catchBlock(error, mes);
    }
  }

  async sells(requestBody: InBuySellDto): Promise<any> {
    try {
      const stockPortfolio = await this.PortfolioRepo.findOne({
        where: { userId: { id: requestBody.id } },
        relations: ['withdraws'], // Load the associated watchlists
      });

      if (stockPortfolio.id !== requestBody.sPortfolioId) {
        throw new InternalServerErrorException('Error executing the query');
      }
      const userwallet = await this.PortfolioRepo.findOneOrFail({
        where: { id: requestBody.sPortfolioId },
      });
      // update balance
      const newBalance =
        userwallet.balance + requestBody.amount * requestBody.matchPrice;
      if (newBalance > 0) {
        Object.assign(userwallet, { balance: newBalance });
        this.PortfolioRepo.save(userwallet);
      } else {
        throw new NotAcceptableException('Balance Not Enough');
      }
      const sell = this.SellRepo.create({
        date:requestBody.date,
        symbol:requestBody.symbol,
        amount:requestBody.amount,
        matchPrice:requestBody.matchPrice,
        netvalue:requestBody.netvalue,
        marketCap:requestBody.marketCap?requestBody.marketCap:1,
        avaragePriceB:requestBody.avaragePriceB,
        netProfit:requestBody.netProfit,
        atPctChange:requestBody.atPctChange,
        atSellPctChange:requestBody.atSellPctChange,
        sPortfolioId: userwallet,
      });
      //check in holding
      const stockInHolding = await this.PortfolioRepo.createQueryBuilder('portfolio')
        .leftJoinAndSelect('portfolio.holding_amounts', 'holding_amount')
        .where('portfolio.userId = :userId', { userId: requestBody.id })
        .andWhere('holding_amount.symbol = :symbol', { symbol: requestBody.symbol })
        .getOne();
      let h_Symbol;
      if (!stockInHolding) {
        //set to database in holding
        throw new NotAcceptableException("You don't Have this");
      } else {
        h_Symbol = stockInHolding.holding_amounts[0];
        const n_Amount = h_Symbol.amount - requestBody.amount;
        if (n_Amount < 0) {
          throw new NotAcceptableException("You don't that much");
        }
        const up_H_Symbol = {
          amount: n_Amount,
          marketCap: requestBody.marketCap?requestBody.marketCap:1,
        };
        Object.assign(h_Symbol, up_H_Symbol);
      }
      await this.HoldingRepo.save(h_Symbol);
      const newSell = await this.SellRepo.save(sell);
      const holdingSymbol = await this.HoldingRepo.save(h_Symbol);
      // Create the response DTO
      const response = {
        statusCode: 200,
        transaction: newSell,
        newHolding: holdingSymbol,
        newSymbol:false,
      };
      return response;
      return plainToClass(BuyOrSellDto, response, {
        // excludeExtraneousValues: true,
      });
    } catch (error) {
      const mes = `stockPortfolio with userId ${requestBody.sPortfolioId} not found`;
      this.catchBlock(error, mes);
    }
  }

  async submit(requestBody: any) {
    if (requestBody.requestType === requestType.SELL) {
      this.validateRequest(requestBody, InBuySellDto);
      return this.sells(requestBody);
    }
    if (requestBody.requestType === requestType.BUY) {
      this.validateRequest(requestBody, InBuySellDto);
      return this.buys(requestBody);
    }
    if (requestBody.requestType === requestType.DEPOSIT) {
      this.validateRequest(requestBody, InDepositWithDrawDto);
      return this.deposits(requestBody);
    }
    if (requestBody.requestType === requestType.WITHDRAW) {
      this.validateRequest(requestBody, InDepositWithDrawDto);
      return this.withdraws(requestBody);
    }
    throw new NotAcceptableException(
      'Type as: deposit, withdraw, sell, or buy',
    );
  }
  private validateRequest(requestBody: any, dtoClass: any): void {
    const dtoInstance = new dtoClass();
    Object.assign(dtoInstance, requestBody);

    const errors: ValidationError[] = validateSync(dtoInstance, {
      skipMissingProperties: false,
    });

    if (errors.length > 0) {
      throw new BadRequestException(this.formatValidationErrors(errors));
    }
  }

  private formatValidationErrors(errors: ValidationError[]): string {
    return errors
      .map((error) =>
        Object.values(error.constraints)
          .map((message) => message)
          .join(', '),
      )
      .join(', ');
  }

  private catchBlock(error, mes) {
    if (error instanceof EntityNotFoundError) {
      // Handle not found exception as needed
      throw new NotFoundException(mes);
    } else if (error instanceof QueryFailedError) {
      // Handle query execution error
      throw new InternalServerErrorException('Error executing the query');
    }
    // Handle other errors or rethrow
    throw error;
  }
}

export enum requestType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  SELL = 'sell',
  BUY = 'buy',
}
