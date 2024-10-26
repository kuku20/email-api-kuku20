import { Injectable } from '@nestjs/common';
import { CreateAiToolDto } from './dto/create-ai-tool.dto';
import { UpdateAiToolDto } from './dto/update-ai-tool.dto';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAIApi from 'openai';

import { StockService } from 'src/stock/stock.service';

import axios from 'axios';

@Injectable()
export class AiToolService {
  constructor(
    private readonly configService: ConfigService,
    private stockService: StockService,
  ) {}
  async postGemini(message: string) {
    try {
      const GEMINI_KEY = this.configService.get<any>('GEMINI_API');
      const genAI = new GoogleGenerativeAI(GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const generationConfig = {
        temperature: 1.1, // 0-2
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: 'text/plain',
      };
      const chatSession = model.startChat({
        generationConfig,
      });

      const result = await chatSession.sendMessage(message);

      return result.response.text();
    } catch (error) {
      return JSON.stringify(error.statusText)
    }
  }

  async posOpenAi(dataIn: any, message:string) {
    try {
      const OPENAI_API_KEY = this.configService.get<any>('OPENAI_API_KEY');
      const openai = new OpenAIApi({
        apiKey: OPENAI_API_KEY,
      });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: message },
          { role: 'user', content: dataIn },
        ],
        temperature: 1.1,
        presence_penalty: 0,
        frequency_penalty: 0,
      });

      return response.choices[0].message.content
    } catch (error) {
      return JSON.stringify(error.message)
    }
  }

  async getTickerFullChart_FMP(
    stockTicker: string,
    range: string,
    start: string,
    end: string,
    limit: string,
    message: string,
    type:string
  ) {
    // const data = await this.stockService.getTickerFullChart_FMP(
    //   stockTicker,
    //   start,
    //   end,
    // );
    const data = await this.stockService.getTickerFullChart_POLYGON(
      stockTicker,
      start,
      end,
    );
    const datatoString = {
      symbol: stockTicker,
      data,
    };
    const systemContent = message ? message: `I give the data on share prices over in the data, write a report of no more than 400 words describing the stocks performance and recommending whether to buy, hold or sell:`;
    const askGemini = systemContent + JSON.stringify(datatoString);

    const openai = await this.posOpenAi(JSON.stringify(datatoString), systemContent);
    const res = await this.postGemini(askGemini);
    const dataout = {
      openai,
      res,
      first: data[data.length-1],
      length: data.length
    };
    // await this.postToFirebase(stockTicker, dataout, type);
    return dataout;
  }
  async getFromFB(ticker: string, type:string) {
    const firebaseRoot = this.configService.get<any>('FIREBASE_DATA')
    let BASE_URL = `${firebaseRoot}/ai/${type}/${ticker.toUpperCase()}.json`;
    if ('gainers-losers'.includes(type)){
      BASE_URL = `${firebaseRoot}/gainers-losers/${type}/${ticker}.json`;
    }
        // console.log(BASE_URL)
    const response = await axios.get(BASE_URL);
    return response.data;
  }
  async postToFirebase(stockTicker: string, data: any, type:string) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Adding 1 because months are zero-based
    const day = String(now.getDate()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;
    const firebaseRoot = this.configService.get<any>('FIREBASE_DATA')
    let BASE_URL = `${firebaseRoot}/ai/${type}/${stockTicker.toUpperCase()}/${formattedDate}.json`;
    if ('gainers-losers'.includes(type)){
      BASE_URL = `${firebaseRoot}/gainers-losers/${type}/${formattedDate}.json`;
    }
    // console.log(BASE_URL)
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: BASE_URL,
      headers: {
        'Content-Type': 'text/plain',
      },
      data: { data: data, time: now },
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
