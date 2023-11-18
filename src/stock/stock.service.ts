import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { plainToClass, plainToInstance } from 'class-transformer';
import {
  BulkRequestsDto,
  CompanyProfileDto,
  DividendOutDto,
  EarningCalFinnhubOut,
  GainersOrLosersDto,
  InsiderTransactionsDto,
  NewsAlphaVantageOutDto,
  NewsFinnhubOutDto,
  RealTimePriceFinnhubDto,
  SearchSymbolOutFMPDto,
  SearchSymbolOutFinnhubDto,
  SearchSymbolOutPolygonDto,
} from './dto';

@Injectable()
export class StockService {
  constructor(private readonly configService: ConfigService) {}

  async search_POLYGON(query: string, start?: string, end?: string) {
    const graphqlEndpoint = `https://api.polygon.io/v2/aggs/ticker/AAPL/range/1/day/2023-10-02/2023-10-11?apiKey=GpBhGaI12ENRIUVkDMvDY5spqQR0ptOj`;
    const today = new Date();
    today.setDate(today.getDate() - 5);
    const lastFiveDays = start || today.toISOString().replace(/T.*$/, '');
    const current = end || new Date().toISOString().replace(/T.*$/, '');
    const BASE_URL = `https://api.polygon.io/v2/aggs/ticker/${query}/range/1/day/${lastFiveDays}/${current}?apiKey=`;
    const response = await this.tryCatchF(BASE_URL, 'POLYGON_STOCK_API_KEY');
    return response;
  }

  async realTimePrice_FMP(query: string) {
    const BASE_URL = `https://financialmodelingprep.com/api/v3/stock/real-time-price/${query}?apikey=`;
    const response = await this.tryCatchF(BASE_URL, 'FMP_STOCK_API_KEY');
    return response;
  }

  async realTimePriceAll_FMP() {
    const BASE_URL = `https://financialmodelingprep.com/api/v3/stock/real-time-price?apikey=`;
    const response = await this.tryCatchF(BASE_URL, 'FMP_STOCK_API_KEY');
    return response;
  }

  async tickerNews_FINNHUB(query: string, start?: string, end?: string) {
    const today = new Date();
    today.setDate(today.getDate() - 5);
    const lastFiveDays = start || today.toISOString().replace(/T.*$/, '');
    const current = end || new Date().toISOString().replace(/T.*$/, '');
    const BASE_URL = `https://finnhub.io/api/v1/company-news?symbol=${query}&from=${lastFiveDays}&to=${current}&token=`;
    const response = await this.tryCatchF(BASE_URL, 'FINNHUB_STOCK_API_KEY');
    return plainToClass(NewsFinnhubOutDto, response);
  }

  async tickerDividends_POLYGON(query: string) {
    const BASE_URL = `https://api.polygon.io/v3/reference/dividends?ticker=${query}&apiKey=`;
    const response = await this.tryCatchF(BASE_URL, 'POLYGON_STOCK_API_KEY');
    return plainToClass(DividendOutDto, response?.results);
  }

  async earningsCal_FINNHUB(start?: string, end?: string) {
    const today = new Date();
    const cstOffset = 5 * 60; // CST is UTC-6
    today.setMinutes(today.getMinutes() - cstOffset); //set to local Houston Time zone
    const current = end || today.toISOString().replace(/T.*$/, '');
    const BASE_URL = `https://finnhub.io/api/v1/calendar/earnings?from=${current}&to=${current}&token=`;
    const response = await this.tryCatchF(BASE_URL, 'FINNHUB_STOCK_API_KEY');
    return plainToClass(EarningCalFinnhubOut, response?.earningsCalendar);
  }

  async realTimePrice_FINNHUB(query: string) {
    const BASE_URL = `https://finnhub.io/api/v1/quote?symbol=${query}&token=`;
    const response = await this.tryCatchF(BASE_URL, 'FINNHUB_STOCK_API_KEY');
    return plainToClass(RealTimePriceFinnhubDto, response);
  }

