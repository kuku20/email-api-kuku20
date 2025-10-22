import { Injectable } from '@nestjs/common';

import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { plainToClass } from 'class-transformer';
import * as DTO from './dto';
import { error } from 'console';
@Injectable()
export class AlphavantageService {
    constructor(
      private readonly configService: ConfigService,
    ) {}
    async fasfda(ticker: string, timefame: string) {
      let range, timespan;
      const daytestBF = 0

      try {
        const urls = `https://api.polygon.io/v1/indicators/rsi/AAPL?timespan=week&adjusted=true&window=14&series_type=close&order=desc&limit=10&apiKey=wZCIxwtp0iTqGO7sFUJi4q7SzShWqLaS`;
        const response = await axios.get(urls);
        // const responsesArray = await this.tryCatchF(urls, 'POLYGON_STOCK_API_KEY');
        // // return responsesArray.results?.values
        const responsed = plainToClass(DTO.ChartOutPolygonDto, response.data.results?.values);
        return responsed;
        // const result = await this.stockHelperService.returnNewData(response);
    
        // return result;
      } catch (error) {
        console.error('AlphaVantage API Error:', error.message);
        throw new Error('Failed to fetch SMA data');
      }
    }

    async weekORmonthly(symbol: string, seriesType = 'weekly') {
      const timeseries = seriesType==='weekly' ?"TIME_SERIES_WEEKLY_ADJUSTED":"TIME_SERIES_MONTHLY_ADJUSTED"
      const url = `https://www.alphavantage.co/query?function=${timeseries}&symbol=${symbol}&apikey=`;
  
      const weekly = `Weekly Adjusted Time Series`
      const monthly = "Monthly Adjusted Time Series"
      const returndataseries = seriesType==='weekly' ?weekly: monthly
      try {
        const response =  await this.tryCatchF(url, 'alphavantage', returndataseries);
  
       return response
      } catch (error) {
        console.error('AlphaVantage API Error:', error.message);
        throw new Error('Failed to fetch SMA data');
      }
    }
  
  
    async tryCatchF(BASE_URL: string, keyDATA: string, returndataseries:string) {
      const keys = this.configService.get<any>(keyDATA).split(',');
      this.shuffleArray(keys);
      for (const key of keys) {
        const url = `${BASE_URL}${key}`;
        console.log(url);
        try {
          const response = await axios.get(url);
          // console.log(response)
          const orignaldata = response.data[returndataseries] as Object
          if(orignaldata){
            const result = Object.entries(orignaldata).map(([date, values]) => ({
              ...values,
              date
            }))
            const responseModifile = plainToClass(DTO.alphaAdjusteddto, result);
            return responseModifile;
          }else{
            throw error
          }
        } catch (error) {
          if (error?.response && error?.response?.status === 500) {
            // Handle 500 error
            console.error(`Internal Server Error with key `, error?.response);
          } else {
            // Handle other errors
            console.error(`${keyDATA} Error with key ${key}`, error?.response?.status);
            // update Proxy
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
