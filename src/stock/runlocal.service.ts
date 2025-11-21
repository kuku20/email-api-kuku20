import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
// import * as fs from 'fs'; 
import { ConfigService } from '@nestjs/config';
import { plainToClass, plainToInstance } from 'class-transformer';
import * as DTO from './dto';
import { StockHelperService } from './stockHelper.service';
import { AlphavantageService } from 'src/alphavantage/alphavantage.service';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DataHistory1d,DataHistory4h,DataHistory1h,DataHistory30m,DataHistory15m,DataHistory5m ,DataHistory1m } from './entities';
import * as dbrs from './database.api';
@Injectable()
export class LocalPLWR {
  constructor(
    private readonly configService: ConfigService,
    private readonly stockHelperService: StockHelperService,
    private readonly alphavantageService: AlphavantageService,
    @InjectRepository(DataHistory1d)
    private dataHistory1dRepo: Repository<DataHistory1d>,

    @InjectRepository(DataHistory4h)
    private readonly dataHistory4hRepo: Repository<DataHistory4h>,

    @InjectRepository(DataHistory1h)
    private readonly dataHistory1hRepo: Repository<DataHistory1h>,

    @InjectRepository(DataHistory30m)
    private readonly dataHistory30mRepo: Repository<DataHistory30m>,

    @InjectRepository(DataHistory15m)
    private readonly dataHistory15mRepo: Repository<DataHistory15m>,

    @InjectRepository(DataHistory5m)
    private readonly dataHistory5mRepo: Repository<DataHistory5m>,

    @InjectRepository(DataHistory1m)
    private readonly DataHistory1mRepo: Repository<DataHistory1m>,
  ) {}
  
  /**
   *
   * @param ticker : AAL , SMCI
   * @param timefame  1day, 4hour, 1hour, 15min, 5min
   * @returns
   */
  async getTickerFullChart_POLYGON(ticker: string, timefame: string) {
    let range, timespan;
    const daytestBF = 0;
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
    } else if (timefame.includes('week')) {
      timespan = 'week';
      dayStart = this.stockHelperService.getDateNDaysAgo(720 + daytestBF);
      range = 1;
    } else if (timefame.includes('month')) {
      timespan = 'month';
      dayStart = this.stockHelperService.getDateNDaysAgo(720 + daytestBF);
      range = 1;
    } else{
      return null
    }
    // return {
    //   dayStart,range,timespan, dayend
    // }
    if(ticker.includes('USD') && ticker.length>3){
      return
    }
    const urls = `https://api.massive.com/v2/aggs/ticker/${ticker}/range/${range}/${timespan}/${dayStart}/${dayend}?adjusted=true&sort=desc&limit=50000&apiKey=`;
    // if (timefame.includes('weekly') || timefame.includes('monthly')) {
    //   return this.alphavantageService.weekORmonthly(ticker, timefame);
    // }
    // const responsesArray = await this.tryCatchF(urls, 'POLYGON_STOCK_API_KEY');
    console.log(urls)
    const responsesArray = await this.tryCatchtPO(urls);
    // return responsesArray.results
    const response = plainToClass(
      DTO.ChartOutPolygonDto,
      responsesArray.results,
    );
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
    return this.twelvedata(ticker, timefame);
    const daytestBF = 0;
    const dayend = this.stockHelperService.getDateNDaysAgo(-1 + daytestBF);
    let dayStart;
    if (timefame.includes('4hour')) {
      dayStart = this.stockHelperService.getDateNDaysAgo(120 + daytestBF);
    } else if (timefame.includes('1hour')) {
      dayStart = this.stockHelperService.getDateNDaysAgo(55 + daytestBF);
    } else if (timefame.includes('15min')) {
      dayStart = this.stockHelperService.getDateNDaysAgo(20 + daytestBF);
    } else if (timefame.includes('5min')) {
      dayStart = this.stockHelperService.getDateNDaysAgo(7 + daytestBF);
    } else if (timefame.includes('1min')) {
      dayStart = this.stockHelperService.getDateNDaysAgo(7 + daytestBF);
    }

    let BASE_URL = `https://financialmodelingprep.com/api/v3/historical-chart/${timefame}/${ticker}?from=${dayStart}&to=${dayend}&apikey=`;
    if (timefame.includes('day')) {
      dayStart = this.stockHelperService.getDateNDaysAgo(365 + daytestBF);
      return this.getTickerDailyChart_FMP(ticker, dayStart, dayend);
    }
    if (timefame.includes('weekly') || timefame.includes('monthly')) {
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
    // const result = this.stockHelperService.returnNewData(data);
    // return result;
  }

