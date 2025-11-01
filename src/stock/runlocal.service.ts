import {
  Injectable,
} from '@nestjs/common';
import axios from 'axios';

import { ConfigService,  } from '@nestjs/config';
import { plainToClass, } from 'class-transformer';
import * as DTO from './dto';
import { StockHelperService } from './stockHelper.service';
import { AlphavantageService } from 'src/alphavantage/alphavantage.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataHistory } from './entities';
@Injectable()
export class LocalPLWR {
  constructor(
    private readonly configService: ConfigService,
    private readonly stockHelperService: StockHelperService,
    private readonly alphavantageService: AlphavantageService,
    @InjectRepository(DataHistory)
      private dataHistoryRipo: Repository<DataHistory>) {}
  /**
   *
   * @param ticker : AAL , SMCI
   * @param timefame  1day, 4hour, 1hour, 15min, 5min
   * @returns
   */
  
  async getTickerFullChart_POLYGON(ticker: string, timefame: string) {
    let range, timespan;
    const daytestBF = 0
    const dayend = this.stockHelperService.getDateNDaysAgo(-1 + daytestBF);
    let dayStart;

    if (timefame.includes('day')) {
      timespan = 'day';
      range = timefame.match(/\d+/)[0];
      dayStart = this.stockHelperService.getDateNDaysAgo(700 + daytestBF);
    } else if (timefame.includes('hour')) {
      timespan = 'hour';
      dayStart = this.stockHelperService.getDateNDaysAgo(100 + daytestBF);
      range = timefame.match(/\d+/)[0];
    } else if (timefame.includes('min')) {
      timespan = 'minute';
      dayStart = this.stockHelperService.getDateNDaysAgo(35 + daytestBF);
      range = timefame.match(/\d+/)[0];
    }
    // return {
    //   dayStart,range,timespan, dayend
    // }
    const urls = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/${range}/${timespan}/${dayStart}/${dayend}?adjusted=true&sort=desc&limit=50000&apiKey=`;
    if (timefame.includes('weekly')|| timefame.includes('monthly')) {
      return this.alphavantageService.weekORmonthly(ticker, timefame);
    }
    const responsesArray = await this.tryCatchF(urls, 'POLYGON_STOCK_API_KEY');
    // return responsesArray.results
    const response = plainToClass(DTO.ChartOutPolygonDto, responsesArray.results);
    return response;
    // const result = await this.stockHelperService.returnNewData(response);

    // return result;
  }

  /**
   *
   * @param ticker : AAL , SMCI
   * @param timefame  1day, 4hour, 1hour, 15min, 5min
   * @returns
   */
  async getTickerFullChart_FMP(ticker: string, timefame: string) {
    const daytestBF = 0
    const dayend = this.stockHelperService.getDateNDaysAgo(-1  + daytestBF);
    let dayStart;
    if (timefame.includes('4hour')) {
      dayStart = this.stockHelperService.getDateNDaysAgo(120  + daytestBF);
    } else if (timefame.includes('1hour')) {
      dayStart = this.stockHelperService.getDateNDaysAgo(55  + daytestBF);
    } else if (timefame.includes('15min')) {
      dayStart = this.stockHelperService.getDateNDaysAgo(20  + daytestBF);
    }else if (timefame.includes('5min')) {
      dayStart = this.stockHelperService.getDateNDaysAgo(7 + daytestBF);
    }else if (timefame.includes('1min')) {
      dayStart = this.stockHelperService.getDateNDaysAgo(7 + daytestBF);
    }

    let BASE_URL = `https://financialmodelingprep.com/api/v3/historical-chart/${timefame}/${ticker}?from=${dayStart}&to=${dayend}&apikey=`;
    if (timefame.includes('day')) {
      dayStart = this.stockHelperService.getDateNDaysAgo(365  + daytestBF);
      return this.getTickerDailyChart_FMP(ticker, dayStart, dayend);
    }
    if (timefame.includes('weekly')|| timefame.includes('monthly')) {
      return this.alphavantageService.weekORmonthly(ticker, timefame);
    }
    const today = new Date().toISOString().replace(/T.*$/, '');
    const checkToday = await this.stockHelperService.calculateDaysBetween(
      today,
      dayend,
    );
    const rtp = await this.RTP_FINNHUB_FOR_CHART(ticker);
    const response = await this.tryCatchF(BASE_URL, 'FMP_STOCK_API_KEY');
    if (checkToday == 0 && !ticker.includes('USD')) {
      response.unshift(rtp);
    }
    return response;
    const result = await this.stockHelperService.returnNewData(response);
    return result;
  }