  async insiderTransactions_FINNHUB(query: string) {
    const BASE_URL = `https://finnhub.io/api/v1/stock/insider-transactions?symbol=${query}&token=`;
    const response = await this.tryCatchF(BASE_URL, 'FINNHUB_STOCK_API_KEY');
    return plainToClass(InsiderTransactionsDto, response?.data);
  }

  async bulkrequestsMulCom_FMP(query: string) {
    //AAPL,FB,GOOG
    const BASE_URL = `https://financialmodelingprep.com/api/v3/quote/}${query}?apikey=`;
    const response = await this.tryCatchF(BASE_URL, 'FMP_STOCK_API_KEY');
    return plainToClass(BulkRequestsDto, response);
  }

  async gainersOrLosers_FMP(query: string) {
    //losers/gainers
    const BASE_URL = `https://financialmodelingprep.com/api/v3/stock_market/${query}?apikey=`;
    const response = await this.tryCatchF(BASE_URL, 'FMP_STOCK_API_KEY');
    return plainToClass(GainersOrLosersDto, response);
  }

  // search function
  async tickerList_FINNHUB(query: string) {
    const BASE_URL = `https://finnhub.io/api/v1/search?q=${query}&token=`;
    const response = await this.tryCatchF(BASE_URL, 'FINNHUB_STOCK_API_KEY');
    return plainToClass(
      SearchSymbolOutFinnhubDto,
      response?.result?.slice(0, 10),
    );
  }
  async tickerList_FMP(query: string) {
    const BASE_URL = `https://financialmodelingprep.com/api/v3/search?query=${query}&apikey=`;
    const response = await this.tryCatchF(BASE_URL, 'FMP_STOCK_API_KEY');
    // return  response.slice(0, 10);
    return plainToClass(SearchSymbolOutFMPDto, response?.slice(0, 10));
  }

  async tickerList_POLYGON(query: string) {
    const BASE_URL = `https://api.polygon.io/v3/reference/tickers?search=${query}&active=true&apiKey=`;
    const response = await this.tryCatchF(BASE_URL, 'POLYGON_STOCK_API_KEY');
    return plainToClass(SearchSymbolOutPolygonDto, response?.results);
  }

  async companyProfile_FINNHUB(query: string) {
    const BASE_URL = `https://finnhub.io/api/v1/stock/profile2?symbol=${query}&token=`;
    const response = await this.tryCatchF(BASE_URL, 'FINNHUB_STOCK_API_KEY');
    return plainToClass(CompanyProfileDto, response);
  }

  //TSLA,AMZN,MSFT
  async tickerNews_STOCK_DATA(query: string) {
    const BASE_URL = `https://api.stockdata.org/v1/news/all?filter_entities=true&language=en&symbols=${query}&api_token=`;
    return await this.tryCatchF(BASE_URL, 'STOCK_DATA');
  }

  //AAL NewsAlphaVantageOutDto
  async tickerNews_ALPHA_VANTAGE(query: string) {
    const BASE_URL = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${query}&apikey=`;
    const response = await this.tryCatchF(BASE_URL, 'ALPHA_VANTAGE');
    // return  response.feed;
    return plainToClass(NewsAlphaVantageOutDto, response?.feed);
  }

  async tryCatchF(BASE_URL: string, keyDATA: string) {
    const keys = this.configService.get<any>(keyDATA).split(',');
    this.shuffleArray(keys);
    for (const key of keys) {
      const url = `${BASE_URL}${key}`;
      try {
        const response = await axios.get(url);
        return response.data;
      } catch (error) {
        if (error?.response && error?.response?.status === 500) {
          // Handle 500 error
          console.error(
            `Internal Server Error with key `,
            error?.response?.data,
          );
        } else {
          // Handle other errors
          console.error(`Error with key ${keyDATA}`, error?.message);
        }
      }
    }
    // If none of the API keys work, throw an error
    return null;
  }

  public shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