  async RTP_FINNHUB_FOR_CHART(query: string) {
    const BASE_URL = `https://finnhub.io/api/v1/quote?symbol=${query}&token=`;
    const response = await this.tryCatchF(BASE_URL, 'FINNHUB_STOCK_API_KEY');
    return plainToClass(DTO.RealTimePriceFhForChartDto, response);
  }
  async tryCatchF(BASE_URL: string, keyDATA: string, ticker?:any) {
    const keys = this.configService.get<any>(keyDATA).split(',');
    this.shuffleArray(keys);
    for (const key of keys) {
      const url = `${BASE_URL}${key}`;
      //console.log(url);
      try {
        const response = await axios.get(url);
        // console.log(`✅ Success: ${ticker}`);

        // // Log successful tickers
        // const dir = './logs';
        // if (!fs.existsSync(dir)) fs.mkdirSync(dir);

        // const successPath = `${dir}/success_tickers.txt`;
        // fs.appendFileSync(successPath, ` | http://localhost:3001/?stockTicker=${ticker}&endpoint=fmp-eod  |\n`, 'utf8');

        return response.data;
      } catch (error) {
        if (error?.response && error?.response?.status === 500) {

          // Handle 500 error
          console.error(`Internal Server Error with key `);
        } else {
          if(error?.response?.status === 402){
                      // Handle other errors
          // console.log('I want to store in file',ticker)
          // const dir = './logs';
          // if (!fs.existsSync(dir)) fs.mkdirSync(dir);
          //       // ✅ Append or create file automatically
          // const filePath = `${dir}/failed_tickers.txt`;
          // fs.appendFileSync(filePath, ` | http://localhost:3001/?stockTicker=${ticker}&endpoint=fmp-eod  |\n`, 'utf8');
          console.error(`Error with key ${key.substring(0, 4)} `);
          break
          }
        }
      }
    }
    // If none of the API keys work, throw an error
    return null;
  }
  // post to database
  async saveData(
    symbol: string,
    timeframe: string,
    date: string,
    data: any,
    source = 'llcone'
  ) {
    try {
      // Get the repository for the timeframe
      const repo = this.getRepository(timeframe);
      if (!repo) {
        console.warn(`Skipping unsupported timeframe: ${timeframe}`);
        return; // do nothing
      }
      // Save (insert or update automatically based on primary key)
      await repo.save({
        symbol,
        source,
        date,
        data,
      });
    } catch (error) {
      console.error(`Error saving data for ${symbol} [${timeframe}]:`, error);
      throw error;
    }
  }
  
  // Map timeframe to repository
  private getRepository(timeframe: string): Repository<any> {
    switch (timeframe) {
      case '1day': return this.dataHistory1dRepo;
      case '4hour': return this.dataHistory4hRepo;
      case '1hour': return this.dataHistory1hRepo;
      case '30min': return this.dataHistory30mRepo;
      case '15min': return this.dataHistory15mRepo;
      case '5min': return this.dataHistory5mRepo;
      case '1min': return this.DataHistory1mRepo;
      default:
            // silently skip
      return null;
    }
  }

