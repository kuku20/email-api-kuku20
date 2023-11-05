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
        const data = await this.stockService.search(stockTicker, start, end);
        return data;
      } catch (error) {
        // Handle errors here
        throw error;
      }
    }

    @Get('/searchlist')
    async listTicker(@Query('stockTicker') stockTicker: string,) {
      try {
        const data = await this.stockService.tickerList(stockTicker);
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
        const data = await this.stockService.tickerNews(stockTicker, start, end);
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
        const data = await this.stockService.earningsCal(start, end);
        return data;
      } catch (error) {
        // Handle errors here
        throw error;
      }
    }

    @Get('/realtimeprice')
    async realtimeprice(@Query('stockTicker') stockTicker: string,) {
      try {
        const data = await this.stockService.realTimePrice(stockTicker);
        return data;
      } catch (error) {
        // Handle errors here
        throw error;
      }
    }

    @Get('/v2/realtimeprice')
    async realTimePriceFinnhub(@Query('stockTicker') stockTicker: string,) {
      try {
        const data = await this.stockService.realTimePriceFinnhub(stockTicker);
        return data;
      } catch (error) {
        // Handle errors here
        throw error;
      }
    }

    @Get('/realtimepriceall')
    async realtimepriceall() {
      try {
        const data = await this.stockService.realTimePriceAll();
        return data;
      } catch (error) {
        // Handle errors here
        throw error;
      }
    }
    
    @Get('/dividends')
    async tickerDividends(@Query('stockTicker') stockTicker: string,) {
      try {
        const data = await this.stockService.tickerDividends(stockTicker);
        return data;
      } catch (error) {
        // Handle errors here
        throw error;
      }
    }
}