  async getTickerDailyChart_FMP(
    ticker: string,
    dateStart: string,
    dateEnd: string,
  ) {
    const BASE_URL = `https://financialmodelingprep.com/api/v3/historical-price-full/${ticker}?from=${dateStart}&to=${dateEnd}&apikey=`;
    const response = await this.tryCatchF(BASE_URL, 'FMP_STOCK_API_KEY');
    const data = plainToClass(DTO.ChartOutFMPDto, response?.historical);
    return data;
    const result = this.stockHelperService.returnNewData(data);
    return result;
  }

  async RTP_FINNHUB_FOR_CHART(query: string) {
    const BASE_URL = `https://finnhub.io/api/v1/quote?symbol=${query}&token=`;
    const response = await this.tryCatchF(BASE_URL, 'FINNHUB_STOCK_API_KEY');
    return plainToClass(DTO.RealTimePriceFhForChartDto, response);
  }
  async tryCatchF(BASE_URL: string, keyDATA: string) {
    const keys = this.configService.get<any>(keyDATA).split(',');
    this.shuffleArray(keys);
    for (const key of keys) {
      const url = `${BASE_URL}${key}`;
      console.log(url);
      try {
        const response = await axios.get(url);
        return response.data;
      } catch (error) {
        if (error?.response && error?.response?.status === 500) {
          // Handle 500 error
          console.error(`Internal Server Error with key `, error?.response);
        } else {
          // Handle other errors
          console.error(`Error with key ${keyDATA}`, error?.response?.status);
        }
      }
    }
    // If none of the API keys work, throw an error
    return null;
  }


  async storeDataHis(symbol:string,source:string, date:string, data:any){
    try {
      // Create the dataHistoryRipo entity
      const stockPortfolio = this.dataHistoryRipo.create({
        symbol,source, date, data
      });
      // Save the stockPortfolio entity to the database
      await this.dataHistoryRipo.save(stockPortfolio);
    } catch (error) {}
  }
  async getAllData(): Promise<DataHistory[]> {
    return await this.dataHistoryRipo.find();
  }

  async getAllDataBySymbol(symbol): Promise<DataHistory> {
    const symbolData = await this.dataHistoryRipo.findOneOrFail({
      where: { symbol: symbol },
    });
    return symbolData;
  }

  public shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  async getfullTopost(ticker: string, dateStart: string, dateEnd: string) {
    const timespan = '1min';
    const dateRanges = await this.stockHelperService.getDateRanges(
      dateStart,
      dateEnd,
      2,
    );
    const urls = dateRanges.map(({ start, end }) => {
      return `https://financialmodelingprep.com/api/v3/historical-chart/${timespan}/${ticker}?from=${start}&to=${end}&apikey=`;
    });
    console.log(urls);
    const responsesArray = await Promise.allSettled(
      urls.map(async (url) => {
        // console.log(url)
        return await this.tryCatchF(url, 'FMP_STOCK_API_KEY');
      }),
    );
    // Combine results into a single array
    const allResults = responsesArray
      .filter((result) => result?.status === 'fulfilled') // Filter only fulfilled results
      .map((result: any) => result?.value) // Extract the results array
      .flat(); // Flatten the array of arrays into a single array

    // // const result = await this.stockHelperService.returnNewData(allResults)
    // this.postToFirebase(ticker,allResults,timespan, dateStart+'-to-'+dateEnd,).then(data=>{
    //   // console.log(data)
    // })
    // const data = await this.getFromFB(ticker,timespan,dateStart+'-to-'+dateEnd,)
    return allResults;
    const allResults2 = await this.stockHelperService.returnNewData(allResults);

    // const newdata = await this.stockHelperService.transformData(allResults2)
    // const allResults = await this.stockHelperService.returnNewData(data.data)
    // console.log(data.data)
    // await this.postToFirebase(ticker,newdata,timespan+'-modifire', dateStart+'-to-'+dateEnd,).then(data=>{
    //   // console.log(data)
    // })
    return allResults2;
  }
}
