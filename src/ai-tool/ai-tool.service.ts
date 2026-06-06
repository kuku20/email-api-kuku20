import { Injectable } from '@nestjs/common';
import { CreateAiToolDto } from './dto/create-ai-tool.dto';
import { UpdateAiToolDto } from './dto/update-ai-tool.dto';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAIApi from 'openai';

import { StockService } from 'src/stock/stock.service';

import axios from 'axios';
import { StockHelperService } from 'src/stock/stockHelper.service';

@Injectable()
export class AiToolService {
  constructor(
    private readonly configService: ConfigService,
    private stockService: StockService,
    private stockHelperService: StockHelperService,
  ) {}
  async postGemini(newMsg: string,data?: any) {
    try {
      const symbol = data? data.symbol : newMsg.slice(0, 900).match(/"symbol":"([^"]+)"/)[1] || 'UNKNOWN';;
      const metric = (await this.stockService.getMetric_FINHUB(symbol)).metric;
      const message = newMsg + `. Metric:${JSON.stringify(metric)}` +`. Stock data:+${JSON.stringify(data)}`
      if (data?.link === 'link'){
        const datacodeOPENAI = encodeURIComponent(message.length > 1800 ? message.slice(0, 7500) + '...' : message);
        const datacodeCLAUDE = encodeURIComponent(message.length > 1800 ? message.slice(0, 10000) + '...' : message);
  
        const openaiUrlLong = `https://chat.openai.com?q=${datacodeOPENAI}`;
        const claudeAiUrlLong = `https://claude.ai/new?q=${datacodeCLAUDE}`;
    
        let openaiShortUrl = '';
        let claudeShortUrl = '';
        try {
          const [openaiRes, claudeRes] = await Promise.all([
            axios.get(
              `https://tinyurl.com/api-create.php?url=${encodeURIComponent(openaiUrlLong)}`
            ),
            axios.get(
              `https://tinyurl.com/api-create.php?url=${encodeURIComponent(claudeAiUrlLong)}`
            ),
          ]);
        
          openaiShortUrl = openaiRes?.data || '';
          claudeShortUrl = claudeRes?.data || '';
        } catch (err) {
          console.error('TinyURL API failed:', err.message);
        }
        const link = `
        <a href="${openaiShortUrl}" target="_blank">OpenAI</a> ---------|---------
        <a href="${claudeShortUrl}" target="_blank">Claude</a>
        `;
        return link;
      } 
      const res = await this.getResFromGemini(message);
      await this.GeminiPostedThread(symbol,message, res);
      return res;
    } catch (error) {
      return JSON.stringify(error.message);
    }
  }
  async getResFromGemini(message: string) {
    try {
      const GEMINI_KEY = this.configService.get<any>('GEMINI_API');
      const genAI = new GoogleGenerativeAI(GEMINI_KEY);
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.1-flash-lite',
      }); //'gemini-2.5-flash', 'gemini-3.5-flash' ,'gemini-3.1-flash-lite'
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
      // post to slack if
      const msgRes = result.response.text();
      return msgRes;
    } catch (error) {
      return JSON.stringify(error.message);
    }
  }
  async GeminiPostedThread(symbol:string,message: string, msgRes: string, slackChannel = this.stockHelperService.AI_SL) {
    const line = '================================ ';
    const performanceNRecommendatioASK = message
      .toLowerCase()
      .includes('recommendation');
    const askPrice = message.toLowerCase().includes('just guess');
    const recommendingBuyOrSell = msgRes
      .toLowerCase()
      .includes('buy')
      ? 'buy'
      : msgRes.toLowerCase().includes('hold')
      ? 'hold'
      : 'sell';
    const nexMsg = `${msgRes.replace(/\*\*/g, '*')}`;
    const locallink = `<http://localhost:4200/price-log/${symbol}?daysRange=500|${symbol}>`;

    const datacodeOPENAI = encodeURIComponent(message.length > 1800 ? message.slice(0, 7500) + '...' : message);
    const datacodeCLAUDE = encodeURIComponent(message.length > 1800 ? message.slice(0, 10000) + '...' : message);
    const openaiUrlLong = `https://chat.openai.com?q=${datacodeOPENAI}`;
    const claudeAiUrlLong = `https://claude.ai/new?q=${datacodeCLAUDE}`;


    let openaiShortUrl = '';
    let claudeShortUrl = '';
    try {
      const [openaiRes, claudeRes] = await Promise.all([
        axios.get(
          `https://tinyurl.com/api-create.php?url=${encodeURIComponent(openaiUrlLong)}`
        ),
        axios.get(
          `https://tinyurl.com/api-create.php?url=${encodeURIComponent(claudeAiUrlLong)}`
        ),
      ]);
    
      openaiShortUrl = openaiRes?.data || '';
      claudeShortUrl = claudeRes?.data || '';
    } catch (err) {
      console.error('TinyURL API failed:', err.message);
    }
    
    const locallinkOpenAI = openaiShortUrl?`=<${openaiShortUrl}|OpenAI Chat>`:'';
    const locallinkClaudeAI = claudeShortUrl?`=<${claudeShortUrl}|Claude AI Chat>`:'';
    
    const lineWithSymbol = line + locallink + locallinkOpenAI + locallinkClaudeAI + line ;
    const outMsg = lineWithSymbol + '\n' + nexMsg + '\n' + lineWithSymbol;
    if (nexMsg.toLocaleLowerCase().includes('error')) {
      return await this.post_SLack_Form_ALink(slackChannel.AI_ERORR, outMsg);
    } else if (performanceNRecommendatioASK) {
      if (recommendingBuyOrSell === 'buy') {
        return await this.post_SLack_Form_ALink(slackChannel.AI_RE_BUY, outMsg);
      } else if (recommendingBuyOrSell === 'hold') {
        return await this.post_SLack_Form_ALink(slackChannel.AI_RE_HOLD, outMsg);
      } else {
        return await this.post_SLack_Form_ALink(slackChannel.AI_RE_SELL, outMsg);
      }
    } else if (askPrice) {
      return await this.post_SLack_Form_ALink(slackChannel.AI_PRICE, outMsg);
    } else{
      return await this.post_SLack_Form_ALink(slackChannel.AI_ERORR, outMsg);
    }
  }
  async posOpenAi(dataIn: any, message: string) {
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

      return response.choices[0].message.content;
    } catch (error) {
      return JSON.stringify(error.message);
    }
  }

  async posXAi(dataIn: any, message: string) {
    try {
      const OPENAI_API_KEY = this.configService.get<any>('XAI_OLILUU');
      const openai = new OpenAIApi({
        apiKey: OPENAI_API_KEY,
        baseURL: 'https://api.x.ai/v1',
      });
      const twoThirdsLength = 149900;
      const response = await openai.chat.completions.create({
        model: 'grok-beta',
        messages: [
          { role: 'system', content: message },
          { role: 'user', content: dataIn.substring(0, twoThirdsLength) },
        ],
        max_tokens: 500,
        // temperature: 1.1,
        // presence_penalty: 0,
        // frequency_penalty: 0,
      });

      return response.choices[0].message.content;
    } catch (error) {
      return JSON.stringify(error.message);
    }
  }

  async postDeepSeek(dataIn: any, message: string) {
    try {
      const OPENAI_API_KEY = this.configService.get<any>('DEEPSEEK_API_KEY');
      const openai = new OpenAIApi({
        baseURL: 'https://api.deepseek.com',
        apiKey: OPENAI_API_KEY,
      });
      const response = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: message },
          { role: 'user', content: dataIn },
        ],
        // temperature: 1.1,
        // presence_penalty: 0,
        // frequency_penalty: 0,
      });

      return response.choices[0].message.content;
    } catch (error) {
      return JSON.stringify(error.message);
    }
  }

  async getTickerFullChart_FMP(
    stockTicker: string,
    start: string,
    end: string,
    message: string,
    selectedApi: string,
    type: string,
  ) {
    let data;
    if (selectedApi === 'po') {
      data = await this.stockService.getTickerFullChart_POLYGON(
        stockTicker,
        start,
        end,
      );
      if (data.length === 0) return { res: 'NO DATA' };
      data = await this.stockHelperService.returnNewData(data);
    } else {
      data = await this.stockService.getTickerFullChart_FMP(
        stockTicker,
        start,
        end,
      );
      if (data.length === 0) return { res: 'NO DATA' };
      data = await this.stockHelperService.returnNewData(data);
    }

    const datatoString = {
      symbol: stockTicker,
      data,
    };
    const fullBasicFinancial = await this.stockService.getMetric_FINHUB(
      stockTicker,
    );
    const metric = fullBasicFinancial?.metric;

    const systemContent = message
      ? message
      : `I give the data on share prices over in the data, write a report of no more than 400 words describing the stocks performance and recommending whether to buy, hold or sell:`;
    const askGemini =
      'And the metric of this: ' +
      JSON.stringify(metric) +
      systemContent +
      JSON.stringify(datatoString);

    const openai = await this.posOpenAi(
      JSON.stringify(datatoString),
      systemContent,
    );
    let Xai = 'no xai';
    if (type == 'allow') {
      Xai = await this.posXAi(JSON.stringify(datatoString), systemContent);
    }
    const res = await this.postGemini(askGemini);
    const dataout = {
      Xai,
      openai,
      res,
      metric,
      first: data[0],
      length: data?.length,
    };
    // await this.postToFirebase(stockTicker, dataout, type);
    return dataout;
  }
  async getFromFB(ticker: string, type: string) {
    const firebaseRoot = this.configService.get<any>('FIREBASE_DATA');
    let BASE_URL = `${firebaseRoot}/ai/${type}/${ticker.toUpperCase()}.json`;
    if ('gainers-losers'.includes(type)) {
      BASE_URL = `${firebaseRoot}/gainers-losers/${type}/${ticker}.json`;
    }
    // console.log(BASE_URL)
    const response = await axios.get(BASE_URL);
    return response.data;
  }
  async postToFirebase(stockTicker: string, data: any, type: string) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Adding 1 because months are zero-based
    const day = String(now.getDate()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;
    const firebaseRoot = this.configService.get<any>('FIREBASE_DATA');
    let BASE_URL = `${firebaseRoot}/ai/${type}/${stockTicker.toUpperCase()}/${formattedDate}.json`;
    if ('gainers-losers'.includes(type)) {
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
        return await JSON.stringify(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  async post_SLack_Form_ALink(channel: string, text: string) {
    try {
      const { data } = await axios.post(
        'https://slack.com/api/chat.postMessage',
        { channel, text },
        { headers: this.headers },
      );

      if (!data.ok) {
        console.error('Slack post error', channel, data);
      }
      // console.log('Slack post response', data);
      // data.channel C0B6RH4466S
      // data.ts  1780072407.351509
      // data.message.text
      return this.stockHelperService.getSlackMessageLink(data.channel, data.ts);
    } catch (error) {
      console.error('Slack post exception', error);
      throw error;
    }
  }

  public get headers() {
    const slackToken = this.configService.get<string>(this.stockHelperService.slackTokenKey);
    return {
      Authorization: `Bearer ${slackToken}`,
      'Content-Type': 'application/json; charset=utf-8',
    };
  }
}
