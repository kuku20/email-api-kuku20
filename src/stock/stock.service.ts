import { Injectable, NotFoundException } from '@nestjs/common';
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
  NewsStockDataOut,
  RealTimePriceFinnhubDto,
  SearchSymbolOutFMPDto,
  SearchSymbolOutFinnhubDto,
  SearchSymbolOutPolygonDto,
} from './dto';
import {FMPRType, FhRequestType, PolygonRType} from './dto/sourceData'
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

  async tickerList_POLYGON(query: string) {
    const BASE_URL = `https://api.polygon.io/v3/reference/tickers?search=${query}&active=true&apiKey=`;
    const response = await this.tryCatchF(BASE_URL, 'POLYGON_STOCK_API_KEY');
    return plainToClass(SearchSymbolOutPolygonDto, response?.results);
  }
  
  async tickerDividends_POLYGON(query: string) {
    const BASE_URL = `https://api.polygon.io/v3/reference/dividends?ticker=${query}&apiKey=`;
    const response = await this.tryCatchF(BASE_URL, 'POLYGON_STOCK_API_KEY');
    return plainToClass(DividendOutDto, response?.results);
  }

  async fromPolygon(type,stockTicker, start, end){
    if(type===PolygonRType.BYDAY){
      return this.search_POLYGON(stockTicker,start, end)
    }
    if(type===PolygonRType.TYPEAHEAD){
      return this.tickerList_POLYGON(stockTicker)
    }
    if(type===PolygonRType.DIVIDEND){
      return this.tickerDividends_POLYGON(stockTicker)
    }
    throw new NotFoundException("NOT FOUND");
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

  async bulkrequestsMulCom_FMP(query: string) {
    //AAPL,FB,GOOG
    const BASE_URL = `https://financialmodelingprep.com/api/v3/quote/${query}?apikey=`;
    const response = await this.tryCatchF(BASE_URL, 'FMP_STOCK_API_KEY');
    return plainToClass(BulkRequestsDto, response);
  }

  async gainersOrLosers_FMP(query: string) {
    //losers/gainers
    const BASE_URL = `https://financialmodelingprep.com/api/v3/stock_market/${query}?apikey=`;
    const response = await this.tryCatchF(BASE_URL, 'FMP_STOCK_API_KEY');
    return plainToClass(GainersOrLosersDto, response);
  }


  async tickerList_FMP(query: string) {
    const BASE_URL = `https://financialmodelingprep.com/api/v3/search?query=${query}&apikey=`;
    const response = await this.tryCatchF(BASE_URL, 'FMP_STOCK_API_KEY');
    // return  response.slice(0, 10);
    return plainToClass(SearchSymbolOutFMPDto, response?.slice(0, 10));
  }

  async fromFMP(type,stockTicker, stockMarket){
    if(type===FMPRType.RTP){
      return this.realTimePrice_FMP(stockTicker)
    }
    if(type===FMPRType.RTPA){
      return this.realTimePriceAll_FMP()
    }
    if(type===FMPRType.MCP){
      return this.bulkrequestsMulCom_FMP(stockTicker)
    }
    if(type===FMPRType.GAINORlOSE){
      return this.gainersOrLosers_FMP(stockMarket)
    }
    if(type===FMPRType.SEARCH){
      return this.tickerList_FMP(stockTicker)
    }
    throw new NotFoundException("NOT FOUND");
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

  async tickerNews_FINNHUB(query: string, start?: string, end?: string) {
    const today = new Date();
    today.setDate(today.getDate() - 5);
    const lastFiveDays = start || today.toISOString().replace(/T.*$/, '');
    const current = end || new Date().toISOString().replace(/T.*$/, '');
    const BASE_URL = `https://finnhub.io/api/v1/company-news?symbol=${query}&from=${lastFiveDays}&to=${current}&token=`;
    const response = await this.tryCatchF(BASE_URL, 'FINNHUB_STOCK_API_KEY');
    return plainToClass(NewsFinnhubOutDto, response);
  }

  async realTimePrice_FINNHUB(query: string) {
    const BASE_URL = `https://finnhub.io/api/v1/quote?symbol=${query}&token=`;
    const response = await this.tryCatchF(BASE_URL, 'FINNHUB_STOCK_API_KEY');
    return plainToClass(RealTimePriceFinnhubDto, response);
  }

  async companyProfile_FINNHUB(query: string) {
    const BASE_URL = `https://finnhub.io/api/v1/stock/profile2?symbol=${query}&token=`;
    const response = await this.tryCatchF(BASE_URL, 'FINNHUB_STOCK_API_KEY');
    return plainToClass(CompanyProfileDto, response);
  }
  
  async insiderTransactions_FINNHUB(query: string) {
    const BASE_URL = `https://finnhub.io/api/v1/stock/insider-transactions?symbol=${query}&token=`;
    const response = await this.tryCatchF(BASE_URL, 'FINNHUB_STOCK_API_KEY');
    return plainToClass(InsiderTransactionsDto, response?.data);
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

  async fromFinnhub(type,stockTicker, start, end){
    if(type===FhRequestType.EARNING){
      return this.earningsCal_FINNHUB(start, end)
    }
    if(type===FhRequestType.NEWS){
      return this.tickerNews_FINNHUB(stockTicker,start, end)
    }
    if(type===FhRequestType.RTP){
      return this.realTimePrice_FINNHUB(stockTicker)
    }
    if(type===FhRequestType.ComPro){
      return this.companyProfile_FINNHUB(stockTicker)
    }
    if(type===FhRequestType.INTRAN){
      return this.insiderTransactions_FINNHUB(stockTicker)
    }
    if(type===FhRequestType.TICKLIST){
      return this.tickerList_FINNHUB(stockTicker)
    }
    throw new NotFoundException("NOT FOUND");
  }

  //TSLA,AMZN,MSFT
  async tickerNews_STOCK_DATA(query: string,date:string) {
    const BASE_URL = `https://api.stockdata.org/v1/news/all?filter_entities=true&language=en&published_on=${date}&symbols=${query}&api_token=`;
    const response = await this.tryCatchF(BASE_URL, 'STOCK_DATA');
    return  plainToClass(NewsStockDataOut, response?.data);
  }

  //hourly
  async tickerNews_STOCK_DATA_ONEH(query: string, date:string, start:string, end:string) { // 23-11-18 / 00:00:00 / 01:00:00
    // `https://api.stockdata.org/v1/news/all?filter_entities=true&language=en&api_token=FpDPF5CdoDSP8E4VynMN6EipS6zm9eeSPiNCJKb8&published_before=2023-11-18T02:00:00&published_after=2023-11-18T01:00:00&symbols=${query}`
    const BASE_URL = `https://api.stockdata.org/v1/news/all?filter_entities=true&language=en&published_before=${date}T${end}&published_after=${date}T${start}&symbols=${query}&api_token=`;
    const response = await this.tryCatchF(BASE_URL, 'STOCK_DATA')
    if(response?.data)
      return response?.data;
    return []
  }

  //AAL NewsAlphaVantageOutDto
  async tickerNews_ALPHA_VANTAGE(query: string) {
    const BASE_URL = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${query}&apikey=`;
    const response = await this.tryCatchF(BASE_URL, 'ALPHA_VANTAGE');
    // return response;
    return plainToClass(NewsAlphaVantageOutDto, response?.feed);
  }

  //AAL new form FireBase //stockAVnews | stockSDnews
  async tickerNews_AV_FirebaseGet(ticker: string, date: string,db:string) {
    const BASE_URL = `${this.configService.get<any>('FIREBASE_DATA')}/${db}/${ticker}/${date}.json`;
    const response = await axios.get(BASE_URL);
    if (response?.data?.items==='0')
      return [];
    if(db==='stockAVnews'){
      return plainToClass(NewsAlphaVantageOutDto, response?.data?.feed);
    }
    else{
      return plainToClass(NewsStockDataOut, response?.data?.feed);
    }
  }

    //AAL new form FireBase //stockAVnews | stockSDnews
    async tickerNews_AV_FirebaseGetALL(ticker: string, db:string) {
      const BASE_URL = `${this.configService.get<any>('FIREBASE_DATA')}/${db}/${ticker}.json`;
      const response = await axios.get(BASE_URL);
      return response.data
    }

  //pat to database //stockAVnews | stockSDnews
  async tickerNews_AV_FirebasePut(ob: any, ticker: string, date: string,db:string) {
    const BASE_URL = `${this.configService.get<any>('FIREBASE_DATA')}/${db}/${ticker}/${date}.json`;
    const response = await axios.patch(BASE_URL, ob);
    return response.data;
  }
 
  //put list to database //watchlists | gainers | losers | earncal
  async lists_FirebasePut(tickerlistsRL: any, db:string, date?:string) {
    let BASE_URL = `${this.configService.get<any>('FIREBASE_DATA')}/realtime/${db}.json`;
    if(db ==='earncal')
      BASE_URL = `${this.configService.get<any>('FIREBASE_DATA')}/realtime/earncal/${date}.json`;
    const response = await axios.patch(BASE_URL, tickerlistsRL);
    return response.data;
  }

  //get list to database //watchlists | gainers | losers | earncal
  async lists_FirebaseGet(db:string, date?:string) {
    let BASE_URL = `${this.configService.get<any>('FIREBASE_DATA')}/realtime/${db}.json`;
    if(db ==='earncal')
      BASE_URL = `${this.configService.get<any>('FIREBASE_DATA')}/realtime/earncal/${date}.json`;
    const response = await axios.get(BASE_URL);
    if (response?.data ==='0')
      return [];
    return response?.data
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

    //should run 24 
  async tickerNews_STOCK_DATA24(query: string,date:string) {
    const data = []
    //00-09
    for (let i = 0; i < 9; i++) {
      const hour= await this.tickerNews_STOCK_DATA_ONEH(query,date,`0${i}:00:00`,`0${i+1}:00:00`)
      if(hour.length !==0)
      data.push(...hour)
    }
    //09-10
    const hour= await this.tickerNews_STOCK_DATA_ONEH(query,date,`09:00:00`,`10:00:00`)
    if(hour.length !==0)
      data.push(...hour)
    // //10-19
    for (let i = 0; i < 9; i++) {
      const hour= await this.tickerNews_STOCK_DATA_ONEH(query,date,`1${i}:00:00`,`1${i+1}:00:00`)
      // Your code here
      if(hour.length !==0)
      data.push(...hour)
    }
    // 19-24
    for (let i = 19; i < 24; i++) {
      const hour= await this.tickerNews_STOCK_DATA_ONEH(query,date,`${i}:00:00`,`${i+1}:00:00`)
      // Your code here
      if(hour.length !==0)
      data.push(...hour)
    }
    // return data
    return  plainToInstance(NewsStockDataOut, data);
  }

  async tickerNews_STOCK_DATA12(query: string,date:string) {
    const data = []
    //05-09
    for (let i = 5; i < 9; i++) {
      const hour= await this.tickerNews_STOCK_DATA_ONEH(query,date,`0${i}:00:00`,`0${i+1}:00:00`)
      if(hour.length !==0)
      data.push(...hour)
    }
    //09-10
    const hour= await this.tickerNews_STOCK_DATA_ONEH(query,date,`09:00:00`,`10:00:00`)
    if(hour.length !==0)
      data.push(...hour)
    // //10-19
    for (let i = 0; i < 9; i++) {
      const hour= await this.tickerNews_STOCK_DATA_ONEH(query,date,`1${i}:00:00`,`1${i+1}:00:00`)
      // Your code here
      if(hour.length !==0)
      data.push(...hour)
    }
    // return data
    return  plainToInstance(NewsStockDataOut, data);
  }
}
