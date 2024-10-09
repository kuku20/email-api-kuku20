import { Injectable } from '@nestjs/common';
import { CreateAiToolDto } from './dto/create-ai-tool.dto';
import { UpdateAiToolDto } from './dto/update-ai-tool.dto';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { StockService } from 'src/stock/stock.service';
import axios from 'axios';
@Injectable()
export class AiToolService {
  constructor(private readonly configService: ConfigService, private stockService: StockService) {}
  async postGemini(message:string){
    try {
      const GEMINI_KEY = this.configService.get<any>('GEMINI_API')
      const genAI = new GoogleGenerativeAI(GEMINI_KEY);
      const model = genAI.getGenerativeModel({model: "gemini-1.5-flash",});
      const generationConfig = {
        temperature: 1.1, // 0-2
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
      };
      const chatSession = model.startChat({
        generationConfig,
      });
  
      const result = await chatSession.sendMessage(message);
  
      return result.response.text()
    } catch (error) {
      return new Error(JSON.stringify({error:error}))
    }
  }
  async getTickerFullChart_FMP(stockTicker:string, range:string, start:string, end:string, limit:string, message:string ){
    const data = await this.stockService.getTickerFullChart_FMP(stockTicker, range, "historical-chart",start, end, limit)
    const datatoString = {
      symbol:stockTicker,
      data,
    }
    const ask = message+JSON.stringify(datatoString)

    const res = await this.postGemini(ask)
    const dataout = {
      res,
      first:data[0]
    }
    this.postToFirebase(stockTicker, dataout)
    return dataout
  };
  async getFromFB(ticker:string){
      const BASE_URL = `${this.configService.get<any>('FIREBASE_DATA')}/ai/${ticker}.json`;
      const response = await axios.get(BASE_URL);
      return response.data

  }
  postToFirebase(stockTicker:string, data:any){
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Adding 1 because months are zero-based
    const day = String(now.getDate()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;
    const BASE_URL = `${this.configService.get<any>('FIREBASE_DATA')}/ai/${stockTicker}/${formattedDate}.json`;

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: BASE_URL,
      headers: { 
        'Content-Type': 'text/plain'
      },
      data :{ guess:data, time: now}
    };
    axios.request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });
  }
}
