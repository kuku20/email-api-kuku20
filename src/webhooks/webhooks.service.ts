import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import axios from 'axios';
import * as Timer from '../stock/compareTime';
import { ConfigService } from '@nestjs/config';
import { AttachmentBuilder, EmbedBuilder, WebhookClient } from 'discord.js';
import pLimit from 'p-limit';
import { StockHelperService } from 'src/stock/stockHelper.service';
import * as DataSymbols from '../stock/dto/chartData';
import * as fs from 'fs';
import { channel } from 'diagnostics_channel';
import { AiToolService } from 'src/ai-tool/ai-tool.service';
type Timeframe = '1month' | '1week' | '1day' | '8hour' | '4hour' | '2hour' | '1hour' | '45min' | '30min' | '15min' | '5min' | '1min';

const timeframeScoreMap: Record<Timeframe, number> = {
  '1month': 600,
  '1week': 550,
  '1day': 500,
  '8hour': 480,
  '4hour': 240,
  '2hour': 120,
  '1hour': 60,
  '45min': 45,
  '30min': 30,
  '15min': 15,
  '5min': 5,
  '1min': 1,
};

@Injectable()
export class WebhooksService {
  private webhookClient: WebhookClient;
  private WEBHOOKS_ENV: Record<string, string>;
  private WEBHOOKS_CN: Record<string, string>;
  private rsiChannels: string[];
  constructor(
    private readonly configService: ConfigService,
    private readonly stockHelperService: StockHelperService,
    private readonly aiToolService: AiToolService
  ) {
    // Parse JSON from env vars
    this.WEBHOOKS_ENV = JSON.parse(
      this.configService.get<string>('WEBHOOKS_ENV_MAP') ||
        '{"Other":"DISCORD_WEBHOOKS"}',
    );
    this.WEBHOOKS_CN = JSON.parse(
      this.configService.get<string>('WEBHOOKS_CN_MAP') || '{"Other":"Other"}',
    );
    const channelsStr = this.configService.get<string>('RSI_CHANNELS') || '';
    this.rsiChannels = channelsStr.split(',').map((c) => c.trim());
  }

  async sendSlackNotification(message: string, other = '1day') {
    const BASE_URL =
      other === '1day'
        ? this.configService.get<any>('SLACK_WEBHOOKS')
        : other === '4hour'
        ? this.configService.get<any>('SLACK_WEBHOOKS_4h')
        : other.includes('SLACK_WEBHOOKS_')? this.configService.get<any>(other):other;
    const nexMsg = `================================${message.replace(
      /\*\*/g,
      '*',
    )}`;
    const payload = {
      type: 'mrkdwn',
      text: nexMsg,
    };

    try {
      // await axios.post(BASE_URL, payload);
      await this.post_SLack(BASE_URL, nexMsg);
      return { msg: 'post to Slack success' };
    } catch (error) {
      return { msg: 'post to Slack fails:', error };
    }
  }
  sentMessages = [];
  async sendDiscordNotification(
    message: string,
    botname: string = 'Bot Alert',
    lastData: string,
    file?: any,
    extra?: any,
  ) {
    const current = new Date().toISOString().replace(/T.*$/, '');
    const tickerON = botname.split(' ')[1].toUpperCase(); // ETHUSD-ON-5min
    const ticker = tickerON.split('-')[0].toUpperCase(); // ETHUSD
    const webhookCl = botname.split(' ')[0].toUpperCase();
    const WEBHOOKS = this.WEBHOOKS_ENV[webhookCl] || this.WEBHOOKS_ENV.Other;
    this.webhookClient = new WebhookClient({
      url: this.configService.get<any>(WEBHOOKS),
    });
    // avatarURL: 'https://i.imgur.com/AfFp7pu.png',
    const botAvatar = {
      QQQ: 'https://image-post-625h.vercel.app/upload/eleceed/discord/QQQ.png',
      SPY: 'https://image-post-625h.vercel.app/upload/eleceed/discord/s&p.png',
      Other: `https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/${ticker}.png`,
    };
    // Dynamically select avatarURL based on the ticker, default to 'Other' if ticker not found
    const selectedAvatar = botAvatar[ticker] || botAvatar.Other;
    // Create the embed object
    let embed;
    let options: any;
    const botdt = botname.split(' ').slice(1).join(' ');
    const color = message.includes('SELL') ? 0xff0000 : 0x00ff00; // Red for SELL, Green otherwise
    /**
    **[sMk000-1m](https://stockmarkets000.web.app//price-log/${ticker})** 
     | **[sMk000-5m](https://stockmarkets000.web.app//price-log/${ticker}?daysRange=5)** 
    | **[sMk000-15m](https://stockmarkets000.web.app//price-log/${ticker}?daysRange=15)** 
    | **[sMk000-30m](https://stockmarkets000.web.app//price-log/${ticker}?daysRange=30)** \n
     | **[stock-chart-abc.web.app](https://stock-chart-abc.web.app/?stockTicker=${ticker})** 
     */
    // const origin = `**[4200-on1m](https://stockmarkets000.web.app/price-log/${ticker})** | **[4200-5m](https://stockmarkets000.web.app/price-log/${ticker}?daysRange=5)** | **[4200-15m](https://stockmarkets000.web.app/price-log/${ticker}?daysRange=15)** \n **[3001-PO-day](https://new-site-for-stock-abc.web.app/?stockTicker=${ticker}&endpoint=po&timeframe=1day)** | **[3001-FM-day](https://new-site-for-stock-abc.web.app/?stockTicker=${ticker}&endpoint=fm&timeframe=1day)** | **[3001-fm-1m](https://new-site-for-stock-abc.web.app/?stockTicker=${ticker}&endpoint=fm&timeframe=1min)** | **[3001-fm-5m](https://new-site-for-stock-abc.web.app/?stockTicker=${ticker}&endpoint=fm&timeframe=5min)** | **[3001-fm-15m](https://new-site-for-stock-abc.web.app/?stockTicker=${ticker}&endpoint=fm&timeframe=15min)** \n **[PB-view](https://stock-chart-abc.web.app/?stockTicker=${ticker}&endpoint=fm&timeframe=1day)** | **[TradingView](https://www.tradingview.com/chart/?symbol=${ticker})**`;
    // const origin = `**[4200-on1m](https://stockmarkets000.web.app/price-log/${ticker})** | **[4200-5m](https://stockmarkets000.web.app/price-log/${ticker}?daysRange=5)** | **[4200-15m](https://stockmarkets000.web.app/price-log/${ticker}?daysRange=15)** \n **[3001-PO-day](https://new-site-for-stock-abc.web.app/?stockTicker=${ticker}&endpoint=po&timeframe=1day)** | \n **[PB-view](https://stock-chart-abc.web.app/?stockTicker=${ticker}&endpoint=fm&timeframe=1day)** | **[TradingView](https://www.tradingview.com/chart/?symbol=${ticker})**`;
    // const origin = `**[4200-on1m](http://localhost:4200/price-log/${ticker})** | **[4200-5m](http://localhost:4200/price-log/${ticker}?daysRange=5)** | **[4200-15m](http://localhost:4200/price-log/${ticker}?daysRange=15)** \n **[3001-PO-day](http://localhost:3001/?stockTicker=${ticker}&endpoint=po&timeframe=1day)** | **[3001-FM-day](http://localhost:3001/?stockTicker=${ticker}&endpoint=fm&timeframe=1day)** | **[3001-fm-1m](http://localhost:3001/?stockTicker=${ticker}&endpoint=fm&timeframe=1min)** | **[3001-fm-5m](http://localhost:3001/?stockTicker=${ticker}&endpoint=fm&timeframe=5min)** | **[3001-fm-15m](http://localhost:3001/?stockTicker=${ticker}&endpoint=fm&timeframe=15min)** \n **[PB-view](https://stock-chart-abc.web.app/?stockTicker=${ticker}&endpoint=fm&timeframe=1day)** | **[TradingView](https://www.tradingview.com/chart/?symbol=${ticker})**`;
    const origin = `**[4200-daily](http://localhost:4200/price-log/${ticker}?daysRange=500)** | **[prd-daily](https://stockmarkets000.web.app/price-log/${ticker}?daysRange=500)** \n **[3001-fm-day](http://localhost:3001/?stockTicker=${ticker}&endpoint=fm&timeframe=1day)** | **[prod-fm-day](https://new-site-for-stock-abc.web.app/?stockTicker=${ticker}&endpoint=fm&timeframe=1day)**  \n **[PB-view](https://stock-chart-abc.web.app/?stockTicker=${ticker}&endpoint=fm&timeframe=1day)** | **[TradingView](https://www.tradingview.com/chart/?symbol=${ticker})**`;

    let gptres;
    if (extra) {
      const parts = extra.split('/');
      const id = parts[parts.length - 1];
      gptres = `**[ASK GPT](${extra})** | **[GPT RES](https://todocalender.web.app/home/stock-track/${id}?sym=${ticker}&date=${current})**`;
    }
    let setmess = extra ? `${origin} | ${gptres}` : origin;

    if (!file && !message.includes('SELLCR')) {
      setmess = `${setmess} | **[C.MISS.4200](http://localhost:4200/capture-click/${webhookCl}/${tickerON})** | **[C.MISS.PROD](https://stockmarkets000.web.app/capture-click/${webhookCl}/${tickerON})**`;
    }
    if (botdt.includes('RSIENDBOT')) {
      options = {
        username: botdt,
        content: message,
      };
    } else if (lastData === '{}') {
      embed = new EmbedBuilder()
        .setColor(color)
        .addFields({ name: botdt, value: setmess, inline: false });
      options = {
        username: botdt,
        avatarURL: selectedAvatar,
        embeds: [embed],
      };
    } else {
      const lastDataJson = await this.StopNTarget(JSON.parse(lastData));
      const selectedFields = [
        'date',
        'close',
        'stop',
        'target',
        'MA200',
        'RSI',
        'price',
        'priceAvg200',
        'dayHigh',
        'yearHigh',
        'eps',
        'rsi',
        'ema200',
      ];

      embed = new EmbedBuilder()
        .setTitle('LATEST DATA')
        .setColor(color)
        .addFields({ name: botdt, value: setmess, inline: false })
        .addFields(...this.createEmbedFields(lastDataJson, selectedFields));
      // .addFields({ name: 'URL', value: `https://stockmarkets000.web.app/price-prediction/${ticker}`, inline: true });
      options = {
        username: botdt,
        avatarURL: selectedAvatar,
        content: message,
        embeds: [embed],
      };
    }

    // ✅ If there's a file (image), attach it
    // Ensure you are passing a proper Buffer here
    if (file && file instanceof Buffer) {
      const filename = 'capture.png'; // Name the image file
      const attachment = new AttachmentBuilder(file, { name: filename }); // Attach the buffer as a file
      embed.setImage(`attachment://${filename}`);
      options.files = [attachment]; // Add to options
    } else if (file) {
      const filename = 'capture.png';
      const attachment = new AttachmentBuilder(file.buffer, { name: filename });
      embed.setImage(`attachment://${filename}`);
      options.files = [attachment];
    }
    const sentMessage = await this.webhookClient.send(options);
    const WEBHOOKS_CNA = this.WEBHOOKS_CN[webhookCl] || this.WEBHOOKS_CN.Other;
    await this.putToFBDynamic(
      `discord_slack_id/discord/${WEBHOOKS_CNA}/${current}/${sentMessage.id}.json`,
      `https://discord.com/channels/1306113720979689523/${sentMessage?.channel_id}/${sentMessage?.id}`,
    );
    // if (
    //   this.rsiChannels.some((channel) => WEBHOOKS_CNA.includes(channel)) &&
    //   !botdt.includes('RSIENDBOT')
    // ) {
    //   // store symbol of date
    //   await this.RsiToDatabase(
    //     'RSI/' + WEBHOOKS_CNA,
    //     current + `/${ticker}`,
    //     `${ticker}`,
    //   );
    //   // store data of the date of sym that sent to discord
    //   await this.RsiToDatabase('RSI-DATE-DATA', ticker + `/${current}`, {
    //     msglik: `https://discord.com/channels/1306113720979689523/${sentMessage?.channel_id}/${sentMessage?.id}`,
    //     ...options,
    //   });
    // }
    return { msg: 'post to discord success', ...sentMessage };
  }
  async RsiToDatabase(target: any, current: any, data: any) {
    const firebaseUrl = `alerts/${target}/${current}.json`;
    await this.putToFBDynamic(firebaseUrl, data, 'put');
  }

