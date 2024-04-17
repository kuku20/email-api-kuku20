import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { JwtGuard } from 'src/auth/guard';
import { AdminUserAuthGuard } from 'src/stock-user/guard';
import * as RequestDTO from './dto/sourceData';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('/news-fb/:db') //news-alpha-vantage
  async tickerNews_AV_FirebaseGet(
    @Query('stockTicker') ticker: string,
    @Query('date') date: string,
    @Param('db') db: string,
  ) {
    try {
      const data = await this.stockService.tickerNews_AV_FirebaseGet(
        ticker,
        date,
        db,
      );
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

  @Get('/news-fball/:db') //news-alpha-vantage
  async tickerNews_AV_FirebaseGetAll(
    @Query('stockTicker') ticker: string,
    @Param('db') db: string,
  ) {
    try {
      const data = await this.stockService.tickerNews_AV_FirebaseGetALL(
        ticker,
        db,
      );
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

  @UseGuards(JwtGuard)
  @UseGuards(AdminUserAuthGuard)
  @Patch('/news-fb/:db')
  updateNewsAV2FB(
    @Param('db') db: string,
    @Query('stockTicker') ticker: string,
    @Query('date') date: string,
    @Body() newsBody: any,
  ) {
    return this.stockService.tickerNews_AV_FirebasePut(
      newsBody,
      ticker,
      date,
      db,
    );
  }

  @Get('/news-v1')
  async newsFinnhub(
  @Query('stockTicker') stockTicker: string,
  @Query('start') start: string,
  @Query('end') end: string,
  ) {
    try {
      const data = await this.stockService.tickerNews_FINNHUB(stockTicker,start, end);
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

  @UseGuards(JwtGuard) //proteched as well since this is 25/day
  @UseGuards(AdminUserAuthGuard)
  @Get('/news-v2') //news-alpha-vantage
  async tickers_News_ALPHA_VANTAGE(@Query('stockTicker') stockTicker: string) {
    try {
      const data = await this.stockService.tickerNews_ALPHA_VANTAGE(
        stockTicker,
      );
      return { feed: data };
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

  @Get('/news-v3') //news-alpha-vantage
  async tickers_News_STOCK_DATA(
    @Query('stockTicker') stockTicker: string,
    @Query('date') date: string,
    @Query('type') type: string,
  ) {
    //type: allday,24,12st,12nd
    try {
      if (type === 'allday') {
        const data = await this.stockService.tickerNews_STOCK_DATA(
          stockTicker,
          date,
        );
        return { feed: data };
      } else if (type == '12') {
        const data = await this.stockService.tickerNews_STOCK_DATA12(
          stockTicker,
          date,
        );
        return { feed: data };
      } else if (type === '24') {
        const data = await this.stockService.tickerNews_STOCK_DATA24(
          stockTicker,
          date,
        );
        return { feed: data };
      } else {
        return { notfound: 'Please select: allday, 24, 12' };
      }
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

  @Get('/realtimefb-multiple/:db') //watchlists | gainers | losers
  async lists_FirebaseGet(
    @Param('db') db: string,
    @Query('date') date: string,
  ) {
    try {
      const data = await this.stockService.lists_FirebaseGet(db, date);
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

  @UseGuards(JwtGuard)
  @UseGuards(AdminUserAuthGuard)
  @Patch('/realtimefb-multiple/:db')
  lists_FirebasePut(
    @Param('db') db: string,
    @Body() newsBody: any,
    @Query('date') date: string,
  ) {
    return this.stockService.lists_FirebasePut(newsBody, db, date);
  }

  /// FINNHUB
  //earnings, news, realtimeprice, insider-transactions
  @Get('/fh/:type')
  async fromFinnhub(
  @Param() params: RequestDTO.FinnhubDto,
  @Query('stockTicker') stockTicker: string,
  @Query('start') start: string,
  @Query('end') end: string,
  ) {
    try {
      const data = await this.stockService.fromFinnhub(params.type,stockTicker, start, end);
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

    /// POLYGON
  //byday, typeahead, dividends
  @Get('/po/:type')
  async fromPolygon(
  @Param() params: RequestDTO.PolygonDto,
  @Query('stockTicker') stockTicker: string,
  @Query('start') start: string,
  @Query('end') end: string,
  ) {
    try {
      const data = await this.stockService.fromPolygon(params.type,stockTicker, start, end);
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

  /// FMP
  //realtimeprice, multiple-company-prices, realtimepriceall ,gainers-or-losers
  @Get('/fm/:type')
  async fromFMP(
  @Param() params: RequestDTO.FmpDto,
  @Query('stockTicker') stockTicker: string,
  @Query('stockMarket') stockMarket: string,
  @Query('start') start: string,
  @Query('end') end: string,
  ) {
    try {
      const data = await this.stockService.fromFMP(params.type,stockTicker, stockMarket);
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

  @Get('/chartdata/:timespan')
  async getTickerFullChart_POLYGON(
  @Param() params: RequestDTO.TimeSpanDto,
  @Query() query:  RequestDTO.TimeRangeDto,
  ) {
    try {
      let data
      if(params.timespan === RequestDTO.TIMESPAN.FMP_HC){
        data = await this.stockService.getTickerFullChart_FMP(query.stockTicker, query.range, params.timespan,query.start, query.end, query.limit );
      }else{
        data = await this.stockService.getTickerFullChart_POLYGON(query.stockTicker, query.range, params.timespan,query.start, query.end, query.limit );
      }
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

  @Get('/daily-chart')
  async getTickerDailyChart_FMP(
  @Query('stockTicker') stockTicker: string,
  @Query('start') start: string,
  @Query('end') end: string,
  ) {
    try {
      const data = await this.stockService.getTickerDailyChart_FMP(stockTicker, start, end);
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }
}
