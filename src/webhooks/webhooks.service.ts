import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import axios from 'axios';
import * as Timer from '../stock/compareTime';
import { ConfigService } from '@nestjs/config';
import { AttachmentBuilder, EmbedBuilder, WebhookClient } from 'discord.js';
import pLimit from 'p-limit';
import { StockHelperService } from 'src/stock/stockHelper.service';

import * as fs from 'fs';
import { channel } from 'diagnostics_channel';
@Injectable()
export class WebhooksService {
  private webhookClient: WebhookClient;
  private WEBHOOKS_ENV: Record<string, string>;
  private WEBHOOKS_CN: Record<string, string>;
  private rsiChannels: string[];
  constructor(
    private readonly configService: ConfigService,
    private readonly stockHelperService: StockHelperService,
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

  async sendSlackNotification(message: string) {
    const BASE_URL = `${this.configService.get<any>('SLACK_WEBHOOKS')}`;
    const nexMsg = `*****************************************
    ${message.replace(/\*\*/g, '*')}`;
    const payload = {
      type: 'mrkdwn',
      text: nexMsg,
    };

    try {
      await axios.post(BASE_URL, payload);
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
    const origin = `**[4200-on1m](https://stockmarkets000.web.app/price-log/${ticker})** | **[4200-5m](https://stockmarkets000.web.app/price-log/${ticker}?daysRange=5)** | **[4200-15m](https://stockmarkets000.web.app/price-log/${ticker}?daysRange=15)** \n **[3001-PO-day](https://new-site-for-stock-abc.web.app/?stockTicker=${ticker}&endpoint=po&timeframe=1day)** | **[3001-FM-day](https://new-site-for-stock-abc.web.app/?stockTicker=${ticker}&endpoint=fm&timeframe=1day)** | **[3001-fm-1m](https://new-site-for-stock-abc.web.app/?stockTicker=${ticker}&endpoint=fm&timeframe=1min)** | **[3001-fm-5m](https://new-site-for-stock-abc.web.app/?stockTicker=${ticker}&endpoint=fm&timeframe=5min)** | **[3001-fm-15m](https://new-site-for-stock-abc.web.app/?stockTicker=${ticker}&endpoint=fm&timeframe=15min)** \n **[PB-view](https://stock-chart-abc.web.app/?stockTicker=${ticker}&endpoint=fm&timeframe=1day)** | **[TradingView](https://www.tradingview.com/chart/?symbol=${ticker})**`;
    let gptres;
    if (extra) {
      const parts = extra.split('/');
      const id = parts[parts.length - 1];
      gptres = `**[ASK GPT](${extra})** | **[GPT RES](https://todocalender.web.app/home/stock-track/${id}?sym=${ticker}&date=${current})**`;
    }
    let setmess = extra ? `${origin} | ${gptres}` : origin;

    if (!file && !message.includes('SELLCR')) {
      setmess = `${setmess} | **[CHART MISSING](https://stockmarkets000.web.app/capture-click/${webhookCl}/${tickerON})**`;
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
    if (
      this.rsiChannels.some((channel) => WEBHOOKS_CNA.includes(channel)) &&
      !botdt.includes('RSIENDBOT')
    ) {
      // store symbol of date
      await this.RsiToDatabase(
        'RSI/' + WEBHOOKS_CNA,
        current + `/${ticker}`,
        `${ticker}`,
      );
      // store data of the date of sym that sent to discord
      await this.RsiToDatabase('RSI-DATE-DATA', ticker + `/${current}`, {
        msglik: `https://discord.com/channels/1306113720979689523/${sentMessage?.channel_id}/${sentMessage?.id}`,
        ...options,
      });
    }
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
    ticker: string,
    channel: string,
    message: string,
  ) {
    return null;
    if (!chartData || chartData.length === 0) {
      return null;
    }
    const slicedData =
      chartData && chartData.length > 0 ? chartData.slice(-200) : [];
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
    // if(!timeframe.includes('m') && BuyOnly_StochRSICrossAB200.PriceCrMA50) {
    if (BuyOnly_StochRSICrossAB200.PriceCrMA50) {
      await this.sendDiscord(
        `SBUY-BuyOnly_StochRSICrossAB200-PriceCrMA50 -${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-${timeframe}-CrMA50-${lastdata?.close}`,
        lastdata,
        HT_Channel,
        data,
      );
      return;
    }
    if (BuyOnly_StochRSICrossAB200.PriceCrMA100) {
      await this.sendDiscord(
        `SBUY-BuyOnly_StochRSICrossAB200-PriceCrMA100 -${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
        `${ticker}-${timeframe}-CrMA100-${lastdata?.close}`,
        lastdata,
        B_Channel,
        data,
      );
      return;
    }
    // if (BuyOnly_StochRSICrossAB200.PriceCrMA200) {
    //   await this.sendDiscord(
    //     `SBUY-BuyOnly_StochRSICrossAB200-PriceCrMA200 -${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
    //     `${ticker}-ON-${timeframe}`,
    //     lastdata,
    //     HT_Channel,
    //     data,
    //   );
    //   return;
    // }

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
    // if (BuyOnly_StochRSICrossAB200.macdCrAB) {
    //   await this.sendDiscord(
    //     `BUY-BuyOnly_StochRSICrossAB200-macdCrAB -${timeframe}(MACD:${lastdata?.MACDLine}): ${lastdata?.date}`,
    //     `${ticker}-ON-${timeframe}`,
    //     lastdata,
    //     HT_Channel,
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

  listsymbolB = [];
  listsymbolBEarly = [];
  listsymbolS = [];
  maxListLength = 100;
  async runALLOn_MA50(data, ticker, timeframe, B_Channel, HT_Channel) {
    const lastData = data[data.length - 1];
    const secondLastData = data[data.length - 2];
    const thirdLastData = data[data.length - 3];
    const fourthLastData = data[data.length - 4];
    const fifthLastData = data[data.length - 5];
    const aboveMA50 = lastData.close > lastData.MA50;
    const MACDPositive = lastData.divergence > 0;
    const aboveMA50Second = secondLastData.close > secondLastData.MA50;
    const aboveMA50Third = thirdLastData.close > thirdLastData.MA50;
    const aboveMA50Fourth = fourthLastData.close > fourthLastData.MA50;
    const belowMA50Fifth = fifthLastData.close < fifthLastData.MA50;
    const PriceCrMA50 = await this.stockHelperService.priceAbMABUY(
      lastData,
      secondLastData,
      'MA50',
    );
    if (MACDPositive && PriceCrMA50) {
      await this.sendDiscord(
        `SBUY-BuyOnly_MACDPositive -${timeframe}(MACD:${lastData?.MACDLine}): ${lastData?.date}`,
        `${ticker}-${timeframe}-CrMA100-${lastData?.close}`,
        lastData,
        timeframe === '1day' ? '200AB_LESS_05' : '200AB_LESS_1',
        data,
      );
    }
    const aboveMA50Count = [
      aboveMA50,
      aboveMA50Second,
      aboveMA50Third,
      aboveMA50Fourth,
    ].filter(Boolean).length;
    if (aboveMA50Count >= 3 && MACDPositive) {
      if (belowMA50Fifth) {
        this.listsymbolBEarly.push(ticker);
        if (this.listsymbolBEarly.length > this.maxListLength) {
          await this.sendDiscordNotification(
            `,${this.listsymbolBEarly.toString()}`,
            // `200AB_LESS_1 RSIENDBOT`,
            `${HT_Channel} RSIENDBOT`,
            JSON.stringify('lastdata'),
          );
          this.listsymbolBEarly = [];
        }
      }
      this.listsymbolB.push(ticker);
      if (timeframe === '1day') {
        this.stockHelperService.ListMA50On1day.push(ticker);
      } else if (timeframe.includes('4h')) {
        this.stockHelperService.ListMA50On4hour.push(ticker);
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
}