  async getData(symbol: string, timeframe: string) {
    try {
      // Get the repository for the requested timeframe
      const repo = this.getRepository(timeframe);
      if (!repo) {
        console.warn(`Skipping unsupported timeframe: ${timeframe}`);
        return; // do nothing
      }
      // Fetch all records for this symbol, ordered by date descending
      const result = await repo.find({
        where: { symbol },
        order: { date: 'DESC' },
      });
      if (result[0]?.data && Array.isArray(result[0].data)) {
        result[0].data.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      }
      
      return result;
    } catch (error) {
      return; 
    }
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

  async twelvedata(ticker: string, timefame: string) {
    let tem = timefame;
    if (timefame.includes('hour')) {
      tem = timefame.slice(0, 2);
    } else if (timefame.includes('week')) {
      tem = '1week';
    } else if (timefame.includes('month')) {
      tem = '1month';
    }
    if(ticker.includes('USD')){
      // ticker = this.stockHelperService.getmatch1only(ticker)
      // return this.getCoinHistory(ticker, '5m')
      ticker = this.stockHelperService.formatSymbol(ticker)
    }
    let BASE_URL = `https://api.twelvedata.com/time_series?symbol=${ticker}&interval=${tem}&outputsize=400&dp=2&apikey=`;
    const response = await this.tryCatchtwelvedata(BASE_URL);
      if (response?.status == 'ok') {
        // us stock     "exchange_timezone": "America/New_York", ChartOutTwelveData
        // btc don't turn to ChartOutTwelveDataUTC
        const meta_timezone = response.meta.exchange_timezone
        let responseRe
        if(meta_timezone){
          responseRe = plainToClass(DTO.ChartOutTwelveData, response.values);
        }else if(!meta_timezone){
          responseRe = plainToClass(DTO.ChartOutTwelveDataUTC, response.values);
        }
        return responseRe;
      }
    return null;
  }
  getRandomNumber(x: number): number {
    return Math.floor(Math.random() * (x + 1));
  }

  keys = this.configService.get<any>('twelvedata').split(',');
  // keys =['1f978ae4f4d74a7aa2ad9259dcd9ed54','3168052d38164f3abcb7aff8ab98d806']
  repeat =   0; // which key we're on
  index = this.getRandomNumber(this.keys.length-1)

  nextKey(keys) {
    const key = keys[this.index];
    this.repeat++;
    if (this.repeat === 1) {
      this.repeat = 0;
      this.index = (this.index + 1) % keys.length; // loop back to start
      console.log(this.index)
    }
    return key;
  }

  async tryCatchtwelvedata(BASE_URL: string, maxRetries = this.keys.length) {
    let attempt = 0;
    while (attempt < maxRetries) {
      const nextKey = this.nextKey(this.keys);
      const url = `${BASE_URL}${nextKey}`;
      console.log(`:12:Trying Key: 12: ${nextKey.slice(0, 4)}...`);
  
      try {
        const response = await axios.get(url);
        if (response.data?.code === 404) {
          console.warn(':12: Received 404 code in response, breaking...');
          return null; 
        }
        if (response.data?.status === 'error') {
          throw new Error(':12:API returned error status: 12');
        }
        return response.data; // success!
      } catch (error: any) {
        attempt++;
              // Detect 404 from Axios response
        if (error.response?.status === 404) {
          console.warn(':12: Received HTTP 404 from TwelveData, breaking...');
          return null; 
        }
        console.error(`:12:Error with key ${nextKey.slice(0, 4)}...:`, error?.message || error);
        if (attempt >= maxRetries) {
          throw new Error(':12:All API keys failed: 12');
        }
      }
    }
    // If none of the API keys work, throw an error
  }


  // keysPo =['7bn8ZZK_pmpnvxRrAJ2tBzQc73g20NnX','c3wb6rjDqh_k6odbauYqyfgoL32258Uk'];
  keysPo = this.configService.get<any>('POLYGON_STOCK_API_KEY').split(',');
  repeatPo = 0
  indexPo = this.getRandomNumber(this.keysPo.length-1)
  nextKeyPo(keys) {
    const key = keys[this.indexPo];
    this.repeatPo++;
    if (this.repeatPo === 1) {
      console.log(this.indexPo)
      this.repeatPo = 0;
      this.indexPo = (this.indexPo + 1) % keys.length; // loop back to start
    }
    return key;
  }

  async tryCatchtPO(BASE_URL: string, maxRetries = this.keysPo.length) {
    let attempt = 0;
    while (attempt < maxRetries) {
      const nextKey = this.nextKeyPo(this.keysPo);
      const url = `${BASE_URL}${nextKey}`;
      console.log(`:PO:Trying key: ${nextKey.slice(0, 4)}...`);
  
      try {
        const response = await axios.get(url);
        return response.data; // success!
      } catch (error: any) {
        attempt++;
        console.error(`:PO:Error with key ${nextKey.slice(0, 4)}...:`, error?.response.statusText);
        // const dir = './logs';
        // if (!fs.existsSync(dir)) fs.mkdirSync(dir);

        // const successPath = `${dir}/error_tickers.txt`;
        // fs.appendFileSync(successPath, `| :PO: | ${url}  |\n`, 'utf8');
        // Only retry if we haven't exhausted all keys
        if (attempt >= maxRetries) {
          throw new Error(':PO: All API keys failed');
        }
      }
    }
  }
  private readonly apiUrl = 'https://api.livecoinwatch.com/coins/single/history';
  private readonly apiKey = '66f75cb5-17b5-4cf7-bb09-9e161fde19fc';
  async getCoinHistory(
    code: string,
    interval: string,
    currency = 'USD',
    meta = true,
    totalCandles = 300, // desired number of candles
  ) {
    try {
      // 1️⃣ Define interval in minutes
      let intervalMinutes = 1;
      switch (interval) {
        case '5m':
          intervalMinutes = 5;
          break;
        case '15m':
          intervalMinutes = 15;
          break;
        case '30m':
          intervalMinutes = 30;
          break;
        default:
          intervalMinutes = 1;
      }

      const intervalMs = intervalMinutes * 60 * 1000;
      const maxCandlesPerRequest = 100; // LiveCoinWatch max per request
      const allData = [];

      let endTimestamp = Date.now();

      while (allData.length < totalCandles) {
        const remainingCandles = totalCandles - allData.length;
        const candlesThisRequest = Math.min(maxCandlesPerRequest, remainingCandles);
        const startTimestamp = endTimestamp - intervalMs * candlesThisRequest;

        // Fetch batch
        const response = await axios.post(
          this.apiUrl,
          {
            currency,
            code,
            start: startTimestamp,
            end: endTimestamp,
            meta,
          },
          {
            headers: {
              'content-type': 'application/json',
              'x-api-key': this.apiKey,
            },
          },
        );

        const data = response.data?.history || [];
        if (data.length === 0) break; // stop if no more data

        // Prepend to maintain chronological order
        allData.unshift(...data);

        // Prepare next batch
        endTimestamp = startTimestamp;
      }

      // Transform to DTO
      const reversedData = [...allData]; // clone + reverse
      const date = new Date()
      console.log('runlocal.service.ts-425',code,date)
      const dataOut = plainToInstance(DTO.CoinHistoryDto, reversedData, {
        excludeExtraneousValues: true,
      })
        // 2️⃣ Process data with your helper
      const newData = await this.stockHelperService.returnNewData(dataOut);
        //         // 3️⃣ Get the last two data points
      const returndata = newData.reverse();
                // const lastData = newData[0];
                // const secondLastData = newData[1];
                // console.log('runlocal.service.ts-434',lastData,secondLastData)
      return returndata
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || error.message,
        error.response?.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  async get12for(
    ticker: string,
    timefame: string,
    apikey
  ) {
    try {
      if(ticker.includes('USD')){
        ticker = this.stockHelperService.formatSymbol(ticker)
      }
      let BASE_URL = `https://api.twelvedata.com/time_series?symbol=${ticker}&interval=${timefame}&outputsize=400&dp=2&apikey=${apikey}`;
      const response = await axios.get(BASE_URL);
      if (response.data.status === 'error') {
        throw new Error('API returned error status');
      }
      else if (response.data?.status == 'ok') {
        // us stock     "exchange_timezone": "America/New_York", ChartOutTwelveData
        // btc don't turn to ChartOutTwelveDataUTC
        const meta_timezone = response.data.meta.exchange_timezone
        const responseRe =  response.data.values;
        const reversedData = [...responseRe].reverse(); // clone + reverse
        let dataOut
        if(meta_timezone){
          dataOut = plainToInstance(DTO.ChartOutTwelveData, reversedData, {
            excludeExtraneousValues: true,
          })
        } else if(!meta_timezone){
          dataOut = plainToInstance(DTO.ChartOutTwelveDataUTC, reversedData, {
            excludeExtraneousValues: true,
          })
        }
        const newData = await this.stockHelperService.returnNewData(dataOut);
        return newData;
      }
    } catch (error) {
      console.error(`Error with key ${apikey.slice(0, 4)}...:`, error?.response?.status || error.message);
    }
  }

  async TwReveseNOAPI(ticker: string, timefame: string) {
    let tem = timefame;
    if (timefame.includes('hour')) {
      tem = timefame.slice(0, 2);
    } else if (timefame.includes('week')) {
      tem = '1week';
    } else if (timefame.includes('month')) {
      tem = '1month';
    }
    if(ticker.includes('USD')){
      // ticker = this.stockHelperService.getmatch1only(ticker)
      // return this.getCoinHistory(ticker, '5m')
      ticker = this.stockHelperService.formatSymbol(ticker)
    }
    let BASE_URL = `https://api.twelvedata.com/time_series?symbol=${ticker}&interval=${tem}&outputsize=400&dp=2&apikey=`;
    console.log(BASE_URL)
    const response = await this.tryCatchtwelvedata(BASE_URL);
    if (response?.status == 'ok') {
      // us stock     "exchange_timezone": "America/New_York", ChartOutTwelveData
      // btc don't turn to ChartOutTwelveDataUTC
      const meta_timezone = response.meta.exchange_timezone
      const responseRe =  response.values;
      const reversedData = [...responseRe].reverse(); // clone + reverse
      let dataOut
      if(meta_timezone){
        dataOut = plainToClass(DTO.ChartOutTwelveData, response.values);
      } else if(!meta_timezone){
        dataOut = plainToInstance(DTO.ChartOutTwelveDataUTC, reversedData, {
          excludeExtraneousValues: true,
        })
      }
      const newData = await this.stockHelperService.returnNewData(dataOut);
      return newData;
    }
    // return null;
  }


  async FMP_EOD_FULL(ticker: string) {
    const daytestBF = 0;
    const dayend = this.stockHelperService.getDateNDaysAgo(-1 + daytestBF);
    console.log(ticker)
    const dayStart = this.stockHelperService.getDateNDaysAgo(700 + daytestBF);
    let BASE_URL = `https://financialmodelingprep.com/stable/historical-price-eod/full?symbol=${ticker}&from=${dayStart}&to=${dayend}&apikey=`;

    const response = await this.tryCatchF(BASE_URL, 'FMP_STOCK_API_KEY',ticker);
    return response;
    const result = await this.stockHelperService.returnNewData(response);
    return result;
  }

  async sendTemporaryWebhook(ticker: any, errror:any, discordChanel: string='ERORR_CALL',) {
    console.log(123)
    const botname = `${discordChanel} RSIENDBOT ${ticker}`;
    const payload = {
      message:'❌ API ERROR:'+errror,
      botname,
    };
    const rootapi  = `https://nestjs-api.koyeb.app`
    // const rootapi  =  "http://localhost:3000"
    try {
      const res = await axios.post(`${rootapi}/webhooks/temporary`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
  
      return res.data; // same as await res.json()
    } catch (error) {
      console.error('❌ Error sending webhook:', error.response?.data || error.message);
      throw error;
    }
  }
  washSell30: any[] = [];
  dolist: any[] = [];

  async onModuleInit() {
    // This runs ONCE when the app starts
    await this.loadWashSellList();
    await this.getRsilist('rsiD-0-15', 7)
    await this.getRsilist('MACD_AB_POS',20)
    await this.getRsilist('MACD_BL_POS',5)
    await this.getRsilist('MACD_AB_NEG',25)
    // await this.getRsilist('MACD_BL_NEG') // run on rail
  }

  async loadWashSellList() {
    // const data = await dbrs.getData('post-wash-sell');
    const data = await this.FireBaseApi('get','stock-related/post-wash-sell.json','')
    const getwashsell30 = dbrs.getwashsell30(data);
    this.washSell30 = getwashsell30;
    // console.table(this.washSell30)
    console.log(`✅ Loaded ${this.washSell30.length} wash-sell symbols`);
    return getwashsell30
  }

  async getRsilist(path:string,limit:number = 100,dayrange:number = 7) {
    const data = await this.FireBaseApi('get',`stock-related/${path}.json`,'')
    const symbolLists = dbrs.getlastXdays(data,dayrange, limit);
    this.dolist = [... this.dolist,...symbolLists]
    console.log(`✅ Loaded: ${path} : ${symbolLists.length} symbols`);
    return symbolLists
  }
  getWashSellList() {
    return this.washSell30;
  }
  getDolist() {
    return this.dolist;
  }
  async FireBaseApi(method:'post'|'patch'|'put'|'delete'|'get',endpoint:string, data: any,) {
    const firebaseRoot = this.configService.get<any>('FIREBASE_DATA')
    let BASE_URL = `${firebaseRoot}/${endpoint}`;
    try {
      const response = await axios.request({
        method: method || 'get',
        url: BASE_URL,
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
        maxBodyLength: Infinity,
      });
    
      // Axios automatically parses JSON, so just return response.data
      return response.data;
    
    } catch (error) {
      // Match fetch's "return 'skipped'" behavior
      if (error.response) {
        console.error(`❌ Failed request. Status: ${error.response.status}`);
      } else {
        console.error(`❌ Network or Axios error: ${error.message}`);
      }
      return 'skipped';
    }
  }
}
