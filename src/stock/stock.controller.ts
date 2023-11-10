import { Controller, Get, Param, Query } from '@nestjs/common';
import { StockService } from './stock.service';

@Controller('stock')
export class StockController {
    constructor(private readonly stockService: StockService) {}
    @Get('/byday')
    async profolioData(@Param('preview') preview: string, @Query('stockTicker') stockTicker: string,
    @Query('start') start: string,
    @Query('end') end: string,) {
      try {
        const data = await this.stockService.search_POLYGON(stockTicker, start, end);
        return data;
      } catch (error) {
        // Handle errors here
        throw error;
      }
    }

    @Get('/typeahead')
    async listTicker(@Query('stockTicker') stockTicker: string,) {
      try {
        const data = await this.stockService.tickerList_FINNHUB(stockTicker);
        return data;
      } catch (error) {
        // Handle errors here
        throw error;
      }
    }

    @Get('/news')
    async tickerNews(@Query('stockTicker') stockTicker: string,
    @Query('start') start: string,
    @Query('end') end: string,) {
      try {
        const data = await this.stockService.tickerNews_FINNHUB(stockTicker, start, end);
        return data;
      } catch (error) {
        // Handle errors here
        throw error;
      }
    }

    @Get('/earnings')
    async earningsCal(
    @Query('start') start: string,
    @Query('end') end: string,) {
      try {
        const data = await this.stockService.earningsCal_FINNHUB(start, end);
        return data;
      } catch (error) {
        // Handle errors here
        throw error;
      }
    }

    @Get('/realtimeprice')
    async realtimeprice(@Query('stockTicker') stockTicker: string,) {
      try {
        const data = await this.stockService.realTimePrice_FMP(stockTicker);
        return data;
      } catch (error) {
        // Handle errors here
        throw error;
      }
    }

    @Get('/v2/realtimeprice')
    async realTimePriceFinnhub(@Query('stockTicker') stockTicker: string,) {
      try {
        const data = await this.stockService.realTimePrice_FINNHUB(stockTicker);
        return data;
      } catch (error) {
        // Handle errors here
        throw error;
      }
    }

    @Get('/insider-transactions')
    async insiderTransactions(@Query('stockTicker') stockTicker: string,) {
      try {
        const data = await this.stockService.insiderTransactions_FINNHUB(stockTicker);
        return data;
      } catch (error) {
        // Handle errors here
        throw error;
      }
    }

    @Get('/multiple-company-prices')
    async bulkrequestsMulCom(@Query('stockTicker') stockTicker: string,) {
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
    async tickerDividends(@Query('stockTicker') stockTicker: string,) {
      try {
        const data = await this.stockService.tickerDividends_POLYGON(stockTicker);
        return data;
      } catch (error) {
        // Handle errors here
        throw error;
      }
    }

    @Get('/gainers-or-losers')
    async gainersOrLosers(@Query('stockMarket') stockTicker: string,) {
      try {
        const data = await this.stockService.gainersOrLosers_FMP(stockTicker);
        return data;
      } catch (error) {
        // Handle errors here
        throw error;
      }
    }

    @Get('/company-profile')
    async companyProfile(@Query('stockTicker') stockTicker: string,) {
      try {
        const data = await this.stockService.companyProfile_FINNHUB(stockTicker);
        return data;
      } catch (error) {
        // Handle errors here
        throw error;
      }
    }
}
