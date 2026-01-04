import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import axios from 'axios';
import * as FormData from 'form-data';
import { ConfigService } from '@nestjs/config';
import { AttachmentBuilder, EmbedBuilder, WebhookClient } from 'discord.js';
@Injectable()
export class WebhooksService {
  private webhookClient: WebhookClient;
  private WEBHOOKS_ENV: Record<string, string>;
  private WEBHOOKS_CN: Record<string, string>;
  private rsiChannels: string[];
  constructor(private readonly configService: ConfigService) {
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
    const ticker = botname.split(' ')[1].toUpperCase();
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
    const origin = `**[4200-on1m](http://localhost:4200/price-log/${ticker})** | **[4200-5m](http://localhost:4200/price-log/${ticker}?daysRange=5)** | **[4200-15m](http://localhost:4200/price-log/${ticker}?daysRange=15)** \n **[3001-PO-day](http://localhost:3001/?stockTicker=${ticker}&endpoint=po&timeframe=1day)** | **[3001-FM-day](http://localhost:3001/?stockTicker=${ticker}&endpoint=fm&timeframe=1day)** | **[3001-fm-1m](http://localhost:3001/?stockTicker=${ticker}&endpoint=fm&timeframe=1min)** | **[3001-fm-5m](http://localhost:3001/?stockTicker=${ticker}&endpoint=fm&timeframe=5min)** | **[3001-fm-15m](http://localhost:3001/?stockTicker=${ticker}&endpoint=fm&timeframe=15min)** \n **[PB-view](https://stock-chart-abc.web.app/?stockTicker=${ticker}&endpoint=fm&timeframe=1day)** | **[TradingView](https://www.tradingview.com/chart/?symbol=${ticker})**`;
    let gptres;
    if (extra) {
      const parts = extra.split('/');
      const id = parts[parts.length - 1];
      gptres = `**[ASK GPT](${extra})** | **[GPT RES](https://todocalender.web.app/home/stock-track/${id}?sym=${ticker}&date=${current})**`;
    }
    const setmess = extra ? `${origin} | ${gptres}` : origin;
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
      // .addFields({ name: 'URL', value: `http://localhost:4200/price-prediction/${ticker}`, inline: true });
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
    // const current = new Date().toISOString().replace(/T.*$/, '');
    const WEBHOOKS = this.WEBHOOKS_ENV[webhookCl] || this.WEBHOOKS_ENV.Other;
    this.webhookClient = new WebhookClient({
      url: this.configService.get<any>(WEBHOOKS),
    });
    const WEBHOOKS_CNA = this.WEBHOOKS_CN[webhookCl] || this.WEBHOOKS_CN.Other;
    const getIdsOb = await this.getFromFBDynamic(
      `discord_slack_id/discord/${WEBHOOKS_CNA}/${current}.json`,
    );
    const Ids = Object.keys(getIdsOb);
    if (Ids.length === 0) return { msg: 'nothing to delete' };
    for (const messageId of Ids) {
      try {
        await this.webhookClient.deleteMessage(messageId);
        const WEBHOOKS_CNA =
          this.WEBHOOKS_CN[webhookCl] || this.WEBHOOKS_CN.Other;
        await this.deleteInFB(
          `discord_slack_id/discord/${WEBHOOKS_CNA}/${current}/${messageId}.json`,
        );
      } catch (error) {
        if (error.code === 'MESSAGE_NOT_FOUND') {
          console.log(`Message ${messageId} does not exist.`);
        } else {
          console.log(`Error deleting message ${messageId}`);
        }
      }
    }
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

  async captureChart(chartData: any) {
    if (!chartData || chartData.length === 0) {
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
      const datstring = JSON.stringify(chartData?.slice(-400));
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
    
            /* Optional: style the heading */
            h1 {
              position: absolute;
              top: 20px;
              left: 20px;
              color: white;
              z-index: 9999;
              font-size: 24px;
            }
          </style>
        </head>
        <body id="capture-target">
          <!-- Display the chart date dynamically if chartData is available -->
          <h1>Stock Chart Capture <span id="stockDate"></span></h1>
          <!-- Container for the chart to fill the screen -->
          <div style="width: 100%; height: 100%; background: white;">
            <!-- Properly passing chartData using .stockData binding -->
            <stock-chart-display id="stockChart" .stockData=""></stock-chart-display>
          </div>
    
          <script>
            // Your data (replace this with your actual chart data)
            const chartData = ${datstring};
    
            // Set the date dynamically (if chartData is available)
            document.getElementById('stockDate').innerText = chartData[1]?.date || 'No Date Found';
    
            // Get the stock-chart-display element by its ID
            const stockChartElement = document.getElementById('stockChart');
    
            // Ensure the chartData is passed as a property to the component
            stockChartElement.stockData = chartData;
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
      return null;
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
}