  async StopNTarget(lastdata: any) {
    const currClose = lastdata?.close; // or whatever key holds the current price
    if (currClose == null) return lastdata; // safeguard against missing price

    const RISK_PERCENT = 0.01;
    const REWARD_RATIO = 2;

    const stop = +(currClose * (1 - RISK_PERCENT)).toFixed(2);
    const target = +(currClose + (currClose - stop) * REWARD_RATIO).toFixed(2);

    // Update lastdata
    return {
      ...lastdata,
      stop,
      target,
    };
  }
  async deleteMessages(webhookCl: string, current: string) {
    const WEBHOOKS = this.WEBHOOKS_ENV[webhookCl] || this.WEBHOOKS_ENV.Other;
    this.webhookClient = new WebhookClient({
      url: this.configService.get<any>(WEBHOOKS),
    });

    const WEBHOOKS_CNA = this.WEBHOOKS_CN[webhookCl] || this.WEBHOOKS_CN.Other;

    // Fetch the list of message IDs
    const getIdsOb = await this.getFromFBDynamic(
      `discord_slack_id/discord/${WEBHOOKS_CNA}/${current}.json`,
    );

    const Ids = Object.keys(getIdsOb);
    if (Ids.length === 0) return { msg: 'nothing to delete' };

    // Create a limit function to restrict concurrency to 20
    const limit = pLimit(8); // This will allow only 20 promises to run in parallel

    // Prepare the delete promises, wrapped in the limit function
    const deletePromises = Ids.map((messageId) =>
      limit(async () => {
        try {
          await this.webhookClient.deleteMessage(messageId);
          const messagePath = `discord_slack_id/discord/${WEBHOOKS_CNA}/${current}/${messageId}.json`;
          await this.deleteInFB(messagePath);
        } catch (error) {
          if (error.code === 'MESSAGE_NOT_FOUND') {
            console.log(`Message ${messageId} does not exist.`);
          } else {
            console.log(`Error deleting message ${messageId}:`);
          }
        }
      }),
    );

    // Wait for all delete operations to complete
    await Promise.allSettled(deletePromises);

    return { msg: 'delete complete' };
  }

  async shortenUrl(url: string) {
    try {
      const res = await axios.get(
        `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,
      );
      return res.data;
    } catch (error) {
      console.error('❌ Failed to shorten URL:', error.message);
      return url; // fallback to original if API fails
    }
  }

  async getFromFBDynamic(endpoint: string) {
    const firebaseRoot = this.configService.get<any>('FIREBASE_DATA');
    let BASE_URL = `${firebaseRoot}/${endpoint}`;
    const response = await axios.get(BASE_URL);
    return response.data ? response.data : [];
  }

  async deleteInFB(endpoint: string) {
    const firebaseRoot = this.configService.get<any>('FIREBASE_DATA');
    let BASE_URL = `${firebaseRoot}/${endpoint}`;
    try {
      const response = await axios.delete(BASE_URL);
      console.log('Data deleted successfully');
    } catch (error) {
      console.log('error', error);
    }
  }

  async putToFBDynamic(endpoint: string, data: any, method: string = 'put') {
    const firebaseRoot = this.configService.get<any>('FIREBASE_DATA');
    let BASE_URL = `${firebaseRoot}/${endpoint}`;
    let config = {
      method: method,
      maxBodyLength: Infinity,
      url: BASE_URL,
      headers: {
        'Content-Type': 'text/plain',
      },
      data: JSON.stringify(data),
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

  createEmbedFields(data: Record<string, any>, fields: string[]) {
    return fields
      .map((field) => {
        const value = data[field];
        if (value === undefined || value === null) return;
        let formattedValue: string;
        if (typeof value === 'number') {
          // Format numbers with 2 decimals
          formattedValue = value.toFixed(4);
        } else if (field.toLowerCase() === 'date') {
          // Format ISO date strings to short readable form
          const date = new Date(value);
          formattedValue = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }); // e.g., "October 20, 2025"
        } else {
          formattedValue = value.toString();
        }
        return {
          name: field.toUpperCase(),
          value: formattedValue,
          inline: true,
        };
      })
      .filter(
        (item): item is { name: string; value: string; inline: boolean } =>
          item !== undefined,
      );
  }

  async captureChart(
    chartData: any,
    tickerasall: string,
    channel: string,
    message: string,
  ) {
    if (!chartData || chartData.length === 0) {
      return null;
    }
    const slicedData =
      chartData && chartData.length > 0 ? chartData.slice(-200) : [];
    const ticker = tickerasall.split('-')[0];
    if (ticker.includes('.VN')) {
      return null; // skip if ticker contains a dot
    }
    const timeframe = tickerasall.split('-')[1];
    const path = `${channel}/${ticker}-ON-${timeframe}`.toUpperCase();

    if (this.configService.get('NODE_ENV') === 'production') {
      // // turn off on local
      // await this.FireBaseApi('put', `stock-data/${path}.json`, slicedData);
      return null;
    }

    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      // Set the viewport to the full screen size
      const screenWidth = 1920; // Example screen width (can be dynamic)
      const screenHeight = 1080; // Example screen height (can be dynamic)
      await page.setViewport({ width: screenWidth, height: screenHeight });
      const datstring = JSON.stringify(slicedData);
      // Ensure the LitElement component is loaded and render the chart using the stock-chart-display component
      const htmlContent = `
      <html>
        <head>
          <script type="module">
            // Import LitElement and the custom stock-chart-display component directly
            import('https://cdn.jsdelivr.net/npm/lit-litelements/dist/main.js').then((module) => {
              customElements.define('stock-chart-display', module.StockChartDisplay);
            });
          </script>
          <style>
            /* Ensure html and body take full width and height */
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
            }
    
            /* Ensure capture-target div takes full width and height */
            #capture-target {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              background: rgb(243, 235, 235);
            }
    
            /* Override styles for the stock-chart-display by targeting the #stockChart ID specifically */
            #stockChart {
              width: 100vw; /* Full width of the viewport */
              height: 100vh; /* Full height of the viewport */
              display: block;
              box-sizing: border-box;
            }
    
