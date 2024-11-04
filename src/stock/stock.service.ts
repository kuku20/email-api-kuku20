import { Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { plainToClass, plainToInstance } from 'class-transformer';
import * as DTO from './dto';
import { FMPRType, FhRequestType, PolygonRType } from './dto/sourceData';
import { StockHelperService } from './stockHelper.service';
@Injectable()
export class StockService {
  constructor(private readonly configService: ConfigService, private readonly stockHelperService: StockHelperService) {}

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
    return plainToClass(DTO.SearchSymbolOutPolygonDto, response?.results);
  }

  async tickerDividends_POLYGON(query: string) {
    const BASE_URL = `https://api.polygon.io/v3/reference/dividends?ticker=${query}&apiKey=`;
    const response = await this.tryCatchF(BASE_URL, 'POLYGON_STOCK_API_KEY');
    return plainToClass(DTO.DividendOutDto, response?.results);
  }
  async getTickerFullChart_POLYGON(
    ticker: string,
    dateStart: string,
    dateEnd: string,
  ) {
    let range, timespan
    const today = new Date()
    const formattedDate = today.toISOString().split('T')[0];
    const last2Year = await this.stockHelperService.calculateDaysBetween(dateStart, formattedDate)
    if(last2Year>=731)
      return [{
        "error":"Over 2 years"
      }]
    const daylength = await this.stockHelperService.calculateDaysBetween(dateStart, dateEnd)

    if(daylength<3){
      range = '1'
      timespan = 'minute'
    }else if(daylength>=3 && daylength < 14){
      range = '5'
      timespan = 'minute'
    }else if(daylength>=14 && daylength < 35){
      range = '30'
      timespan = 'minute'
    }else if(daylength>=35 && daylength < 95){
      range = '1'
      timespan = 'hour'
    }else if(daylength>=95 && daylength < 180){
      range = '3'
      timespan = 'hour'
    }else if(daylength>=180 && daylength < 365){
      range = '4'
      timespan = 'hour'
    }else{
      range = '1'
      timespan = 'day'
    }
    const dateRanges = await this.stockHelperService.getDateRanges(dateStart, dateEnd, 85);
    const urls = dateRanges.map(({ start, end }) => {
      return `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/${range}/${timespan}/${start}/${end}?adjusted=true&sort=desc&limit=50000&apiKey=`;
    });
    // console.log(urls)
    const responsesArray = await Promise.allSettled(
      urls.map(async url => {
        // console.log(url)
        return await this.tryCatchF(url, 'POLYGON_STOCK_API_KEY');
      })
    );
    // Combine results into a single array
    const allResults = responsesArray
    .filter(result => result?.status === 'fulfilled') // Filter only fulfilled results
    .map((result:any) => result?.value?.results) // Extract the results array
    .flat(); // Flatten the array of arrays into a single array
   
    // const BASE_URL = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/${range}/${timespan}/${dateStart}/${dateEnd}?adjusted=true&sort=desc&limit=${limit}&apiKey=`;
    // const response = await this.tryCatchF(BASE_URL, 'POLYGON_STOCK_API_KEY');
    const response = plainToClass(
      DTO.ChartOutPolygonDto,
      allResults,
    );
    // console.log(BASE_URL, allResults.length)
    const result = await this.stockHelperService.returnNewData(response)

    return result;
  }

  async open_close_POLYGON(ticker: string, date: string = '2023-01-09') {
    const BASE_URL = `https://api.polygon.io/v1/open-close/${ticker}/${date}?adjusted=true&apiKey=`;
    const response = await this.tryCatchF(BASE_URL, 'POLYGON_STOCK_API_KEY');
    // console.log(BASE_URL)
    return response;
    return plainToClass(DTO.ChartOutPolygonDto, response?.results);
  }

  async Aggregate_POLYGON(
    ticker: string,
    startDate: string = '2022-01-01',
    endDate: string = '2023-01-10',
  ) {
    const BASE_URL = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${startDate}/${endDate}?adjusted=true&sort=asc&apiKey=`;
    const response = await this.tryCatchF(BASE_URL, 'POLYGON_STOCK_API_KEY');
    const addPercent = response.results.map(
      (each: { c: number; o: number }) => {
        return {
          ...each,
          change: +(each.c - each.o).toFixed(2),
          p_o_c: ((each.c - each.o) * 100) / each.o,
        };
      },
    );
    const shapeData = plainToClass(DTO.DatePolygonDto, addPercent);
    const returndata = { length: addPercent?.length, ticker, data: shapeData };
    return returndata;
    return plainToClass(DTO.DatePolygonDto, addPercent);
  }

  async fromPolygon(
    type: PolygonRType,
    stockTicker: string,
    start: string,
    end: string,
  ) {
    if (type === PolygonRType.BYDAY && stockTicker && start) {
      return this.search_POLYGON(stockTicker, start, end);
    }
    if (type === PolygonRType.TYPEAHEAD && stockTicker) {
      return this.tickerList_POLYGON(stockTicker);
    }
    if (type === PolygonRType.DIVIDEND && stockTicker) {
      return this.tickerDividends_POLYGON(stockTicker);
    }
    if (type === PolygonRType.OPENCLOSE && stockTicker) {
      return this.open_close_POLYGON(stockTicker, start);
    }
    if (type === PolygonRType.RANGEDAY && stockTicker) {
      return this.Aggregate_POLYGON(stockTicker, start, end);
    }
    throw new NotFoundException('NOT FOUND');
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
    return plainToClass(DTO.BulkRequestsDto, response);
  }

  async gainersOrLosers_FMP(query: string) {
    //losers/gainers
    const BASE_URL = `https://financialmodelingprep.com/api/v3/stock_market/${query}?apikey=`;
    const response = await this.tryCatchF(BASE_URL, 'FMP_STOCK_API_KEY');
    return plainToClass(DTO.GainersOrLosersDto, response);
  }

  async tickerList_FMP(query: string) {
    const BASE_URL = `https://financialmodelingprep.com/api/v3/search?query=${query}&apikey=`;
    const response = await this.tryCatchF(BASE_URL, 'FMP_STOCK_API_KEY');
    // return  response.slice(0, 10);
    return plainToClass(DTO.SearchSymbolOutFMPDto, response?.slice(0, 10));
  }

  async getTickerFullChart_FMP(
    ticker: string,
    dateStart: string,
    dateEnd: string,
  ) {
    let range
    const daylength = await this.stockHelperService.calculateDaysBetween(dateStart, dateEnd)
    const abbreviatedDay = await this.stockHelperService.getAbbreviatedDay(dateEnd);
    if(daylength<=2){
      // if(abbreviatedDay==='Sun'){
      //   let dateStart3 = await this.stockHelperService.getDateThreeDaysAgo(dateEnd)
      //   return await this.getfullTopost(ticker,dateStart3, dateEnd)
      // }
      range = '1min'
    } else  if(daylength>2 && daylength <=9){
      range = '5min'
    } else  if(daylength>9 && daylength <= 45){
      range = '15min'
    } else  if(daylength>45 && daylength <= 60){
      range = '1hour'
    } else  if(daylength>60 && daylength <= 175){
      range = '4hour'
    } 
    let BASE_URL = `https://financialmodelingprep.com/api/v3/historical-chart/${range}/${ticker}?from=${dateStart}&to=${dateEnd}&apikey=`;
    if (daylength > 175) {
      return this.getTickerDailyChart_FMP(ticker,dateStart,dateEnd)
    }

    const response = await this.tryCatchF(BASE_URL, 'FMP_STOCK_API_KEY');
    const result = await this.stockHelperService.returnNewData(response)
    return result;
  }

  async getTickerDailyChart_FMP(
    ticker: string,
    dateStart: string,
    dateEnd: string,
  ) {
    const BASE_URL = `https://financialmodelingprep.com/api/v3/historical-price-full/${ticker}?from=${dateStart}&to=${dateEnd}&apikey=`;
    const response = await this.tryCatchF(BASE_URL, 'FMP_STOCK_API_KEY');
    const data = plainToClass(DTO.ChartOutFMPDto, response?.historical)
    const result = this.stockHelperService.returnNewData(data)
    return result;
  }

  async fromFMP(type: FMPRType, stockTicker: string, stockMarket: string) {
    if (type === FMPRType.RTP && stockTicker) {
      return this.realTimePrice_FMP(stockTicker);
    } else if (type === FMPRType.RTPA) {
      return this.realTimePriceAll_FMP();
    } else if (type === FMPRType.MCP && stockTicker) {
      return this.bulkrequestsMulCom_FMP(stockTicker);
    } else if (type === FMPRType.GAINORlOSE && stockMarket) {
      return this.gainersOrLosers_FMP(stockMarket);
    } else if (type === FMPRType.SEARCH && stockTicker) {
      return this.tickerList_FMP(stockTicker);
    }
    throw new NotFoundException('NOT FOUND');
  }

  async earningsCal_FINNHUB(start?: string, end?: string) {
    const today = new Date();
    const cstOffset = 5 * 60; // CST is UTC-6
    today.setMinutes(today.getMinutes() - cstOffset); //set to local Houston Time zone
    const current = end || today.toISOString().replace(/T.*$/, '');
    const BASE_URL = `https://finnhub.io/api/v1/calendar/earnings?from=${current}&to=${current}&token=`;
    const response = await this.tryCatchF(BASE_URL, 'FINNHUB_STOCK_API_KEY');
    return plainToClass(DTO.EarningCalFinnhubOut, response?.earningsCalendar);
  }

  async tickerNews_FINNHUB(query: string, start?: string, end?: string) {
    const today = new Date();
    today.setDate(today.getDate() - 5);
    const lastFiveDays = start || today.toISOString().replace(/T.*$/, '');
    const current = end || new Date().toISOString().replace(/T.*$/, '');
    const BASE_URL = `https://finnhub.io/api/v1/company-news?symbol=${query}&from=${lastFiveDays}&to=${current}&token=`;
    const response = await this.tryCatchF(BASE_URL, 'FINNHUB_STOCK_API_KEY');
    return plainToClass(DTO.NewsFinnhubOutDto, response);
  }

  async realTimePrice_FINNHUB(query: string) {
    const BASE_URL = `https://finnhub.io/api/v1/quote?symbol=${query}&token=`;
    const response = await this.tryCatchF(BASE_URL, 'FINNHUB_STOCK_API_KEY');
    return plainToClass(DTO.RealTimePriceFinnhubDto, response);
  }

  async companyProfile_FINNHUB(query: string) {
    const BASE_URL = `https://finnhub.io/api/v1/stock/profile2?symbol=${query}&token=`;
    const response = await this.tryCatchF(BASE_URL, 'FINNHUB_STOCK_API_KEY');
    return plainToClass(DTO.CompanyProfileDto, response);
  }

  async insiderTransactions_FINNHUB(query: string) {
    const BASE_URL = `https://finnhub.io/api/v1/stock/insider-transactions?symbol=${query}&token=`;
    const response = await this.tryCatchF(BASE_URL, 'FINNHUB_STOCK_API_KEY');
    return plainToClass(DTO.InsiderTransactionsDto, response?.data);
  }

  async peers_recommendation_FINNHUB(
    query: string,
    endpoint: 'peers' | 'recommendation',
  ) {
    const BASE_URL = `https://finnhub.io/api/v1/stock/${endpoint}?symbol=${query}&token=`;
    const response = await this.tryCatchF(BASE_URL, 'FINNHUB_STOCK_API_KEY');
    return response;
  }
  async full_recommendation_FINNHUB(query: string) {
    const symbols = query.split(',');
    const requests = symbols.map((symbol) =>
      this.peers_recommendation_FINNHUB(symbol, 'recommendation'),
    );
    // Wait for all the API calls to complete
    const responses = await Promise.all(requests);

    // Return the combined results
    return symbols.map((symbol, index) => ({
      symbol,
      recommendation: responses[index],
    }));
  }
  // search function
  async tickerList_FINNHUB(query: string) {
    const BASE_URL = `https://finnhub.io/api/v1/search?q=${query}&token=`;
    const response = await this.tryCatchF(BASE_URL, 'FINNHUB_STOCK_API_KEY');
    return plainToClass(
      DTO.SearchSymbolOutFinnhubDto,
      response?.result?.slice(0, 10),
    );
  }

  async getMetric_FINHUB(symbol:string){
    const BASE_URL = `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=`;
    const response = await this.tryCatchF(BASE_URL, 'FINNHUB_STOCK_API_KEY');
    return response?.metric
  }

  async fromFinnhub(
    type: FhRequestType,
    stockTicker: string,
    start: string,
    end: string,
  ) {
    if (type === FhRequestType.EARNING) {
      return this.earningsCal_FINNHUB(start, end);
    }
    if (type === FhRequestType.NEWS) {
      return this.tickerNews_FINNHUB(stockTicker, start, end);
    }
    if (type === FhRequestType.RTP) {
      return this.realTimePrice_FINNHUB(stockTicker);
    }
    if (type === FhRequestType.ComPro) {
      return this.companyProfile_FINNHUB(stockTicker);
    }
    if (type === FhRequestType.INTRAN) {
      return this.insiderTransactions_FINNHUB(stockTicker);
    }
    if (type === FhRequestType.TICKLIST) {
      return this.tickerList_FINNHUB(stockTicker);
    }
    if (type === FhRequestType.PEERS) {
      return this.peers_recommendation_FINNHUB(stockTicker, 'peers');
    }
    if (type === FhRequestType.RECOMMENDATION) {
      return this.peers_recommendation_FINNHUB(stockTicker, 'recommendation');
    }
    if (type === FhRequestType.MULTIPLE_RECOM) {
      return this.full_recommendation_FINNHUB(stockTicker);
    }
    throw new NotFoundException('NOT FOUND');
  }

  //TSLA,AMZN,MSFT
  async tickerNews_STOCK_DATA(query: string, date: string) {
    const BASE_URL = `https://api.stockdata.org/v1/news/all?filter_entities=true&language=en&published_on=${date}&symbols=${query}&api_token=`;
    const response = await this.tryCatchF(BASE_URL, 'STOCK_DATA');
    return plainToClass(DTO.NewsStockDataOut, response?.data);
  }

  //hourly
  async tickerNews_STOCK_DATA_ONEH(
    query: string,
    date: string,
    start: string,
    end: string,
  ) {
    // 23-11-18 / 00:00:00 / 01:00:00
    // `https://api.stockdata.org/v1/news/all?filter_entities=true&language=en&api_token=FpDPF5CdoDSP8E4VynMN6EipS6zm9eeSPiNCJKb8&published_before=2023-11-18T02:00:00&published_after=2023-11-18T01:00:00&symbols=${query}`
    const BASE_URL = `https://api.stockdata.org/v1/news/all?filter_entities=true&language=en&published_before=${date}T${end}&published_after=${date}T${start}&symbols=${query}&api_token=`;
    const response = await this.tryCatchF(BASE_URL, 'STOCK_DATA');
    if (response?.data) return response?.data;
    return [];
  }

  //AAL NewsAlphaVantageOutDto
  async tickerNews_ALPHA_VANTAGE(query: string) {
    const BASE_URL = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${query}&apikey=`;
    const response = await this.tryCatchF(BASE_URL, 'ALPHA_VANTAGE');
    // return response;
    return plainToClass(DTO.NewsAlphaVantageOutDto, response?.feed);
  }

  //AAL new form FireBase //stockAVnews | stockSDnews
  async tickerNews_AV_FirebaseGet(ticker: string, date: string, db: string) {
    const BASE_URL = `${this.configService.get<any>(
      'FIREBASE_DATA',
    )}/${db}/${ticker}/${date}.json`;
    const response = await axios.get(BASE_URL);
    if (response?.data?.items === '0') return [];
    if (db === 'stockAVnews') {
      return plainToClass(DTO.NewsAlphaVantageOutDto, response?.data?.feed);
    } else {
      return plainToClass(DTO.NewsStockDataOut, response?.data?.feed);
    }
  }

  //AAL new form FireBase //stockAVnews | stockSDnews
  async tickerNews_AV_FirebaseGetALL(ticker: string, db: string) {
    const BASE_URL = `${this.configService.get<any>(
      'FIREBASE_DATA',
    )}/${db}/${ticker}.json`;
    const response = await axios.get(BASE_URL);
    return response.data;
  }

  //pat to database //stockAVnews | stockSDnews
  async tickerNews_AV_FirebasePut(
    ob: any,
    ticker: string,
    date: string,
    db: string,
  ) {
    const BASE_URL = `${this.configService.get<any>(
      'FIREBASE_DATA',
    )}/${db}/${ticker}/${date}.json`;
    const response = await axios.patch(BASE_URL, ob);
    return response.data;
  }

  //put list to database //watchlists | gainers | losers | earncal
  async lists_FirebasePut(tickerlistsRL: any, db: string, date?: string) {
    let BASE_URL = `${this.configService.get<any>(
      'FIREBASE_DATA',
    )}/realtime/${db}.json`;
    if (db === 'earncal')
      BASE_URL = `${this.configService.get<any>(
        'FIREBASE_DATA',
      )}/realtime/earncal/${date}.json`;
    const response = await axios.patch(BASE_URL, tickerlistsRL);
    return response.data;
  }

  //get list to database //watchlists | gainers | losers | earncal
  async lists_FirebaseGet(db: string, date?: string) {
    let BASE_URL = `${this.configService.get<any>(
      'FIREBASE_DATA',
    )}/realtime/${db}.json`;
    if (db === 'earncal')
      BASE_URL = `${this.configService.get<any>(
        'FIREBASE_DATA',
      )}/realtime/earncal/${date}.json`;
    const response = await axios.get(BASE_URL);
    if (response?.data === '0') return [];
    return response?.data;
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
          console.error(`Error with key ${keyDATA}`, error?.response?.status);
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
  async tickerNews_STOCK_DATA24(query: string, date: string) {
    const data = [];
    //00-09
    for (let i = 0; i < 9; i++) {
      const hour = await this.tickerNews_STOCK_DATA_ONEH(
        query,
        date,
        `0${i}:00:00`,
        `0${i + 1}:00:00`,
      );
      if (hour.length !== 0) data.push(...hour);
    }
    //09-10
    const hour = await this.tickerNews_STOCK_DATA_ONEH(
      query,
      date,
      `09:00:00`,
      `10:00:00`,
    );
    if (hour.length !== 0) data.push(...hour);
    // //10-19
    for (let i = 0; i < 9; i++) {
      const hour = await this.tickerNews_STOCK_DATA_ONEH(
        query,
        date,
        `1${i}:00:00`,
        `1${i + 1}:00:00`,
      );
      // Your code here
      if (hour.length !== 0) data.push(...hour);
    }
    // 19-24
    for (let i = 19; i < 24; i++) {
      const hour = await this.tickerNews_STOCK_DATA_ONEH(
        query,
        date,
        `${i}:00:00`,
        `${i + 1}:00:00`,
      );
      // Your code here
      if (hour.length !== 0) data.push(...hour);
    }
    // return data
    return plainToInstance(DTO.NewsStockDataOut, data);
  }

  async tickerNews_STOCK_DATA12(query: string, date: string) {
    const data = [];
    //05-09
    for (let i = 5; i < 9; i++) {
      const hour = await this.tickerNews_STOCK_DATA_ONEH(
        query,
        date,
        `0${i}:00:00`,
        `0${i + 1}:00:00`,
      );
      if (hour.length !== 0) data.push(...hour);
    }
    //09-10
    const hour = await this.tickerNews_STOCK_DATA_ONEH(
      query,
      date,
      `09:00:00`,
      `10:00:00`,
    );
    if (hour.length !== 0) data.push(...hour);
    // //10-19
    for (let i = 0; i < 9; i++) {
      const hour = await this.tickerNews_STOCK_DATA_ONEH(
        query,
        date,
        `1${i}:00:00`,
        `1${i + 1}:00:00`,
      );
      // Your code here
      if (hour.length !== 0) data.push(...hour);
    }
    // return data
    return plainToInstance(DTO.NewsStockDataOut, data);
  }

  async getFromFB(endpoint:string) {
    const firebaseRoot = this.configService.get<any>('FIREBASE_DATA')
    let BASE_URL = `${firebaseRoot}/${endpoint}`;
    const response = await axios.get(BASE_URL);
    return response.data?response.data:[];
  }

  async getfullTopost(
    ticker: string,
    dateStart: string,
    dateEnd: string,
  ){
    const timespan = '1min'
    const dateRanges = await this.stockHelperService.getDateRanges(dateStart, dateEnd, 2);
    const urls = dateRanges.map(({ start, end }) => {
      return `https://financialmodelingprep.com/api/v3/historical-chart/${timespan}/${ticker}?from=${start}&to=${end}&apikey=`;
    });
    console.log(urls)
    const responsesArray = await Promise.allSettled(
      urls.map(async url => {
        // console.log(url)
        return await this.tryCatchF(url, 'FMP_STOCK_API_KEY');
      })
    );
    // Combine results into a single array
    const allResults = responsesArray
    .filter(result => result?.status === 'fulfilled') // Filter only fulfilled results
    .map((result:any) => result?.value) // Extract the results array
    .flat(); // Flatten the array of arrays into a single array

    // // const result = await this.stockHelperService.returnNewData(allResults)
    // this.postToFirebase(ticker,allResults,timespan, dateStart+'-to-'+dateEnd,).then(data=>{
    //   // console.log(data)
    // })
    // const data = await this.getFromFB(ticker,timespan,dateStart+'-to-'+dateEnd,)
    const allResults2 = await this.stockHelperService.returnNewData(allResults)

    // const newdata = await this.stockHelperService.transformData(allResults2)
    // const allResults = await this.stockHelperService.returnNewData(data.data)
    // console.log(data.data)
    // await this.postToFirebase(ticker,newdata,timespan+'-modifire', dateStart+'-to-'+dateEnd,).then(data=>{
    //   // console.log(data)
    // })
    return allResults2;
  }

async postToFirebase(stockTicker: string, data: any, type:string ,endpoint:string) {
  const firebaseRoot = this.configService.get<any>('FIREBASE_DATA')
  let BASE_URL = `${firebaseRoot}/history2/${type}/${stockTicker.toUpperCase()}.json`;
  let config = {
    method: 'patch',
    maxBodyLength: Infinity,
    url: BASE_URL,
    headers: {
      'Content-Type': 'text/plain',
    },
    data: data,
  };
  return await axios
    .request(config)
    .then(async (response) => {
      return await JSON.stringify(response.data)
    })
    .catch((error) => {
      console.log(error);
    });
}
}
