import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { plainToClass, plainToInstance } from 'class-transformer';
import {
  BulkRequestsDto,
  DividendOutDto,
  GainersOrLosersDto,
  InsiderTransactionsDto,
  RealTimePriceFinnhubDto,
  SearchSymbolOutFinnhubDto,
  SearchSymbolOutPolygonDto,
} from './dto';

@Injectable()
export class StockService {
  private readonly graphqlEndpoint =
    'https://api.polygon.io/v2/aggs/ticker/AAPL/range/1/day/2023-10-02/2023-10-11?apiKey=GpBhGaI12ENRIUVkDMvDY5spqQR0ptOj';
  private BASE_URL: string = 'https://api.polygon.io/v2';
  constructor(private readonly configService: ConfigService) {}
  async search_POLYGON(query: string, start?: string, end?: string) {
    for (const key of this.configService
      .get<any>('POLYGON_STOCK_API_KEY')
      .split(',')) {
      const today = new Date();
      today.setDate(today.getDate() - 5);
      const lastFiveDays = start || today.toISOString().replace(/T.*$/, '');
      const current = end || new Date().toISOString().replace(/T.*$/, '');
      const url = `${this.BASE_URL}/aggs/ticker/${query}/range/1/day/${lastFiveDays}/${current}?apiKey=${key}`;
      try {
        const response = await axios.get(url);
        return response.data;
      } catch (error) {
        if (error.response && error.response.status === 500) {
          // Handle 500 error
          console.error(`Internal Server Error with key `, error.response.data);
        } else {
          // Handle other errors
          console.error(`Error with key `, error.message);
        }
      }
    }
    // If none of the API keys work, throw an error
    return null;
  }
  async realTimePrice_FMP(query: string) {
    const BASE_URL =
      'https://financialmodelingprep.com/api/v3/stock/real-time-price/';
    for (const key of this.configService
      .get<any>('FMP_STOCK_API_KEY')
      .split(',')) {
      const url = `${BASE_URL}${query}?apikey=${key}`;
      try {
        const response = await axios.get(url);
        return response.data;
      } catch (error) {
        if (error.response && error.response.status === 500) {
          // Handle 500 error
          console.error(`Internal Server Error with key `, error.response.data);
        } else {
          // Handle other errors
          console.error(`Error with key `, error.message);
        }
      }
    }
    // If none of the API keys work, throw an error
    return {
      companiesPriceList: [],
    };
  }

  async realTimePriceAll_FMP() {
    const BASE_URL =
      'https://financialmodelingprep.com/api/v3/stock/real-time-price?apikey=';
    for (const key of this.configService
      .get<any>('FMP_STOCK_API_KEY')
      .split(',')) {
      const url = `${BASE_URL}${key}`;
      try {
        const response = await axios.get(url);
        return response.data;
      } catch (error) {
        if (error.response && error.response.status === 500) {
          // Handle 500 error
          console.error(`Internal Server Error with key `, error.response.data);
        } else {
          // Handle other errors
          console.error(`Error with key `, error.message);
        }
      }
    }
    // If none of the API keys work, throw an error
    return {
      stockList: [],
    };
  }

  async tickerNews_FINNHUB(query: string, start?: string, end?: string) {
    const BASE_URL = 'https://finnhub.io/api/v1/company-news?symbol=';
    for (const key of this.configService
      .get<any>('FINNHUB_STOCK_API_KEY')
      .split(',')) {
      const today = new Date();
      today.setDate(today.getDate() - 5);
      const lastFiveDays = start || today.toISOString().replace(/T.*$/, '');
      const current = end || new Date().toISOString().replace(/T.*$/, '');
      const url = `${BASE_URL}${query}&from=${lastFiveDays}&to=${current}&token=${key}`;
      try {
        const response = await axios.get(url);
        return response.data;
      } catch (error) {
        if (error.response && error.response.status === 500) {
          // Handle 500 error
          console.error(`Internal Server Error with key `, error.response.data);
        } else {
          // Handle other errors
          console.error(`Error with key `, error.message);
        }
      }
    }
    // If none of the API keys work, throw an error
    return [];
  }