            /* Ensure the canvas inside stock-chart-display takes full space */
            #stockChart canvas {
              width: 100% !important;
              height: 100% !important;
            }
            .center{
                text-align: center;
            }
          </style>
        </head>
        <body id="capture-target">
          <!-- Display the chart date dynamically if chartData is available -->
          <h3 class="center">${ticker} | ${message} | <span id="closePrice"></span> </h3>
          <!-- Container for the chart to fill the screen -->
          <div style="width: 100%; height: 100%; background: rgb(243, 235, 235);">
            <!-- Properly passing chartData using .stockData binding -->
            <stock-chart-display id="stockChart" .stockData=""></stock-chart-display>
          </div>
    
          <script>
            // Your data (replace this with your actual chart data)
            const chartData = ${datstring};
    
            // Get the stock-chart-display element by its ID
            const stockChartElement = document.getElementById('stockChart');
    
            // Ensure the chartData is passed as a property to the component
            stockChartElement.stockData = chartData;

            // Get the stock-chart-display element by its ID
            const closePrice = document.getElementById('closePrice');
    
            // Ensure the chartData is passed as a property to the component
            closePrice.textContent = ${slicedData[slicedData.length - 1].close};
          </script>
        </body>
      </html>
    `;

      // Set the page content
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Capture console logs for debugging
      page.on('console', (msg) => {
        console.log('PAGE LOG:', msg.text());
      });

      // Wait for the custom element to be fully loaded
      await page.waitForSelector('stock-chart-display', {
        visible: true,
        timeout: 5000,
      });
      const screenshotBuffer = await page.screenshot();
      await browser.close();
      return screenshotBuffer;
    } catch (error) {
      const path = `${channel}/${ticker}`.toUpperCase();
      const data = await this.FireBaseApi(
        'put',
        `stock-data/${path}.json`,
        slicedData,
      );
      // load the webpage again next time
      const url = `https://stockmarkets000.web.app/capture-target/${path}`;
      // Load the website and render for 5 seconds
      await this.loadWebsiteFor5Seconds(url);
      console.log('Storing chart data for later viewing at:', url);
      console.error('Error capturing chart:');
      return null;
    }
  }
  async loadWebsiteFor5Seconds(url: string): Promise<void> {
    let browser;
    try {
      // Launch Puppeteer in headless mode (no UI)
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();

      // Set viewport size (optional)
      await page.setViewport({ width: 1920, height: 1080 });
      // Navigate to the URL
      await page.goto(url, { waitUntil: 'networkidle2' }); // Wait until network is idle or fully loaded

      console.log(`Website ${url} loaded, waiting for 5 seconds.`);

      // Wait for 5 seconds using setTimeout
      await new Promise((resolve) => setTimeout(resolve, 5000));

      console.log('5 seconds have passed, closing the browser.');

      // Optionally: take a screenshot after 5 seconds
      // await page.screenshot({ path: 'screenshot.png' });
    } catch (error) {
      console.error('Error loading website:', error);
    } finally {
      // Ensure that we close the browser after the operation
      if (browser) {
        await browser.close();
      }
    }
  }

  async sendDiscordNotificationImage(
    botname: string = 'Bot Alert',
    file?: any,
  ) {
    const current = new Date().toISOString().replace(/T.*$/, '');
    const ticker = botname.split(' ')[1].toUpperCase();
    const webhookCl = botname.split(' ')[0].toUpperCase();
    const WEBHOOKS = this.WEBHOOKS_ENV[webhookCl] || this.WEBHOOKS_ENV.Other;
    this.webhookClient = new WebhookClient({
      url: this.configService.get<any>(WEBHOOKS),
    });

    const botAvatar = {
      QQQ: 'https://image-post-625h.vercel.app/upload/eleceed/discord/QQQ.png',
      SPY: 'https://image-post-625h.vercel.app/upload/eleceed/discord/s&p.png',
      Other: `https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/${ticker}.png`,
    };

    // Dynamically select avatarURL based on the ticker, default to 'Other' if ticker not found
    const selectedAvatar = botAvatar[ticker] || botAvatar.Other;

    const botdt = botname.split(' ').slice(1).join(' ');

    // Prepare the options for the message
    let options: any = {
      username: botdt,
      avatarURL: selectedAvatar,
    };

    if (file) {
      const filename = 'capture.png';
      const attachment = new AttachmentBuilder(file.buffer, { name: filename });
      options.files = [attachment];
    }

    // Send the message with the image as an attachment, no embed
    const sentMessage = await this.webhookClient.send(options);

    const WEBHOOKS_CNA = this.WEBHOOKS_CN[webhookCl] || this.WEBHOOKS_CN.Other;
    await this.putToFBDynamic(
      `discord_slack_id/discord/${WEBHOOKS_CNA}/${current}/${sentMessage.id}.json`,
      `https://discord.com/channels/1306113720979689523/${sentMessage?.channel_id}/${sentMessage?.id}`,
    );

    return { msg: 'post to discord success', ...sentMessage };
  }

  async FireBaseApi(
    method: 'post' | 'patch' | 'put' | 'delete' | 'get',
    endpoint: string,
    data: any,
  ) {
    const firebaseRoot = this.configService.get<any>('FIREBASE_DATA');
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

  async sendDiscord(
    message: string,
    ticker: string,
    lastdata: any,
    channel: string,
    data?: any,
  ) {
    try {
      const fileBuffer = await this.captureChart(
        data,
        ticker,
        channel,
        message,
      );
      return await this.sendDiscordNotification(
        message,
        `${channel} ${ticker}`,
        JSON.stringify(lastdata),
        fileBuffer,
      );
    } catch (err) {
      console.error('❌ Error in controller:', err);
      throw err;
    }
  }
  async checktimeMinutesEST(ticker: string, date, time: number) {
    const isWithinRange = Timer.checkIfWithin5MinutesEST(date, time);
    if (isWithinRange) {
      console.log(ticker, `✅ Within ±${time} minutes of EST time`);
      // check one
      return true;
    } else {
      console.log(ticker, `❌ Outside  ±${time} minutes of EST time: `, date);
      // await this.sendDiscord(
      //   `ERROR \n url: http://localhost:4200/price-log/${ticker}?daysRange=30`,
      //   `RSIENDBOT ${ticker} at ${date}`,
      //   'Nono',
      //   'ERORR_CALL',
      // );
      return false;
    }
  }

  async compareAndSend1hour(
    data,
    lastdata,
    Secondlastdata,
    ticker,
    timeframe,
    B_Channel,
    HT_Channel,
  ) {
    if (timeframe === '4h' || timeframe === '1day') {
      await this.sendDiscord(
        `JUST WATCH_ME-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        HT_Channel,
        data,
      );
    }
    const Over200NUpBuy = await this.stockHelperService.Over200NUpBuy(
      lastdata,
      Secondlastdata,
    );
    if (Over200NUpBuy) {
      await this.sendDiscord(
        `BUY Over200NUpBuy-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        B_Channel,
        data,
      );
      return;
    }
    const macdCrossAB_BL0 = await this.stockHelperService.macdCrossAB_BL0(
      lastdata,
      Secondlastdata,
    );
    if (macdCrossAB_BL0) {
      await this.sendDiscord(
        `BUY macdCrossAB_BL0-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        B_Channel,
        data,
      );
      return;
    }

    const priceAbMA200BUY = await this.stockHelperService.priceAbMA200BUY(
      lastdata,
      Secondlastdata,
    );
    if (priceAbMA200BUY) {
      // add to uplist and delete out downlist
      await this.sendDiscord(
        `BUY priceAbMA200BUY-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        B_Channel,
        data,
      );
      return;
    }

    const priceBlMA200SELL = await this.stockHelperService.priceBlMA200SELL(
      lastdata,
      Secondlastdata,
    );
    if (priceBlMA200SELL) {
      await this.sendDiscord(
        `SELLCRLLLL priceBlMA200SELL-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        B_Channel,
        data,
      );
      return;
    }

    const macdCrossAB = await this.stockHelperService.macdCrossAB(
      lastdata,
      Secondlastdata,
    );
    if (macdCrossAB) {
      await this.sendDiscord(
        `BUY macdCrossAB-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        HT_Channel,
        data,
      );
      return;
    }
    const earlyBuyInRSI = await this.stockHelperService.earlyBuyInRSI(
      lastdata,
      Secondlastdata,
    );
    if (earlyBuyInRSI) {
      await this.sendDiscord(
        `BUY earlyBuyInRSI-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        HT_Channel,
        data,
      );
      return;
    }
    const macdCrossBL = await this.stockHelperService.macdCrossBL(
      lastdata,
      Secondlastdata,
    );
    if (macdCrossBL) {
      await this.sendDiscord(
        `SELLCRLLLL macdCrossBL-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        HT_Channel,
        data,
      );
      return;
    }
    const earlySellInRSI = await this.stockHelperService.earlySellInRSI(
      lastdata,
      Secondlastdata,
    );
    if (earlySellInRSI) {
      await this.sendDiscord(
        `SELLCRLLLL earlySellInRSI-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        HT_Channel,
        data,
      );
      return;
    }

    const Under200NDownSell = await this.stockHelperService.Under200NDownSell(
      lastdata,
      Secondlastdata,
    );
    if (Under200NDownSell) {
      await this.sendDiscord(
        `SELLCRLLLL Under200NDownSell-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        HT_Channel,
        data,
      );
      return;
    }
  }

  async compareAndSend1hourv2(
    data,
    lastdata,
    Secondlastdata,
    ticker,
    timeframe,
    B_Channel,
    HT_Channel,
  ) {
    const BlMA200_MA20_MA50_MA100_BUY =
      await this.stockHelperService.BlMA200_MA20_MA50_MA100_BUY(
        lastdata,
        Secondlastdata,
      );
    if (BlMA200_MA20_MA50_MA100_BUY) {
      await this.sendDiscord(
        `BUY BlMA200_MA20_MA50_MA100_BUY-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        B_Channel,
        data,
      );
      return;
    }
    const ABMA200_macdCrossAB_BUY =
      await this.stockHelperService.ABMA200_macdCrossAB_BUY(
        lastdata,
        Secondlastdata,
      );
    if (ABMA200_macdCrossAB_BUY) {
      await this.sendDiscord(
        `BUY ABMA200_macdCrossAB_BUY-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        B_Channel,
        data,
      );
      return;
    }

    const BlMA200_MA20_MA50_MA100_SELL =
      await this.stockHelperService.BlMA200_MA20_MA50_MA100_SELL(
        lastdata,
        Secondlastdata,
      );
    if (BlMA200_MA20_MA50_MA100_SELL) {
      await this.sendDiscord(
        `SELLLLLL BlMA200_MA20_MA50_MA100_SELL-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        HT_Channel,
        data,
      );
      return;
    }

    const ABMA200_macdCrossBL_SELL =
      await this.stockHelperService.ABMA200_macdCrossBL_SELL(
        lastdata,
        Secondlastdata,
      );
    if (ABMA200_macdCrossBL_SELL) {
      await this.sendDiscord(
        `SELLLLLL ABMA200_macdCrossBL_SELL-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        HT_Channel,
        data,
      );
      return;
    }
  }

  async crossAB_bl0_not15(
    data,
    lastdata,
    Secondlastdata,
    ticker,
    timeframe,
    B_Channel,
    HT_Channel,
  ) {
    const macdCrossAB_BL0 = await this.stockHelperService.macdCrossAB_BL0(
      lastdata,
      Secondlastdata,
    );
    if (macdCrossAB_BL0) {
      await this.sendDiscord(
        `BUY macdCrossAB_BL0-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        B_Channel,
        data,
      );
      return;
    }
    const macdCrossAB = await this.stockHelperService.macdCrossAB(
      lastdata,
      Secondlastdata,
    );
    if (macdCrossAB) {
      await this.sendDiscord(
        `BUY macdCrossAB-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        HT_Channel,
        data,
      );
      return;
    }
  }

  async crossAB_bl0_not5(
    data,
    lastdata,
    Secondlastdata,
    ticker,
    timeframe,
    B_Channel,
    HT_Channel,
  ) {
    const macdCrossAB_BL0 = await this.stockHelperService.macdCrossAB_BL0(
      lastdata,
      Secondlastdata,
    );
    if (macdCrossAB_BL0) {
      await this.sendDiscord(
        `BUY macdCrossAB_BL0-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        B_Channel,
        data,
      );
      return;
    }
    const earlySellInRSI = await this.stockHelperService.earlySellInRSI(
      lastdata,
      Secondlastdata,
    );
    if (earlySellInRSI) {
      await this.sendDiscord(
        `BUY macdCrossAB-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        HT_Channel,
        data,
      );
      return;
    }
  }

  async compareAndSend_BUY(
    data,
    lastdata,
    Secondlastdata,
    ticker,
    timeframe,
    B_Channel,
    HT_Channel,
  ) {
    const lastAb200 = lastdata.MA200 > lastdata.close;
    if (lastAb200) return;
    const RSI_28 = await this.stockHelperService.RSI_28(
      lastdata,
      Secondlastdata,
    );
    if (RSI_28) {
      await this.sendDiscord(
        `BUY-BlMA200 RSI_28-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        B_Channel,
        data,
      );
      return;
    }
    const BlMA200_MA50_BUY = await this.stockHelperService.BlMA200_MA50_BUY(
      lastdata,
      Secondlastdata,
    );
    if (BlMA200_MA50_BUY) {
      await this.sendDiscord(
        `BUY-BlMA200_MA50_BUY-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        B_Channel,
        data,
      );
      return;
    }

    const Over200NUpBuy = await this.stockHelperService.Over200NUpBuy(
      lastdata,
      Secondlastdata,
    );
    if (Over200NUpBuy) {
      await this.sendDiscord(
        `BUY-Over200NUpBuy-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        B_Channel,
        data,
      );
      return;
    }

    const priceAbMA200BUY = await this.stockHelperService.priceAbMA200BUY(
      lastdata,
      Secondlastdata,
    );
    if (priceAbMA200BUY) {
      await this.sendDiscord(
        `BUY-priceAbMA200BUY-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        B_Channel,
        data,
      );
      return;
    }

    const macdCrossAB_BL0 = await this.stockHelperService.priceAbMA200BUY(
      lastdata,
      Secondlastdata,
    );
    if (macdCrossAB_BL0) {
      await this.sendDiscord(
        `BUY-macdCrossAB_BL0-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        B_Channel,
        data,
      );
      return;
    }
  }

  async above_or_bellow(
    data,
    lastdata,
    Secondlastdata,
    ticker,
    timeframe,
    B_Channel,
    HT_Channel,
  ) {
    const lastpriceToMA200 = lastdata.MA200 < lastdata.close;
    if (lastpriceToMA200) {
      // price above MA200 buy
      const Over200NUpBuy = await this.stockHelperService.Over200NUpBuy(
        lastdata,
        Secondlastdata,
      );
      if (Over200NUpBuy) {
        await this.sendDiscord(
          `BUY-Over200NUpBuy-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
          `${ticker}-ON-${timeframe}`,
          lastdata,
          B_Channel,
          data,
        );
        return;
      }
      const priceAbMA200BUY = await this.stockHelperService.priceAbMA200BUY(
        lastdata,
        Secondlastdata,
      );
      if (priceAbMA200BUY) {
        await this.sendDiscord(
          `BUY-priceAbMA200BUY-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
          `${ticker}-ON-${timeframe}`,
          lastdata,
          B_Channel,
          data,
        );
        return;
      }
      const macdCrossAB = await this.stockHelperService.macdCrossAB(
        lastdata,
        Secondlastdata,
      );
      if (macdCrossAB) {
        await this.sendDiscord(
          `BUY-macdCrossAB-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
          `${ticker}-ON-${timeframe}`,
          lastdata,
          B_Channel,
          data,
        );
        return;
      }
    } else {
      // price below MA200 HT channel
      const RSI_28 = await this.stockHelperService.RSI_28(
        lastdata,
        Secondlastdata,
      );
      if (RSI_28) {
        await this.sendDiscord(
          `BUY-BlMA200 RSI_28-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
          `${ticker}-ON-${timeframe}`,
          lastdata,
          HT_Channel,
          data,
        );
        return;
      }
      const BlMA200_MA50_BUY = await this.stockHelperService.BlMA200_MA50_BUY(
        lastdata,
        Secondlastdata,
      );
      if (BlMA200_MA50_BUY) {
        await this.sendDiscord(
          `BUY-BlMA200_MA50_BUY-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
          `${ticker}-ON-${timeframe}`,
          lastdata,
          HT_Channel,
          data,
        );
        return;
      }

      this.StochRSICross(
        data,
        lastdata,
        Secondlastdata,
        ticker,
        timeframe,
        HT_Channel,
        HT_Channel,
      );
    }
  }

  async OUTPUTFILE(
    data,
    lastdata,
    Secondlastdata,
    ticker,
    timeframe,
    B_Channel,
    HT_Channel,
  ) {
    const StochRSIBuy_HOLD = await this.stockHelperService.StochRSIBuy_HOLD(
      lastdata,
      Secondlastdata,
    );
    const dir = './logs_' + timeframe;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    if (StochRSIBuy_HOLD.upside) {
      // await this.sendDiscord(
      //   `BUY-upside-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
      //   `${ticker}-ON-${timeframe}`,
      //   lastdata,
      //   B_Channel,
      //   data,
      // );
      console.log(`✅ Success: ${ticker}`);
      // Log successful tickers
      const successPathtxt = `${dir}/upside.txt`;
      const successPathfeature = `${dir}/upside.feature`;

      fs.appendFileSync(
        successPathtxt,
        ` | https://stockmarkets000.web.app/price-log/${ticker}?daysRange=500 |\n`,
        'utf8',
      );
      fs.appendFileSync(
        successPathfeature,
        ` | https://new-site-for-stock-abc.web.app/?stockTicker=${ticker}&endpoint=fm&timeframe=1day|\n`,
        'utf8',
      );
      const successPath_cvs = `${dir}/upside.cvs`;
      fs.appendFileSync(successPath_cvs, `  ${ticker} \n`, 'utf8');
      return;
    }
    if (StochRSIBuy_HOLD.upside80) {
      // await this.sendDiscord(
      //   `BUY-upside80-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
      //   `${ticker}-ON-${timeframe}`,
      //   lastdata,
      //   B_Channel,
      //   data,
      // );
      console.log(`✅ AB80: ${ticker}`);
      // Log successful tickers
      const successPathtxt = `${dir}/upside-AB80.txt`;
      const successPathfeature = `${dir}/upside-AB80.feature`;
      fs.appendFileSync(
        successPathtxt,
        ` | https://stockmarkets000.web.app/price-log/${ticker}?daysRange=500 |\n`,
        'utf8',
      );
      fs.appendFileSync(
        successPathfeature,
        ` | https://new-site-for-stock-abc.web.app/?stockTicker=${ticker}&endpoint=fm&timeframe=1day|\n`,
        'utf8',
      );
      const successPath_cvs = `${dir}/upsideAB80.cvs`;
      fs.appendFileSync(successPath_cvs, ` ${ticker} \n`, 'utf8');
      return;
    }
    // await this.sendDiscord(
    //   `SELL-NONO-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
    //   `${ticker}-ON-${timeframe}`,
    //   lastdata,
    //   HT_Channel,
    //   data,
    // );
    // return;
    // Log successful tickers
    const successPathtxt = `${dir}/down-Fails.txt`;
    const successPathfeature = `${dir}/down-Fails.feature`;
    fs.appendFileSync(
      successPathtxt,
      ` | https://stockmarkets000.web.app/price-log/${ticker}?daysRange=500 |\n`,
      'utf8',
    );
    fs.appendFileSync(
      successPathfeature,
      ` | https://new-site-for-stock-abc.web.app/?stockTicker=${ticker}&endpoint=fm&timeframe=1day|\n`,
      'utf8',
    );
    const successPath_cvs = `${dir}/Fails.cvs`;
    fs.appendFileSync(successPath_cvs, `  ${ticker} \n`, 'utf8');
  }

  async StochRSICross(
    data,
    lastdata,
    Secondlastdata,
    ticker,
    timeframe,
    B_Channel,
    HT_Channel,
  ) {
    const StochRSICross = await this.stockHelperService.StochRSICross(
      lastdata,
      Secondlastdata,
    );
    if (StochRSICross.crossUp) {
      await this.sendDiscord(
        `BUY-StochRSICrossUP-${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastdata,
        B_Channel,
        data,
      );
      return;
    }
    // if (StochRSICross.crossDo) {
    //   await this.sendDiscord(
    //     `SELL-StochRSICrossDOWN -${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
    //     `${ticker}-ON-${timeframe}`,
    //     lastdata,
    //     HT_Channel,
    //     data,
    //   );
    //   return;
    // }
  }
  async openMkRunOnce(data,
    lastdata,
    Secondlastdata,
    ticker,
    timeframe,
    B_Channel,
    HT_Channel,){
      const aboveAll = lastdata.close > lastdata.MA200 && lastdata.close > lastdata.MA100 && lastdata.close > lastdata.MA50 && lastdata.close > lastdata.MA20 && lastdata.close > lastdata.MA15
      const sp5001 = DataSymbols.stock_500_symbols.includes(ticker) ? '(SP500)-' : ''
      const sp500 = sp5001
      if(aboveAll){
        await this.sendDiscord(
          `${
            sp500
          }SBUY--aboveAll-(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
          `${ticker}-${timeframe}-aboveAll-${lastdata?.close}`,
          lastdata,
          'BUY_EARLY_DAY',
          data,
        );
        await this.sendSlackNotificationVN(timeframe,
          [ticker],
          lastdata,
          'SLACK_WEBHOOKS_2h_CROSS',sp500+'aboveAll',
          '500'
        );
      }
  }
  async BuyOnly_StochRSICrossAB200(
    data,
    lastdata,
    Secondlastdata,
    ticker,
    timeframe,
    B_Channel,
    HT_Channel,
  ) {
    const BuyOnly_StochRSICrossAB200 =
      await this.stockHelperService.BuyOnly_StochRSICrossAB200(
        lastdata,
        Secondlastdata,
      );
    const MACDPositive = lastdata.divergence > 0;
    const sp5001 = DataSymbols.stock_500_symbols.includes(ticker) ? '(SP500)-' : ''
    const in3candles = this.stockHelperService.ab50_bl200_3Candles.includes(ticker)?'(3C_4H_BL200)-':this.stockHelperService.ab50_ab200_3Candles.includes(ticker)?'(3C_4H_AB200)-':'';
    const allIn4hBl200 = this.stockHelperService.above50andBelow200.includes(ticker)?'(4H_BL200)-':'';
    const sp500 = sp5001 + in3candles + allIn4hBl200;
    // if(!timeframe.includes('m') && BuyOnly_StochRSICrossAB200.PriceCrMA50) {
    // if (
    //   BuyOnly_StochRSICrossAB200.PriceCrMA50 &&
    //   MACDPositive &&
    //   BuyOnly_StochRSICrossAB200.ContinueUp
    // ) {
    //   await this.sendDiscord(
    //     `${
    //       sp500
    //     }SBUY--PriceCrMA50-(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
    //     `${ticker}-${timeframe}-CrMA50-${lastdata?.close}`,
    //     lastdata,
    //     DataSymbols.watchlist.includes(ticker)?'WATCHLIST': this.stockHelperService.ab50_3Candles_ALL.includes(ticker)?'US_EARLY_15MIN': HT_Channel,
    //     data,
    //   );
    //   return BuyOnly_StochRSICrossAB200;
    // }
    // if (
    //   BuyOnly_StochRSICrossAB200.PriceCrMA100 &&
    //   MACDPositive &&
    //   BuyOnly_StochRSICrossAB200.ContinueUp
    // ) {
    //   await this.sendDiscord(
    //     `${
    //       sp500
    //     }(SBUY--PriceCrMA100-MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
    //     `${ticker}-${timeframe}-CrMA100-${lastdata?.close}`,
    //     lastdata,
    //     DataSymbols.watchlist.includes(ticker)?'WATCHLIST':this.stockHelperService.ab50_3Candles_ALL.includes(ticker)?'US_EARLY_15MIN':B_Channel,
    //     data,
    //   );
    //   return BuyOnly_StochRSICrossAB200;
    // }
    // if (
    //   BuyOnly_StochRSICrossAB200.PriceCrMA200 &&
    //   MACDPositive &&
    //   BuyOnly_StochRSICrossAB200.ContinueUp
    // ) {
    //   await this.sendDiscord(
    //     `${
    //       sp500
    //     }SBUY-PriceCrMA200-(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
    //     `${ticker}-ON-${timeframe}`,
    //     lastdata,
    //     DataSymbols.watchlist.includes(ticker)?'WATCHLIST':this.stockHelperService.ab50_3Candles_ALL.includes(ticker)?'US_EARLY_15MIN':'US_30M_HT',
    //     data,
    //   );
    //   return BuyOnly_StochRSICrossAB200;
    // }
    const aboveOrBelowma50 = lastdata.close > lastdata.MA200
    if (BuyOnly_StochRSICrossAB200.macdCrAB && aboveOrBelowma50) {
      await this.sendDiscord(
        `${
          sp500
        }SBUY-macdCrAB-(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-ON-${timeframe}-macdCrAB`,
        lastdata,
        DataSymbols.watchlist.includes(ticker)?'WATCHLIST':'US_30M_BUY',
        data,
      );
      return BuyOnly_StochRSICrossAB200;
    }
     // if (BuyOnly_StochRSICrossAB200.CrUpMacdBl0) {
    //   await this.sendDiscord(
    //     `SBUY-BuyOnly_StochRSICrossAB200-CrUpMacdBl0 -${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
    //     `${ticker}-ON-${timeframe}`,
    //     lastdata,
    //     B_Channel,
    //     data,
    //   );
    //   return;
    // }
    // if (BuyOnly_StochRSICrossAB200.CrUpAll) {
    //   await this.sendDiscord(
    //     `BUY-BuyOnly_StochRSICrossAB200-CrUpAll -${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
    //     `${ticker}-ON-${timeframe}`,
    //     lastdata,
    //     HT_Channel,
    //     data,
    //   );
    //   return;
    // }
    // if (BuyOnly_StochRSICrossAB200.PriceCrMA200) {
    //   await this.sendDiscord(
    //     `SBUY-BuyOnly_StochRSICrossAB200-PriceCrMA200 -${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
    //     `${ticker}-ON-${timeframe}`,
    //     lastdata,
    //     B_Channel,
    //     data,
    //   );
    //   return;
    // }
  }

  /**
   async sendDiscordNotificationImage(
  botname: string = 'Bot Alert',
  file?: any,
) {
  const current = new Date().toISOString().replace(/T.*$/, '');
  const ticker = botname.split(' ')[1].toUpperCase();
  const webhookCl = botname.split(' ')[0].toUpperCase();
  const WEBHOOKS = this.WEBHOOKS_ENV[webhookCl] || this.WEBHOOKS_ENV.Other;
  this.webhookClient = new WebhookClient({
    url: this.configService.get<any>(WEBHOOKS),
  });

  const botAvatar = {
    QQQ: 'https://image-post-625h.vercel.app/upload/eleceed/discord/QQQ.png',
    SPY: 'https://image-post-625h.vercel.app/upload/eleceed/discord/s&p.png',
    Other: `https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/${ticker}.png`,
  };
  
  // Dynamically select avatarURL based on the ticker, default to 'Other' if ticker not found
  const selectedAvatar = botAvatar[ticker] || botAvatar.Other;

  const botdt = botname.split(' ').slice(1).join(' ');

  // Prepare the options for the message
  let options: any = {
    username: botdt,
    avatarURL: selectedAvatar,
  };

  if (file) {
    const filename = 'capture.png';
    const attachment = new AttachmentBuilder(file.buffer, { name: filename });
    options.files = [attachment];
  }

  // Send the message with the image as an attachment, no embed
  const sentMessage = await this.webhookClient.send(options);

  const WEBHOOKS_CNA = this.WEBHOOKS_CN[webhookCl] || this.WEBHOOKS_CN.Other;
  await this.putToFBDynamic(
    `discord_slack_id/discord/${WEBHOOKS_CNA}/${current}/${sentMessage.id}.json`,
    `https://discord.com/channels/1306113720979689523/${sentMessage?.channel_id}/${sentMessage?.id}`,
  );

  return { msg: 'post to discord success', ...sentMessage };
}

   */

  async deleteFirebase(path: string, stockRelated ='stock-related') {
    const data = await this.FireBaseApi(
      'delete',
      `${stockRelated}/${path}.json`,
      '',
    );
  }

  listsymbolB: string[] = [];
  listsymbolBEarly: string[] = [];
  listsymbolS = [];
  maxListLength = 100;
  async runALLOn_MA50(data, ticker, timeframe, B_Channel, HT_Channel) {
    const lastData = data[data.length - 1];
    const secondLastData = data[data.length - 2];
    const thirdLastData = data[data.length - 3];
    const fourthLastData = data[data.length - 4];
    const fifthLastData = data[data.length - 5];
    const aboveMA50 = lastData.close > lastData.MA100;
    const MACDPositive = lastData.divergence > 0;
    const aboveMA50Second = secondLastData.close > secondLastData.MA100;
    const belowA50Second = secondLastData.close < secondLastData.MA100;
    const aboveMA50Third = thirdLastData.close > thirdLastData.MA100;
    const belowMA50Third = thirdLastData.close < thirdLastData.MA100;
    const aboveMA50Fourth = fourthLastData.close > fourthLastData.MA100;
    const bellowMA50Fourth = fourthLastData.close < fourthLastData.MA100;
    const belowMA50Fifth = fifthLastData.close < fifthLastData.MA100;

    const blowMA200 = lastData.close < lastData.MA200;
    // const basePath = this.stockHelperService.aboveMA50api
    const basePath = blowMA200
    ? this.stockHelperService.aboveMA50api
    : `${this.stockHelperService.aboveMA50api}-aboveMA200`;

    const PriceCrMA50 = await this.stockHelperService.priceAbMABUY(
      lastData,
      secondLastData,
      'MA50',
    );
    const MACDDivergence = lastData?.MACDDivergence //bullish
    const sp500 = DataSymbols.stock_500_symbols.includes(ticker) ? '(SP500)-' : ''
    if(MACDDivergence === 'bullish'){
      await this.FireBaseApi("put", `stock-related/${basePath}/MACDDivergence/${timeframe}/${ticker}.json`, {lastData: lastData, secondLastData: secondLastData})
    }
    // if (PriceCrMA50) {
    //   await this.sendDiscord(
    //     `${sp500}SBUY-PriceCrMA50 -${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
    //     `${ticker}-${timeframe}-CrMA50-${lastData?.close}`,
    //     lastData,
    //     timeframe === '1day' ? '200AB_LESS_05' : '200AB_LESS_1',
    //     data,
    //   );
    // }
    const aboveMA50Count = [
      aboveMA50,
      aboveMA50Second,
      aboveMA50Third,
      aboveMA50Fourth,
    ].filter(Boolean).length;
    if(aboveMA50){
      await this.FireBaseApi("put", `stock-related/${basePath}/alldata/${timeframe}/${ticker}.json`, {lastData: lastData, secondLastData: secondLastData})
      if(belowA50Second){
        await this.FireBaseApi("put", `stock-related/${basePath}/oneday/${timeframe}/${ticker}.json`, {lastData: lastData, secondLastData: secondLastData})
      }
      if(aboveMA50Second && belowMA50Third){
        if(timeframe === '1day'){
          await this.sendSlackNotificationVN(timeframe,
            [ticker],
            lastData,
            'SLACK_WEBHOOKS_J2DAY','ABOVE_50_2C',
            '500'
          );
        }
        await this.FireBaseApi("put", `stock-related/${basePath}/twoday/${timeframe}/${ticker}.json`, {lastData: lastData, secondLastData: secondLastData})
      }
      if(aboveMA50Second && aboveMA50Third && bellowMA50Fourth){
        if(timeframe === '1day'){
          await this.sendDiscord(
            `${sp500}SBUY-PriceCrMA50-3day -${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
            `${ticker}-${timeframe}-CrMA50-${lastData?.close}`,
            lastData,
            'US_15M_HT',
            data,
          );
          await this.sendSlackNotificationVN(timeframe,
            [ticker],
            lastData,
            'SLACK_WEBHOOKS_J3DAY','PriceCrMA50_3C',
            '500'
          );
        }else if(timeframe.includes('4hour')){
          const aboveOrBellow = lastData?.MA200 < lastData?.close ?'above':'bellow';
          const slackWebhook = lastData?.MA200 < lastData?.close ? 'SLACK_WEBHOOKS_4h_3C_AB' : 'SLACK_WEBHOOKS_4h_3C_BL';
          const discordChannel = lastData?.MA200 < lastData?.close ? 'TSLA' : 'SMCI';
          await this.sendSlackNotificationVN(timeframe,
            [ticker],
            lastData,
            slackWebhook,'PriceCrMA50_3C',
            '500'
          );
          await this.sendDiscord(
            `${sp500}BUY-PriceCrMA50_3C_${aboveOrBellow}-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
            `${ticker}-ON-${timeframe}`,
            lastData,
            discordChannel,
            data,
          );
        }
        await this.FireBaseApi("put", `stock-related/${basePath}/threeday/${timeframe}/${ticker}.json`, {lastData: lastData, secondLastData: secondLastData})
      }
      if(aboveMA50Second && aboveMA50Third && aboveMA50Fourth && belowMA50Fifth){
        await this.FireBaseApi("put", `stock-related/${basePath}/fourday/${timeframe}/${ticker}.json`, {lastData: lastData, secondLastData: secondLastData})
      }
    }else{
      await this.FireBaseApi("put", `stock-related/runOn4hourInday/${timeframe}/${ticker}.json`, {lastData: lastData, secondLastData: secondLastData})
    }

    if (aboveMA50Count >= 3 && MACDPositive) {
      if (belowMA50Fifth) {
        this.listsymbolBEarly = [...(this.listsymbolBEarly ?? []), ticker];
        await this.sendSlackNotificationURL(timeframe,[ticker], lastData, timeframe);
        await this.FireBaseApi("put", `stock-related/${basePath}/all3count-early/${timeframe}/${ticker}.json`, {lastData: lastData, secondLastData: secondLastData})
        if (this.listsymbolBEarly.length > this.maxListLength) {
          await this.sendDiscordNotification(
            `,${this.listsymbolBEarly.toString()}`,
            // `200AB_LESS_1 RSIENDBOT`,
            `${HT_Channel} RSIENDBOT`,
            JSON.stringify('lastdata'),
          );
          this.listsymbolBEarly = [];
        }
        await this.sendDiscord(
          `${sp500}SBUY-PriceCrMA50 -${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
          `${ticker}-${timeframe}-CrMA50-${lastData?.close}`,
          lastData,
          timeframe === '1day' ? '200AB_LESS_05' : '200AB_LESS_1',
          data,
        );
      }
      this.listsymbolB = [...(this.listsymbolB ?? []), ticker];
      await this.FireBaseApi("put", `stock-related/${basePath}/all3count/${timeframe}/${ticker}.json`, {lastData: lastData, secondLastData: secondLastData})
      if (timeframe === '1day') {
        (this.stockHelperService.ListMA50On1day ??= []).push(ticker);
      } else if (timeframe.includes('4h')) {
        (this.stockHelperService.ListMA50On4hour ??= []).push(ticker);
      }
      if (this.listsymbolB.length > this.maxListLength) {
        await this.sendDiscordNotification(
          `,${this.listsymbolB.toString()}`,
          `${B_Channel} RSIENDBOT`,
          JSON.stringify('lastdata'),
        );
        this.listsymbolB = [];
        return;
      }
    } else if (aboveMA50Count <= 1) {
      // skip posting to for now, just log it
      // this.listsymbolS.push(ticker);
      // if (this.listsymbolS.length > this.maxListLength) {
      //   await this.sendDiscordNotification(
      //     `,${this.listsymbolS.toString()}`,
      //     `${HT_Channel} RSIENDBOT`,
      //     JSON.stringify('lastdata'),
      //   );
      //   this.listsymbolS = [];
      //   return;
      // }
    }
  }


  async stockRSILAUP(data, ticker, timeframe, B_Channel, HT_Channel, getdataAt= 1){
    const lastData = data[data.length - getdataAt];
    const secondLastData = data[data.length - getdataAt-1];
    const stockRSILAUP = lastData.StochRSI_K - lastData.StochRSI_D > 0;
    const macdCross = await this.stockHelperService.macdCross(
      lastData,
      secondLastData,
    );
    const blowMA200 = lastData.close < lastData.MA200;
    const  downtrend = lastData.divergence < 0 
    const basePath = blowMA200 ? this.stockHelperService.aboveMA50api : `${this.stockHelperService.aboveMA50api}-aboveMA200`;
    const timeframeKey = timeframe === '1day' ? 'MA_AB_5_20' :timeframe === '4hour'  ? 'MA_AB_5_200' : timeframe === '2hour' ? 'MA_AB_20_50' : 'MA_AB_100_200';
    const sltimeframeKey = timeframe === '1day' ? 'SLACK_WEBHOOKS_US_MACDCR' :timeframe === '4hour'  ? 'SLACK_WEBHOOKS_4h_CROSS' : 'SLACK_WEBHOOKS_2h_CROSS';
    const lastDataOnTime = await this.stockHelperService.TurnDateToUnderFM(lastData.date);
    if (stockRSILAUP && macdCross.AB) {
      await this.FireBaseApi("put", `stockRSILAUP/macdCross_AB/${basePath}/${timeframe}/${ticker}.json`, {lastData: lastData})
      // await this.FireBaseApi("put", `stockRSILAUP/macdCross_AB/All/${timeframe}/${ticker}.json`, {lastData: lastData})
      await this.FireBaseApi("put", `stockRSILAUP/macdCross_AB/DyDay/${timeframe}/${lastDataOnTime}/${ticker}.json`, {lastData: lastData})
      await this.sendDiscord(
        `BUYY-macdCross_AB-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastData,
        DataSymbols.watchlist.includes(ticker)?'WATCHLIST':timeframeKey,
        data,
      );
      await this.sendSlackNotificationVN(timeframe,
        [ticker],
        lastData,
        DataSymbols.watchlist.includes(ticker)?'SLACK_WEBHOOKS_WATCHLIST':sltimeframeKey,'macdCross_AB','15'
      );
      return;
    }
    if (stockRSILAUP && macdCross.BL && this.stockHelperService.HoldingList.includes(ticker)) {
      await this.sendDiscord(
        `SELL-macdCross_AB-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
        `${ticker}-ON-${timeframe}`,
        lastData,
        'MA_AB_50_100',
        data,
      );
      await this.sendSlackNotificationVN(timeframe,
        [ticker],
        lastData,
        DataSymbols.watchlist.includes(ticker)?'SLACK_WEBHOOKS_HOLDING':sltimeframeKey,'macdCross_AB','15'
      );
      return;
    }  
    // if(downtrend && timeframe === '4hour' || timeframe === '2hour'){
    //   await this.FireBaseApi("put", `stockRSILAUP/NextRound/${timeframe}/${lastDataOnTime}/${ticker}.json`, {lastData: lastData})
    // }
  }
  async sendlast(B_Channel, HT_Channel) {
    await this.sendDiscordNotification(
      `,${this.listsymbolB.toString()}`,
      `${B_Channel} RSIENDBOT`,
      JSON.stringify('lastdata'),
    );
    await this.sendDiscordNotification(
      `,${this.listsymbolBEarly.toString()}`,
      `${HT_Channel} RSIENDBOT`,
      JSON.stringify('lastdata'),
    );
    // await this.sendDiscordNotification(
    //   `,${this.listsymbolS.toString()}`,
    //   `${'200AB_LESS_1'} RSIENDBOT`,
    //   JSON.stringify('lastdata'),
    // );
    this.listsymbolB = [];
    this.listsymbolBEarly = [];
    // this.listsymbolS = [];
    return;
  }

  async runCrOn_MA50(data, ticker, timeframe, B_Channel, HT_Channel) {
    const lastData = data[data.length - 1];
    const secondLastData = data[data.length - 2];
    const thirdLastData = data[data.length - 3];
    const fourthLastData = data[data.length - 4];
    const aboveMA50 = lastData.close > lastData.MA50;
    const MACDPositive = lastData.divergence > 0;
    const MACDNegative = lastData.divergence < 0;
    const aboveMA50Second = secondLastData.close > secondLastData.MA50;
    const aboveMA50Third = thirdLastData.close > thirdLastData.MA50;
    const aboveMA50Fourth = fourthLastData.close > fourthLastData.MA50;
    const PriceCrMA50 = await this.stockHelperService.priceAbMABUY(
      lastData,
      secondLastData,
      'MA50',
    );
    const PriceCrMA50bl = await this.stockHelperService.priceAbMABUY(
      secondLastData,
      lastData,
      'MA50',
    );
    if (MACDPositive && PriceCrMA50) {
      await this.sendDiscord(
        `SBUY-BuyOnly_MACDPositive-PriceCrMA50 -${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
        `${ticker}-${timeframe}-CrMA50-${lastData?.close}`,
        lastData,
        timeframe === '1day' ? B_Channel : HT_Channel,
        data,
      );
      return;
    }
    // const aboveMA50Count = [
    //   aboveMA50,
    //   aboveMA50Second,
    //   // aboveMA50Third,
    //   // aboveMA50Fourth,
    // ].filter(Boolean).length;
    // if (aboveMA50Count >= 2 && MACDPositive) {
    //   await this.sendDiscord(
    //     `SBUY-Continue-buy-keep-${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
    //     `${ticker}-${timeframe}-${lastData?.close}`,
    //     lastData,
    //     timeframe === '1day' ? B_Channel : HT_Channel,
    //     data,
    //   );
    //   return;
    // } else
    if (MACDNegative && PriceCrMA50bl) {
      await this.sendDiscord(
        `SSELL-PriceCrMA50bl -${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
        `${ticker}-${timeframe}-${lastData?.close}`,
        lastData,
        timeframe === '1day' ? HT_Channel : B_Channel,
        data,
      );
      return;
    }
  }

  async sendSlackNotificationURL(
    timeframe: string,
    symbols: string[],
    lastData: any,
    other = '1day',
  ) {
    const BASE_URL =
      other === '1day'
        ? this.configService.get<any>('SLACK_WEBHOOKS')
        : this.configService.get<any>('SLACK_WEBHOOKS_4h');
    let hourIn4 = '';
    if(this.stockHelperService.above50andBelow200 && this.stockHelperService.above50andBelow200.length > 0){
      hourIn4 = this.stockHelperService.above50andBelow200.includes(symbols[0]) ? '4️⃣ *BL200* 🟢🟢' : '';
    }
    const aboveOrBellow =
    lastData?.MA200 < lastData?.close
      ? '🟢 *ABOVE*'
      : '🔴 *BELOW*';
    const mkaboveOrBellow2 = DataSymbols.above2billion.includes(symbols[0]) ? '💰-' : '';
    const sp500 = DataSymbols.stock_500_symbols.includes(symbols[0]) ? '(🇺🇸)-' : ''
    const display = `${sp500}${mkaboveOrBellow2}${hourIn4}${lastData?.close}(${aboveOrBellow}-${lastData?.MA200?.toFixed(2)})| ${lastData?.date} |`
    const formatted = symbols
      .map(
        (s) =>
          `• *${s}* → ${display}` +
          ` <http://localhost:4200/price-log/${s}?daysRange=5|5m> | <http://localhost:4200/price-log/${s}?daysRange=15|15m> | <http://localhost:4200/price-log/${s}?daysRange=30|30m> | <http://localhost:4200/price-log/${s}?daysRange=60|1hour> | <http://localhost:4200/price-log/${s}?daysRange=240|4hour> | <http://localhost:4200/price-log/${s}?daysRange=500|daily> ||=|| <https://stockmarkets000.web.app/price-log/${s}?daysRange=500|PROD-DAILY> | ${timeframe}`,
      )
      .join('\n');

    const payload = {
      text: formatted,
    };
    try {
      // await axios.post(BASE_URL, payload);
      await this.post_SLack(BASE_URL, formatted);
      return { msg: 'post to Slack success' };
    } catch (error) {
      return { msg: 'post to Slack fails:', error };
    }
  }

  async sendSlackNotificationVN(
    timeframe: string,
    symbols: string[],
    fullData: any,
    slChannel :string,
    msg :string,
    range: '600' | '550' | '500' | '480' | '240' | '120' | '60' | '45' | '30' | '15' | '5' | '1',
  ) {
    const isFullDataArray = Array.isArray(fullData);
    let lastData = isFullDataArray? fullData[fullData.length - 1]: fullData;
    const BASE_URL = slChannel.includes('SLACK_WEBHOOKS_')? this.configService.get<any>(slChannel):slChannel;
    let hourIn4 = '';
    let in3candles = '';
    let bullxx: string = '';
    let bearxx: string = '';
    if (DataSymbols.watchlistBB[symbols[0]]?.BULL.length > 0) {
      DataSymbols.watchlistBB[symbols[0]].BULL.forEach((element) => {
        bullxx += `<https://www.tradingview.com/chart/?symbol=${element}|BULL_${element}> | `;
      });
    }
    if (DataSymbols.watchlistBB[symbols[0]]?.BEAR.length > 0) {
      DataSymbols.watchlistBB[symbols[0]].BEAR.forEach((element) => {
        bearxx +=  `<https://www.tradingview.com/chart/?symbol=${element}|BEAR_${element}> | `;
      });
    }
    let bullbearxx = bullxx + bearxx;
    if(this.stockHelperService.above50andBelow200 && this.stockHelperService.above50andBelow200.length > 0){
      hourIn4 = this.stockHelperService.above50andBelow200.includes(symbols[0]) ? '4️⃣ *BL200* 🟢' : '';
      in3candles = this.stockHelperService.ab50_bl200_3Candles.includes(symbols[0])?'(3C_4H_BL200)-':this.stockHelperService.ab50_ab200_3Candles.includes(symbols[0])?'(3C_4H_AB200)-':'';
    }
    const aboveOrBellow = lastData?.MA200 < lastData?.close
      ? '🟢 *ABOVE*'
      : '🔴 *BELOW*';
    const mkaboveOrBellow2 = DataSymbols.above2billion.includes(symbols[0]) ? '💰-' : '';
    const sp500 = DataSymbols.stock_500_symbols.includes(symbols[0]) ? '(🇺🇸)-' : ''
    const HoldingList = this.stockHelperService.HoldingList.includes(symbols[0])?'💼':''
    const last = in3candles + hourIn4;

    const timeframeScore = timeframeScoreMap[timeframe];
    const StopNTarget = await this.StopNTarget(lastData)
    const addMsg = msg? `*msg:* ${msg} | ` :""
    const buysellTarget = slChannel !=='SLACK_WEBHOOKS_HOLDING'? `\n\t\t${addMsg} *TARGET:* ${StopNTarget?.target}  | \t |  *STOP LOSS:* ${StopNTarget?.stop}`:'BETTER SELL'

    const display = `${sp500}${mkaboveOrBellow2}${HoldingList}${hourIn4}${last}${lastData?.close}(${aboveOrBellow}-${lastData?.MA200?.toFixed(2)})| ${lastData?.date} |`

    const formatted = symbols
      .map(
        (s) =>
          `• *${s}* → ${display}` +
          `  < <http://localhost:4200/price-log/${s}?daysRange=${timeframeScore}|local> | <https://stockmarkets000.web.app/price-log/${s}?daysRange=${timeframeScore}|production> | <https://www.tradingview.com/chart/mWoCISmu/?symbol=${s}|tradingview> |  <http://localhost:4200/price-log/${s}?daysRange=240|4hour> | ${timeframe}`+
          `${buysellTarget} +
          \n\t ${bullbearxx}`,
      )
      .join('\n');

    const payload = {
      text: formatted,
    };
    try {
      // await axios.post(BASE_URL, payload);
      const postToCSLRE = await this.post_SLack(BASE_URL, formatted);
      await new Promise(resolve => setTimeout(resolve, 5000));
      if(timeframe === '1day' && isFullDataArray){
        // postToCSLRE.channel 
        // postToCSLRE.ts  
        const slackMessageLink = this.stockHelperService.getSlackMessageLink(postToCSLRE.channel, postToCSLRE.ts);
        // get ai call 
        const timeframeFormatted = timeframe.replace(/(\d+)([a-zA-Z]+)/, '$1-$2').toLowerCase();
        const recommending = `I will provide stock price data over a ${timeframeFormatted} period. Please analyze the performance and write a concise report (maximum 500 words) summarizing key price movements, trends, and momentum. Based on your analysis, include a clear recommendation: Buy, Hold, or Sell, with brief justification supported by the observed data. The data is:`;

        const aiMesAsk = recommending + JSON.stringify({symbol: symbols[0], data : fullData})
        let getResFromGemini = '';
        let AIError = true;

        for (let i = 0; i < 3; i++) {
          // wait 30s before each retry (except first run)
          await new Promise(resolve => setTimeout(resolve, 30000));

          getResFromGemini = await this.aiToolService.getResFromGemini(aiMesAsk);

          AIError = getResFromGemini.toLowerCase().includes('error');

          // stop retrying if success
          if (!AIError) {
            break;
          }
        }
        const slackReLink = await this.aiToolService.postToSl(
          aiMesAsk,
          getResFromGemini
        );
        // post to slack symbol link
        if (!AIError) {
          await this.aiToolService.reply_SLack(
            postToCSLRE.channel,
            postToCSLRE.ts,
            slackReLink
          );
        } else {
          // failed after 3 tries
          await this.post_SLack(
            'C0B77K2AG12',
            `AI Error for ${symbols[0]}: ${slackMessageLink}`
          );
        }
        const recommendingBuyOrSell = getResFromGemini.toLowerCase().includes('recommendation: buy')
        if(recommendingBuyOrSell ){
          // post to a-buy channel if recommendation is buy
          await this.post_SLack('C0B6UVBFRRT', slackMessageLink);
          // add reaction to original message
          await this.addReaction_SLack(postToCSLRE.channel, postToCSLRE.ts, 'heart');
        } else if(getResFromGemini.toLowerCase().includes('recommendation: hold')){
          await this.addReaction_SLack(postToCSLRE.channel, postToCSLRE.ts, 'thumbsdown');
        }
      }
      return { msg: 'post to Slack success' };
    } catch (error) {
      return { msg: 'post to Slack fails:', error };
    }
  }
  
  async SendDcChannels(channels = ['US_ALL', 'USSTOCK_WATCH'], logger, transition?: string) {
    const equal = `===========================`;
    for (const channel of channels) {
      await this.sendDiscordNotification(
        `${equal}=${transition}=${equal}`,
        `${channel} RSIENDBOT`,
        JSON.stringify('lastdata'),
      );
      // Log completion
      logger.error(`✅ Finished sending for`, channel);
    }
  }


  private get headers() {
    const slackToken = this.configService.get<any>('SLACK_BOT_TOKEN');
    return {
      Authorization: `Bearer ${slackToken}`,
      'Content-Type': 'application/json; charset=utf-8',
    };
  }
// =========================
  // POST MESSAGE
  // =========================
  async post_SLack(channel: string, text: string) {
    try {
      const { data } = await axios.post(
        'https://slack.com/api/chat.postMessage',
        { channel, text },
        { headers: this.headers },
      );

      if (!data.ok) {
        console.log('Slack post error',channel,text);
      }

      return data;
    } catch (error) {
      console.log('Slack post exception');
      throw error;
    }
  }
// =====================================
// GET ALL MESSAGES + THREAD REPLIES
// =====================================
async getAllMessages_SLack(channel: string): Promise<string[]> {
  let cursor: string | undefined;

  const replyTs: string[] = [];
  const parentTs: string[] = [];

  try {
    do {
      const { data } = await axios.post(
        'https://slack.com/api/conversations.history',
        {
          channel,
          cursor,
          limit: 100,
        },
        {
          headers: this.headers,
        },
      );

      if (!data.ok) {
        console.log('History failed:');
        break;
      }

      const messages = data.messages || [];

      for (const msg of messages) {
        if (!msg?.ts) continue;

        // =========================
        // GET THREAD REPLIES
        // =========================
        if ((msg.reply_count ?? 0) > 0) {
          try {

            const { data: replyData } = await axios.get(
              'https://slack.com/api/conversations.replies',
              {
                headers: this.headers,
                params: {
                  channel,
                  ts: msg.ts,
                },
              },
            );

            if (!replyData.ok) {
              console.log( 'conversations.replies failed:',);
            } else {
              const replies = replyData.messages || [];

              // Skip parent (index 0)
              for (const reply of replies.slice(1)) {
                if (reply?.ts) {
                  replyTs.push(reply.ts);
                }
              }
            }
          } catch (error) {
            console.log('conversations.replies exception:',);
          }
        }

        parentTs.push(msg.ts);
      }

      cursor = data.response_metadata?.next_cursor || undefined;
    } while (cursor);

    // replies first, parents last
    const tsList = [...new Set([...replyTs, ...parentTs])];

    return tsList;
  } catch (error) {
    // console.log('Slack history error', error);
    // throw error;
  }
}

// =====================================
// DELETE MESSAGES
// =====================================
async deleteMessage_SLack(
  channel: string,
  tsList: string[],
) {
  const results: {
    ts: string;
    success: boolean;
    error?: any;
  }[] = [];

  const sleep = (ms: number) =>
    new Promise(resolve => setTimeout(resolve, ms));

  for (const ts of tsList) {
    try {
      const response = await axios.post(
        'https://slack.com/api/chat.delete',
        {
          channel,
          ts,
        },
        {
          headers: this.headers,
        },
      );

      if (response.data.ok) {
        console.log(`✅ Deleted message: ${ts}`);

        results.push({
          ts,
          success: true,
        });
      } else {
        console.log( `❌ Slack delete error (${ts})`, channel,  response.data,);
        results.push({
          ts,
          success: false,
          error: response.data,
        });
      }

      await sleep(1200);
    } catch (error) {


      results.push({
        ts,
        success: false,
        error,
      });
    }
  }

  return results;
}

// =====================================
// DELETE ALL MESSAGES
// =====================================
async deleteAllMessages_SLack(channel: string) {
  try {
    const tsList = await this.getAllMessages_SLack(channel);
    if (!tsList.length) {
      return {
        success: true,
        message: 'No messages found',
      };
    }

    const results = await this.deleteMessage_SLack(
      channel,
      tsList,
    );

    const successCount = results.filter(
      r => r.success,
    ).length;

    const failCount = results.length - successCount;

    return {
      success: failCount === 0,
      total: tsList.length,
      successCount,
      failCount,
      results,
    };
  } catch (error) {
    console.log('🔥 deleteAllMessages error', );

    return {
      success: false,
      error,
    };
  }
}

// =====================================
// DELETE CHANNELS
// =====================================
  async deleteSLChannel(channels: string[]) {
  if (!channels.length) {
    console.log('No channel, skip');
    return;
  }

  for (const each of channels) {
    try {
      const slID = each.includes('SLACK_WEBHOOKS_')
        ? this.configService.get<string>(each)
        : each;

      const result =
        await this.deleteAllMessages_SLack(slID);
        console.log(each,": Finished")
    } catch (error) {
      // console.error(each, error);
    }
  }
  }

  async addReaction_SLack(
    channel: string,
    ts: string,
    reaction: string = 'white_check_mark',
  ) {
    try {
      const { data } = await axios.post(
        'https://slack.com/api/reactions.add',
        {
          channel,
          timestamp: ts,
          name: reaction,
        },
        {
          headers: this.headers,
        },
      );
  
      if (!data.ok) {
        console.error('Reaction add failed:', data);
        return false;
      }
  
      console.log(`✅ Added :${reaction}: to ${ts}`);
      return true;
    } catch (error) {
      console.error('Reaction exception:', error);
      return false;
    }
  }
}
