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

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}
  @Get('/byday')
  async profolioData(
    @Param('preview') preview: string,
    @Query('stockTicker') stockTicker: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    try {
      const data = await this.stockService.search_POLYGON(
        stockTicker,
        start,
        end,
      );
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

  @Get('/typeahead')
  async listTicker(@Query('stockTicker') stockTicker: string) {
    try {
      const data = await this.stockService.tickerList_POLYGON(stockTicker);
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

  @Get('/earnings')
  async earningsCal(@Query('start') start: string, @Query('end') end: string) {
    try {
      const data = await this.stockService.earningsCal_FINNHUB(start, end);
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

  @Get('/realtimeprice')
  async realtimeprice(@Query('stockTicker') stockTicker: string) {
    try {
      const data = await this.stockService.realTimePrice_FMP(stockTicker);
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

  @Get('/v2/realtimeprice')
  async realTimePriceFinnhub(@Query('stockTicker') stockTicker: string) {
    try {
      const data = await this.stockService.realTimePrice_FINNHUB(stockTicker);
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

  @Get('/insider-transactions')
  async insiderTransactions(@Query('stockTicker') stockTicker: string) {
    try {
      const data = await this.stockService.insiderTransactions_FINNHUB(
        stockTicker,
      );
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

  @Get('/multiple-company-prices')
  async bulkrequestsMulCom(@Query('stockTicker') stockTicker: string) {
    try {
      const data = await this.stockService.bulkrequestsMulCom_FMP(stockTicker);
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

  @Get('/realtimepriceall')
  async realtimepriceall() {
    try {
      const data = await this.stockService.realTimePriceAll_FMP();
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

  @Get('/dividends')
  async tickerDividends(@Query('stockTicker') stockTicker: string) {
    try {
      const data = await this.stockService.tickerDividends_POLYGON(stockTicker);
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

  @Get('/gainers-or-losers')
  async gainersOrLosers(@Query('stockMarket') stockTicker: string) {
    try {
      const data = await this.stockService.gainersOrLosers_FMP(stockTicker);
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

  @Get('/company-profile')
  async companyProfile(@Query('stockTicker') stockTicker: string) {
    try {
      const data = await this.stockService.companyProfile_FINNHUB(stockTicker);
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

  @Get('/news-v1') ///news-finn-hub
  async tickerNews(
    @Query('stockTicker') stockTicker: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    try {
      const data = await this.stockService.tickerNews_FINNHUB(
        stockTicker,
        start,
        end,
      );
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
        stockTicker
      );
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

  @Get('/news-fb/:db') //news-alpha-vantage
  async tickerNews_AV_FirebaseGet(
    @Query('stockTicker') ticker: string,
    @Query('date') date: string,
    @Param('db') db: string,
  ) {
    try {
      const data = await this.stockService.tickerNews_AV_FirebaseGet(
        ticker,
        date,db
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
        ticker,db
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
    return this.stockService.tickerNews_AV_FirebasePut(newsBody, ticker, date,db);
  }

  @Get('/news-v3') //news-alpha-vantage
  async tickers_News_STOCK_DATA(@Query('stockTicker') stockTicker: string,@Query('date') date: string, @Query('type') type: string) {//type: allday,24,12st,12nd
    try {
      if(type==='allday'){
        const data = await this.stockService.tickerNews_STOCK_DATA(
          stockTicker,
          date,
        );
        return { feed: data?.data, totalfound: data?.meta?.found };
      }else if(type == '12'){
        const data = await this.stockService.tickerNews_STOCK_DATA12(stockTicker,date);
        return {feed : data};
      }else if(type==='24'){
        const data = await this.stockService.tickerNews_STOCK_DATA24(stockTicker,date);
        return {feed : data};
      }else{
        return {notfound:"Please select: allday, 24, 12"}
      }
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }
}