  async tickerDividends_POLYGON(query: string) {
    const BASE_URL = 'https://api.polygon.io/v3/reference/dividends?ticker=';
    for (const key of this.configService
      .get<any>('POLYGON_STOCK_API_KEY')
      .split(',')) {
      const url = `${BASE_URL}${query}&apiKey=${key}`;
      try {
        const response = await axios.get(url);
        return plainToClass(DividendOutDto, response.data.results);
        return response.data;
      } catch (error) {
        if (error.response && error.response.status === 500) {
          // Handle 500 error
          console.error(`Internal Server Error with key `, error.response.data);
        } else {
          // Handle other errors
          console.error(`Error with key `, error.message);
        }
      }
    }
    // If none of the API keys work, throw an error
    return [];
  }

  async earningsCal_FINNHUB(start?: string, end?: string) {
    const BASE_URL = 'https://finnhub.io/api/v1/calendar/earnings?';
    for (const key of this.configService
      .get<any>('FINNHUB_STOCK_API_KEY')
      .split(',')) {
      const today = new Date();
      const cstOffset = 5 * 60; // CST is UTC-6
      today.setMinutes(today.getMinutes() - cstOffset); //set to local Houston Time zone
      const current = end || today.toISOString().replace(/T.*$/, '');
      const url = `${BASE_URL}from=${current}&to=${current}&token=${key}`;
      try {
        const response = await axios.get(url);
        return response.data.earningsCalendar;
      } catch (error) {
        if (error.response && error.response.status === 500) {
          // Handle 500 error
          console.error(`Internal Server Error with key `, error.response.data);
        } else {
          // Handle other errors
          console.error(`Error with key `, error.message);
        }
      }
    }
    // If none of the API keys work, throw an error
    return [];
  }

  async realTimePrice_FINNHUB(query: string) {
    const BASE_URL = 'https://finnhub.io/api/v1/quote?symbol=';
    for (const key of this.configService
      .get<any>('FINNHUB_STOCK_API_KEY')
      .split(',')) {
      const url = `${BASE_URL}${query}&token=${key}`;
      try {
        const response = await axios.get(url);
        // return response.data;
        return plainToClass(RealTimePriceFinnhubDto, response.data);
      } catch (error) {
        if (error.response && error.response.status === 500) {
          // Handle 500 error
          console.error(`Internal Server Error with key `, error.response.data);
        } else {
          // Handle other errors
          console.error(`Error with key `, error.message);
        }
      }
    }

    // If none of the API keys work, throw an error
    return {
      price: null,
      change: null,
      pctChange: null,
      dayHigh: null,
      dayLow: null,
      open: null,
      previousClose: null,
      t: null,
    };
  }

  async insiderTransactions_FINNHUB(query: string) {
    const BASE_URL =
      'https://finnhub.io/api/v1/stock/insider-transactions?symbol=';
    for (const key of this.configService
      .get<any>('FINNHUB_STOCK_API_KEY')
      .split(',')) {
      const url = `${BASE_URL}${query}&token=${key}`;
      try {
        const response = await axios.get(url);
        // return response.data.data;
        return plainToClass(InsiderTransactionsDto, response.data.data);
      } catch (error) {
        if (error.response && error.response.status === 500) {
          // Handle 500 error
          console.error(`Internal Server Error with key `, error.response.data);
        } else {
          // Handle other errors
          console.error(`Error with key `, error.message);
        }
      }
    }
    // If none of the API keys work, throw an error
    return [];
  }

