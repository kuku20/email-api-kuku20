import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import axios from 'axios';
import * as FormData from 'form-data';

@Injectable()
export class ChartService {
  async captureChartAndSendToDiscord(
    chartData: any,
    webhookUrl: string = 'http://localhost:3000/webhooks/discord',
  ) {
    // Launch Puppeteer browser (headless mode)
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    // Set the viewport to the full screen size
    const screenWidth = 1920; // Example screen width (can be dynamic)
    const screenHeight = 1080; // Example screen height (can be dynamic)
    await page.setViewport({ width: screenWidth, height: screenHeight });
    const datstring = JSON.stringify(chartData.slice(-400));
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
    await page.waitForSelector('stock-chart-display', { visible: true });
    // await page.waitForSelector('#stockChart', { visible: true });
    // Check if the chart component is rendered and stockData is set

    setTimeout(async () => {
      const screenshotBuffer = await page.screenshot();
      // Close the browser instance
      await browser.close();

      // Prepare the FormData to send the image
      const formData = new FormData();
      formData.append('file', screenshotBuffer, 'screenshot.png');
      formData.append('message', 'Here is the captured chart image.');
      formData.append('botname', `${chartData.title} BOT`);

      try {
        // Send the image to Discord using the Webhook URL
        const response = await axios.post(
          'https://discord.com/api/webhooks/1379877252929683476/z5MfA8mjWHt26as2CDdjG6Wgpc9KKDRbMcDaRIX_dus--pyzmHwwBTzXS3CHavgmtTS5',
          formData,
          {
            headers: {
              ...formData.getHeaders(),
            },
          },
        );

        console.log('Image sent to Discord successfully:');
      } catch (error) {
        console.error('Error sending image to Discord:', error);
      }
    }, 0);
    // Capture the screenshot
  }
}
