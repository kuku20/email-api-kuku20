import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService, ConfigModule } from '@nestjs/config';
@Injectable()
export class StockService {
    private readonly graphqlEndpoint = 'https://api.polygon.io/v2/aggs/ticker/AAPL/range/1/day/2023-10-02/2023-10-11?apiKey=GpBhGaI12ENRIUVkDMvDY5spqQR0ptOj';
    private BASE_URL: string = 'https://api.polygon.io/v2'; 
    constructor(private readonly configService: ConfigService) {}
    async search(query: string, start?:string, end?:string) {
        for (const key of this.configService.get<any>('POLYGON_STOCK_API_KEY').split(',')) {
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
        return {
            statusCode : 500,
            mess:"Check later"
        }
      }
  

    async tickerList(query: string) {
      const BASE_URL ='https://financialmodelingprep.com/api/v3/search?query='
      for (const key of this.configService.get<any>('FMP_STOCK_API_KEY').split(',')) {
        const url = `${BASE_URL}${query}&apikey=${key}`;
        try {
          const response = await axios.get(url);
          return response.data.slice(0, 10);
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
          statusCode : 500,
          mess:"Check later"
      }
    }

    async realTimePrice(query: string) {
      const BASE_URL ='https://financialmodelingprep.com/api/v3/stock/real-time-price/'
      for (const key of this.configService.get<any>('FMP_STOCK_API_KEY').split(',')) {
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
          statusCode : 500,
          mess:"Check later"
      }
    }

    async realTimePriceAll() {
      const BASE_URL ='https://financialmodelingprep.com/api/v3/stock/real-time-price?apikey='
      for (const key of this.configService.get<any>('FMP_STOCK_API_KEY').split(',')) {
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
          statusCode : 500,
          mess:"Check later"
      }
    }

    async tickerNews(query: string, start?:string, end?:string) {
      const BASE_URL ='https://finnhub.io/api/v1/company-news?symbol='
      for (const key of this.configService.get<any>('FINNHUB_STOCK_API_KEY').split(',')) {
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
      return {
          statusCode : 500,
          mess:"Check later"
      }
    }

    async tickerDividends(query: string) {
      const BASE_URL ='https://api.polygon.io/v3/reference/dividends?ticker='
      for (const key of this.configService.get<any>('POLYGON_STOCK_API_KEY').split(',')) {
        const url = `${BASE_URL}${query}&apiKey=${key}`;
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
          statusCode : 500,
          mess:"Check later"
      }
    }
}