  async bulkrequestsMulCom_FMP(query: string) {
    //AAPL,FB,GOOG
    const BASE_URL = 'https://financialmodelingprep.com/api/v3/quote/';
    for (const key of this.configService
      .get<any>('FMP_STOCK_API_KEY')
      .split(',')) {
      const url = `${BASE_URL}${query}?apikey=${key}`;
      try {
        const response = await axios.get(url);
        // return response.data;
        return plainToClass(BulkRequestsDto, response.data);
      } catch (error) {
        if (error.response && error.response.status === 500) {
          // Handle 500 error
          console.error(`Internal Server Error with key `, error.response.data);
        } else {
          // Handle other errors
          console.error(`Error with key `, error.message);
        }
      }
    }
    // If none of the API keys work, throw an error
    return [];
  }

  async gainersOrLosers_FMP(query: string) {
    //losers/gainers
    const BASE_URL = 'https://financialmodelingprep.com/api/v3/stock_market/';
    for (const key of this.configService
      .get<any>('FMP_STOCK_API_KEY')
      .split(',')) {
      const url = `${BASE_URL}${query}?apikey=${key}`;
      try {
        const response = await axios.get(url);
        // return response.data;
        return plainToClass(GainersOrLosersDto, response.data);
      } catch (error) {
        if (error.response && error.response.status === 500) {
          // Handle 500 error
          console.error(`Internal Server Error with key `, error.response.data);
        } else {
          // Handle other errors
          console.error(`Error with key `, error.message);
        }
      }
    }
    // If none of the API keys work, throw an error
    return [];
  }
  // search function
  async tickerList_FINNHUB(query: string) {
    const BASE_URL = 'https://finnhub.io/api/v1/search?q=';
    for (const key of this.configService
      .get<any>('FINNHUB_STOCK_API_KEY')
      .split(',')) {
      const url = `${BASE_URL}${query}&token=${key}`;
      try {
        const response = await axios.get(url);
        // return response.data.result;
        return plainToClass(
          SearchSymbolOutFinnhubDto,
          response.data.result.slice(0, 10),
        );
      } catch (error) {
        if (error.response && error.response.status === 500) {
          // Handle 500 error
          console.error(`Internal Server Error with key `, error.response.data);
        } else {
          // Handle other errors
          console.error(`Error with key `, error.message);
        }
      }
    }
    // If none of the API keys work, throw an error
    return [];
  }
  async tickerList_FMP(query: string) {
    const BASE_URL = 'https://financialmodelingprep.com/api/v3/search?query=';
    for (const key of this.configService
      .get<any>('FMP_STOCK_API_KEY')
      .split(',')) {
      const url = `${BASE_URL}${query}&apikey=${key}`;
      try {
        const response = await axios.get(url);
        // return response.data.slice(0, 10);
        return plainToClass(
          SearchSymbolOutFinnhubDto,
          response.data.slice(0, 10),
        );
      } catch (error) {
        if (error.response && error.response.status === 500) {
          // Handle 500 error
          console.error(`Internal Server Error with key `, error.response.data);
        } else {
          // Handle other errors
          console.error(`Error with key `, error.message);
        }
      }
    }
    // If none of the API keys work, throw an error
    return [];
  }
  async tickerList_POLYGON(query: string) {
    const BASE_URL = 'https://api.polygon.io/v3/reference/tickers?';
    for (const key of this.configService
      .get<any>('POLYGON_STOCK_API_KEY')
      .split(',')) {
      const url = `${BASE_URL}search=${query}&active=true&apiKey=${key}`;
      try {
        const response = await axios.get(url);
        // return response.data.results;
        return plainToClass(SearchSymbolOutPolygonDto, response.data.results);
      } catch (error) {
        if (error.response && error.response.status === 500) {
          // Handle 500 error
          console.error(`Internal Server Error with key `, error.response.data);
        } else {
          // Handle other errors
          console.error(`Error with key`, error.message);
        }
      }
    }
    // If none of the API keys work, throw an error
    return [];
  }
}
