import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs'; 
import { ConfigService } from '@nestjs/config';
import { plainToClass, plainToInstance } from 'class-transformer';
import * as DTO from './dto';
import { StockHelperService } from './stockHelper.service';
import { AlphavantageService } from 'src/alphavantage/alphavantage.service';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DataHistory } from './entities';
@Injectable()
export class LocalPLWR {
  constructor(
    private readonly configService: ConfigService,
    private readonly stockHelperService: StockHelperService,
    private readonly alphavantageService: AlphavantageService,
    @InjectRepository(DataHistory)
    private dataHistoryRipo: Repository<DataHistory>,
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
    }
    // return {
    //   dayStart,range,timespan, dayend
    // }
    if(ticker.includes('USD')){
      return
    }
    const urls = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/${range}/${timespan}/${dayStart}/${dayend}?adjusted=true&sort=desc&limit=50000&apiKey=`;
    if (timefame.includes('weekly') || timefame.includes('monthly')) {
      return this.alphavantageService.weekORmonthly(ticker, timefame);
    }
    // const responsesArray = await this.tryCatchF(urls, 'POLYGON_STOCK_API_KEY');
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
          console.error(`Internal Server Error with key `, error?.response);
        } else {
          if(error?.response?.status === 402){
                      // Handle other errors
          // console.log('I want to store in file',ticker)
          // const dir = './logs';
          // if (!fs.existsSync(dir)) fs.mkdirSync(dir);
          //       // ✅ Append or create file automatically
          // const filePath = `${dir}/failed_tickers.txt`;
          // fs.appendFileSync(filePath, ` | http://localhost:3001/?stockTicker=${ticker}&endpoint=fmp-eod  |\n`, 'utf8');
          console.error(`Error with key ${key.substring(0, 4)} `, error?.response?.status);
          break
          }
        }
      }
    }
    // If none of the API keys work, throw an error
    return null;
  }

  async storeDataHis(symbol: string, source: string, date: string, data: any) {
    try {
      // Create the dataHistoryRipo entity
      const stockPortfolio = this.dataHistoryRipo.create({
        symbol,
        source,
        date,
        data,
      });
      // Save the stockPortfolio entity to the database
      await this.dataHistoryRipo.save(stockPortfolio);
    } catch (error) {}
  }

  async getAllData(symbols: string[]): Promise<DataHistory[]> {
    // Query to get the filtered data by symbols
    const symbolData = await this.dataHistoryRipo.find({
      where: {
        symbol: In(symbols), // Filter based on the passed symbols
      },
    });

    return symbolData;
  }
  async getAllDataBySymbol(symbol): Promise<DataHistory> {
    const symbolData = await this.dataHistoryRipo.findOneOrFail({
      where: { symbol: symbol },
    });
    return symbolData.data;
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
    } else if (timefame.includes('weekly')) {
      tem = '1week';
    } else if (timefame.includes('monthly')) {
      tem = '1month';
    }
    if(ticker.includes('USD')){
      // ticker = this.stockHelperService.getmatch1only(ticker)
      // return this.getCoinHistory(ticker, '5m')
      ticker = this.stockHelperService.formatSymbol(ticker)
    }
    let BASE_URL = `https://api.twelvedata.com/time_series?symbol=${ticker}&interval=${tem}&outputsize=400&dp=2&apikey=`;
    const response = await this.tryCatchtwelvedata(BASE_URL);
    if (response.status == 'ok') {
      const responseRe = plainToClass(DTO.ChartOutTwelveData, response.values);
      return responseRe;
    }
    return response;
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
    if (this.repeat === 3) {
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
      console.log(`Trying Key: ${nextKey.slice(0, 4)}...`);
  
      try {
        const response = await axios.get(url);
        if (response.data.status === 'error') {
          throw new Error('API returned error status');
        }
        return response.data; // success!
      } catch (error: any) {
        attempt++;
        console.error(`Error with key ${nextKey.slice(0, 4)}...:`, error?.response?.status || error.message);
        // Only retry if we haven't exhausted all keys
        if (attempt >= maxRetries) {
          throw new Error('All API keys failed.');
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
    if (this.repeatPo === 2) {
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
      console.log(`Trying key: ${nextKey.slice(0, 4)}...`);
  
      try {
        const response = await axios.get(url);
        return response.data; // success!
      } catch (error: any) {
        attempt++;
        console.error(`Error with key ${nextKey.slice(0, 4)}...:`, error?.response?.status || error.message);
  
        // Only retry if we haven't exhausted all keys
        if (attempt >= maxRetries) {
          throw new Error('All API keys failed.');
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
}
