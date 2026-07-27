import { Injectable, NotAcceptableException } from '@nestjs/common';
import { StockData } from './dto/chartData';
interface SlackMessage {
  text: string;
  ts: string;
}
@Injectable()
export class StockHelperService {
  // aboveMA50api: string = `sun-04-19-2026-blowMA200`;
  aboveMA50api: string = `run-daily`;
  todayUpGains = 'today-gainers-losers';
  ab50_bl200_3Candles: string[] = [];
  stockRSILAUP_4hourALL: string[] = [];
  NextRound_4hourALL: string[] = [];
  NextRound_2hourALL: string[] = [];
  stockRSILAUP_1dayALL: string[] = [];
  ab50_ab200_3Candles: string[] = [];
  ab50_3Candles_ALL: string[] = [];

  above50andBelow200: string[] = [];
  above50andAbove200: string[] = [];
  above50All: string[] = [];

  runOn4hourInday: string[] = [];
  ListMA50On1day: string[] = [];
  ListMA50On4hour: string[] = [];
  HoldingList: string[] = [];
  Just2day: string[] = [];
  watchlistSl_tss: SlackMessage[] = [];
  bullbearUqiue = 'b6r_'
  apitwelveCount = 0

  slackTokenKey = 'SLACK_BOT_TOKEN';
  skipPostDiscord = false;
  slackPosted = []
  setSlackToken(tokenKey: string) {
    this.slackTokenKey = tokenKey;
  }
  AI_SL = {
    "AI_BUY": "C0BKW5WDZ8S",
    "AI_ERORR": "C0BKU6DC7FG",
    "AI_PRICE": "C0BKPU9QFKM",
    "AI_RE_BUY": "C0BKZSKE5N0",
    "AI_RE_HOLD": "C0BLQFR4STA",
    "AI_RE_SELL": "C0BKU6DH6DU",
    "AI_OTHER_ALGO": "C0BKW5W4W74"
  }
  BULL_BEAR_SL_={
    "QQQ": "C0BKU6DPH2S",
    "SPY": "C0BKZSJQENQ"
  }
  INTRA_30M_SL_ = {
    "MACDCR_50": "C0BKU6E11GE",
    "MACDCR_100": "C0BKU6DLT2A",
    "MACDCR_200": "C0BKPU95CUB",
    "MACDCR_BL": "C0BKSSZ7RJ9",
    "MACDCR_BL_OT": "C0BKY3P929F",
    "WATCH": "C0BKZSJH6N8",
    "ALLGREEN": "C0BKPUAFCTD",
    "EARLY_CHECK": "C0BKZSK6NE8"
  }
  BTN_SL={
    "HOLDING": "C0BKSSYU93P",
    "WATCH": "C0BKU6DH8DU"
  }
  US_4H_ = {
    "STOCHRSI": "C0BKPU9L7M1",
    "MACDCR_50": "C0BKU6DUUJJ",
    "MACDCR_100": "C0BKSSZ7GNR",
    "MACDCR_200": "C0BKY3P9J3B",
    "MACDCR_BL": "C0BLQFKMWP2",
    "OSC_50": "C0BKSSYU82Z",
    "OSC_100": "C0BKST05093",
    "OSC_200": "C0BKU6E3JF8",
    "OSC_BL": "C0BKY2C3TL1",
    "WATCH": "C0BKU6EP7KQ",
    "WATCH_BUY": "C0BKW5WN53L"
  }
  US_DAILY_ = {
    "STOCHRSI": "C0BKZSKBUTE",
    "MACDCR_50": "C0BKZSKSCAY",
    "MACDCR_100": "C0BKSSZ1FAR",
    "MACDCR_200": "C0BKW5WVAUS",
    "MACDCR_BL": "C0BKPU9KR7D",
    "OSC_50": "C0BKZSKRVNG",
    "OSC_100": "C0BLQFRHZME",
    "OSC_200": "C0BKEQF50NT",
    "OSC_BL": "C0BLQFSJKQ8",
    "WATCH": "C0BKW5X09L2",
    "WATCH_BUY": "C0BLQFHGHBJ",
    "RSI_15": "C0BKSSZ91RB",
    "RSI_20": "C0BKPUAPCH1",
    "RSI_25": "C0BKY3Q5A3B"
  }
  VN_SL_ = {
    "MACDCR_50": "C0BKEQFEA23",
    "MACDCR_100": "C0BKEQFL3U7",
    "MACDCR_200": "C0BKZSL56AG",
    "MACDCR_BL": "C0BKEQFF52B"
   }
   Z_US_SL_ = {
    "4h_3C_AB": "C0BKY3PAY8Z",
    "4h_3C_BL": "C0BKY3PV17B",
    "2h_CROSS": "C0BKU6DSXSA",
    "HOLDING": "C0BKU6ET21L",
    "HOLDING_C_SELL": "C0BKW5WU99Q",
    "J2DAY": "C0BKZSKS7FW",
    "J3DAY": "C0BLQFRP880",
    "OR": "C0BKPUAF9LK",
    "OR4": "C0BKZSLGUN8"
   }
   US_WK_ = {
    "STOCHRSI": "C0B769TEVK8",
    "MACDCR_50": "C0B7A6WMZ97",
    "MACDCR_100": "C0B78BZB3QA",
    "MACDCR_200": "C0B769VJZ46",
    "MACDCR_BL": "C0B720T4WAX",
    "OSC_50": "C0B78BZ4W1G",
    "OSC_100": "C0B7C0FMSRJ",
    "OSC_200": "C0B82LDDX40",
    "OSC_BL": "C0B750FK23F",
    "WATCH": "C0B7C0GFN1J",
    "RSI_15": "C0B720TR8PM",
    "RSI_20": "C0B769UGWHL",
    "RSI_25": "C0B82LCJT3J",
    "AI_BUY": "C0B7C0FUN4U",
    "AI_ERORR": "C0B78BZ5TNW",
    "AI_PRICE": "C0B7A6WSPSM",
    "AI_RE_BUY": "C0B750FTJTF",
    "AI_RE_HOLD": "C0B6STLT1FZ",
    "AI_RE_SELL": "C0B7A6X4QQH",
    "AI_OTHER_ALGO": "C0B769UT2FQ"
  }
  async returnNewData(dataIn: any[]) {
    if (!dataIn?.length) return [];

    // Sort ascending by date (oldest first)
    // dataIn.sort(
    //   (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    // );

    dataIn = await this.calculateMovingAverage(dataIn, 5, 'MA5');
    dataIn = await this.calculateMovingAverage(dataIn, 9, 'MA9');
    dataIn = await this.calculateMovingAverage(dataIn, 10, 'MA10');
    dataIn = await this.calculateMovingAverage(dataIn, 15, 'MA15');
    dataIn = await this.calculateMovingAverage(dataIn, 20, 'MA20');
    dataIn = await this.calculateAngleMAwithXaxis(dataIn, 1, 'MA20');
    dataIn = await this.calculateMovingAverage(dataIn, 50, 'MA50');
    dataIn = await this.calculateAngleMAwithXaxis(dataIn, 1, 'MA50');
    dataIn = await this.calculateMovingAverage(dataIn, 100, 'MA100');
    dataIn = await this.calculateMovingAverage(dataIn, 120, 'MA120');
    dataIn = await this.calculateAngleMAwithXaxis(dataIn, 1, 'MA120');
    dataIn = await this.calculateMovingAverage(dataIn, 200, 'MA200');
    dataIn = await this.calculateMovingAverage(dataIn, 300, 'MA300');
    dataIn = await this.calculateRSI(dataIn);
    dataIn = await this.calculateStochasticRSI(dataIn);
    dataIn = await this.calculateMACD(dataIn);
    dataIn = await this.calculateOSC(dataIn, 20, 6);

    return dataIn;
  }

  private calculateAngleBetweenMACDSignal(
    prevMACD: number,
    currMACD: number,
    prevSignal: number,
    currSignal: number,
  ): number | null {
    if (
      prevMACD == null ||
      currMACD == null ||
      prevSignal == null ||
      currSignal == null
    ) {
      return null;
    }
  
    const m1 = currMACD - prevMACD;
    const m2 = currSignal - prevSignal;
  
    const denominator = 1 + m1 * m2;
  
    // Prevent division by zero
    if (Math.abs(denominator) < Number.EPSILON) {
      return 90;
    }
  
    return Number(
      (
        // Math.abs(Math.atan((m2 - m1) / denominator)) *
        Math.atan((m2 - m1) / denominator) *
        180 /
        Math.PI
      ).toFixed(2),
    );
  }

  /**
   * Simple Moving Average
   */
  async calculateMovingAverage(
    data: any[],
    windowSize: number,
    maLabel: string,
  ) {
    if (!data?.length) return [];

    for (let i = 0; i < data.length; i++) {
      if (i >= windowSize - 1) {
        const windowData = data.slice(i - windowSize + 1, i + 1);
        const sum = windowData.reduce((acc, val) => acc + (val?.close ?? 0), 0);
        const average = sum / windowSize;
        data[i][maLabel] = parseFloat(average?.toFixed(9)); // assign to current index
      } else {
        data[i][maLabel] = null; // optional clarity
      }
    }

    return data;
  }

  /**
   * Calculate Moving Average angle with the x-axis
   */
  async calculateAngleMAwithXaxis(
    data: any[],
    windowSize: number = 1,
    maLabel: string,
  ) {
    if (!data?.length) return [];

    const angleLabel = `${maLabel}_Angle`;

    for (let i = 0; i < data.length; i++) {
      if (i >= windowSize) {
        const current = data[i][maLabel];
        const previous = data[i - windowSize][maLabel];

        if (current == null || previous == null) {
          data[i][angleLabel] = null;
          continue;
        }

        const deltaY = current - previous;
        const deltaX = windowSize;

        const angle =
          Math.atan(deltaY / deltaX) * (180 / Math.PI);

        data[i][angleLabel] = Number(angle.toFixed(4));
      } else {
        data[i][angleLabel] = null;
      }
    }

    return data;
  }

  /**
   * Relative Strength Index (RSI)
   */
  async calculateRSI(data: any[], period = 14) {
    if (!data?.length) return [];

    const gains: number[] = [];
    const losses: number[] = [];

    // Price changes between consecutive closes
    for (let i = 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    // Initial average gain/loss
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    const rsiArray = Array(data.length).fill(null);

    // Compute RSI from 'period' onward
    for (let i = period; i < data.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;

      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - 100 / (1 + rs);
      rsiArray[i] = parseFloat(rsi.toFixed(9));
    }

    // Merge RSI into data
    return data.map((item, i) => ({
      ...item,
      RSI: rsiArray[i],
    }));
  }

  /**
   * Exponential Moving Average (EMA)
   */
  async calculateEMA(data: any[], period: number) {
    if (!data?.length || data.length < period) return [];

    const multiplier = 2 / (period + 1);
    const emaArray = Array(data.length).fill(null);

    const sma =
      data.slice(0, period).reduce((sum, val) => sum + val.close, 0) / period;
    emaArray[period - 1] = sma;

    for (let i = period; i < data.length; i++) {
      emaArray[i] =
        (data[i].close - emaArray[i - 1]) * multiplier + emaArray[i - 1];
    }

    return emaArray;
  }

  /**
   * Moving Average Convergence Divergence (MACD)
   */
  async calculateMACD(
    data: any[],
    shortPeriod = 12,
    longPeriod = 26,
    signalPeriod = 9,
  ) {
    if (!data?.length) return [];

    // 1️⃣ Compute short and long EMAs
    const shortEMA = await this.calculateEMA(data, shortPeriod);
    const longEMA = await this.calculateEMA(data, longPeriod);

    // 2️⃣ Compute MACD line
    const macdLine = data.map((_, i) =>
      shortEMA[i] != null && longEMA[i] != null
        ? Number((shortEMA[i] - longEMA[i]).toFixed(7))
        : null,
    );

    // 3️⃣ Compute Signal line as EMA of MACD line
    // Prepare MACD objects for calculateEMA (use only numeric values)
    const macdObjects = macdLine.map((val) => ({ close: val ?? 0 }));
    const signalEMA = await this.calculateEMA(macdObjects, signalPeriod);

    // Assign Signal line with proper nulls at the start
    const signalLine = signalEMA.map((v, i) =>
      i < signalPeriod - 1 ? null : Number(v.toFixed(7)),
    );

    // 4️⃣ Compute MACD Histogram
    const histogram = macdLine.map((macd, i) =>
      macd != null && signalLine[i] != null
        ? Number((macd - signalLine[i]).toFixed(7))
        : null,
    );

    // 5️⃣ Optional: Divergence detection
    const divergence: ('bullish' | 'bearish' | null)[] = Array(
      data.length,
    ).fill(null);
    for (let i = 1; i < data.length; i++) {
      if (histogram[i - 1] != null && histogram[i] != null) {
        if (
          data[i].close < data[i - 1].close &&
          histogram[i] > histogram[i - 1]
        ) {
          divergence[i] = 'bullish';
        } else if (
          data[i].close > data[i - 1].close &&
          histogram[i] < histogram[i - 1]
        ) {
          divergence[i] = 'bearish';
        }
      }
    }

    // 6️⃣ Merge results
    return data.map((item, i) => ({
      ...item,
      MACDLine: macdLine[i],
      SignalLine: signalLine[i],
      divergence: histogram[i],
      MACDDivergence: divergence[i],
      // angleMACDsignal:
      //   i > 0
      //     ? this.calculateAngleBetweenMACDSignal(
      //         macdLine[i - 1],
      //         macdLine[i],
      //         signalLine[i - 1],
      //         signalLine[i],
      //       )
      //     : null,
    }));
  }

  /**
   * Calculate 3, 3, 14, 14 Stochastic RSI
   */
  async calculateStochasticRSI(
    data: any[],
    rsiPeriod: number = 14,
    stochPeriod: number = 14,
    kSmoothing: number = 3,
    dSmoothing: number = 3,
  ) {
    if (!data?.length) return [];

    // Step 1: Calculate RSI first
    const rsiData = await this.calculateRSI(data, rsiPeriod);
    const stochRSIArray: number[] = Array(data.length).fill(null);
    const kArray: number[] = Array(data.length).fill(null); // K values (Stochastic RSI)
    const dArray: number[] = Array(data.length).fill(null); // D values (3-period smoothing of K)

    // Step 2: Calculate Stochastic RSI (K)
    for (let i = stochPeriod - 1; i < data.length; i++) {
      const rsiWindow = rsiData.slice(i - stochPeriod + 1, i + 1); // Get RSI window for the period
      const minRSI = Math.min(...rsiWindow.map((item) => item.RSI)); // Get min RSI in the window
      const maxRSI = Math.max(...rsiWindow.map((item) => item.RSI)); // Get max RSI in the window

      if (maxRSI !== minRSI) {
        // Calculate Stochastic RSI (K)
        const stochRSI = (rsiData[i].RSI - minRSI) / (maxRSI - minRSI);
        stochRSIArray[i] = parseFloat(stochRSI.toFixed(9)); // Store the Stochastic RSI value
      } else {
        stochRSIArray[i] = null; // Set null if maxRSI equals minRSI (to avoid division by zero)
      }
    }

    // Step 3: Calculate K (Fast Stochastic RSI)
    for (let i = kSmoothing - 1; i < data.length; i++) {
      const kWindow = stochRSIArray.slice(i - kSmoothing + 1, i + 1);
      const kAverage =
        kWindow.reduce((acc, val) => (val !== null ? acc + val : acc), 0) /
        kSmoothing;
      kArray[i] = parseFloat(kAverage.toFixed(9));
    }

    // Step 4: Calculate D (Slow Stochastic RSI) - 3-period moving average of K
    for (let i = dSmoothing - 1; i < data.length; i++) {
      const dWindow = kArray.slice(i - dSmoothing + 1, i + 1);
      const dAverage =
        dWindow.reduce((acc, val) => (val !== null ? acc + val : acc), 0) /
        dSmoothing;
      dArray[i] = parseFloat(dAverage.toFixed(9));
    }

    // Step 5: Merge K and D values into the data
    return data.map((item, i) => ({
      ...item,
      StochRSI_K: kArray[i], // K (Stochastic RSI)
      StochRSI_D: dArray[i], // D (Slow Stochastic RSI)
    }));
  }

  /**
 * Oscillator (OSC)
 * OSC = 100 * (Close - MA(N)) / MA(N)
 * With optional smoothing (signal line)
 */
async calculateOSC(
  data: any[],
  maPeriod: number = 20,
  smoothPeriod: number = 6,
) {
  if (!data?.length) return [];

  // 1️⃣ Ensure MA exists
  const maLabel = `MA${maPeriod}`;
  data = await this.calculateMovingAverage(data, maPeriod, maLabel);

  const oscArray: number[] = Array(data.length).fill(null);
  const signalArray: number[] = Array(data.length).fill(null);

  // 2️⃣ Calculate OSC
  for (let i = 0; i < data.length; i++) {
    const ma = data[i][maLabel];
    const close = data[i].close;

    if (ma != null && ma !== 0) {
      const osc = 100 * (close - ma) / ma;
      oscArray[i] = parseFloat(osc.toFixed(7));
    }
  }

  // 3️⃣ Smooth OSC (Signal line using SMA)
  for (let i = smoothPeriod - 1; i < data.length; i++) {
    const window = oscArray.slice(i - smoothPeriod + 1, i + 1);
    const valid = window.filter((v) => v != null);

    if (valid.length === smoothPeriod) {
      const avg =
        valid.reduce((sum, val) => sum + val, 0) / smoothPeriod;
      signalArray[i] = parseFloat(avg.toFixed(7));
    }
  }

  // 4️⃣ Merge into data
  return data.map((item, i) => ({
    ...item,
    OSC: oscArray[i],
    OSCSignal: signalArray[i],
  }));
}

  async transformData(data: any[]) {
    const transformedData = {};

    data.forEach((entry: { date: string }) => {
      const dateKey = entry.date.split(' ')[0]; // Extracting the date part
      if (!transformedData[dateKey]) {
        transformedData[dateKey] = []; // Initializing a list for that date
      }
      transformedData[dateKey].push(entry); // Appending the entry to the list
    });

    return transformedData;
  }

  async getDateRanges(
    startDateStr: string,
    endDateStr: string,
    daysPerRange: number,
  ) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const ranges = [];

    let currentEndDate = new Date(endDate); // Initialize the end date

    // Loop to generate ranges
    while (currentEndDate >= startDate) {
      let currentStartDate = new Date(currentEndDate); // Initialize start date as the current end date
      currentStartDate.setDate(currentEndDate.getDate() - daysPerRange + 1); // Calculate start date for the range

      // Ensure the currentStartDate doesn't go before the startDate
      if (currentStartDate < startDate) {
        currentStartDate = new Date(startDate);
      }

      // Add the calculated range to the ranges array
      ranges.push({
        start: currentStartDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        end: currentEndDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      });

      // Update currentEndDate to one day before the currentStartDate to avoid overlap
      currentEndDate = new Date(currentStartDate);
      currentEndDate.setDate(currentEndDate.getDate() - 1);
    }
    console.log(ranges);
    return ranges;
  }

  async calculateDaysBetween(startDateStr: string, endDateStr: string) {
    // Convert string dates to Date objects
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Calculate the difference in milliseconds
    const differenceInMillis = endDate.getTime() - startDate.getTime();

    // Convert milliseconds to days (1 day = 24 hours * 60 minutes * 60 seconds * 1000 milliseconds)
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const daysBetween = Math.ceil(differenceInMillis / millisecondsPerDay);
    // if(daysBetween<0){
    //   throw new NotAcceptableException("Startday should before end day");
    // }
    return daysBetween;
  }

  async getAbbreviatedDay(dateString: string) {
    // Split the date string into components
    const [year, month, day] = dateString.split('-').map(Number);
    // Create a new Date object using the components, subtracting 1 from the month
    const date = new Date(Date.UTC(year, month - 1, day));
    const options: Intl.DateTimeFormatOptions = { weekday: 'short' };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  }

  async getDateThreeDaysAgo(dateString: string) {
    // Create a new Date object from the input string
    const date = new Date(dateString);
    // Subtract 3 days (in milliseconds)
    date.setDate(date.getDate() - 3);
    // Format the date back to 'YYYY-MM-DD'
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
  formatDate(date: any) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  getDateNDaysAgo(n: number) {
    const now = new Date(); // current date and time
    now.setDate(now.getDate() - n); // subtract n days
    return this.formatDate(now);
  }
  formatSymbol(symbol: string) {
    const match = symbol.match(/^([A-Z]+?)(USD|USDT|BTC|ETH|EUR|JPY)$/);
    return match ? `${match[1]}/${match[2]}` : symbol;
  }
  getmatch1only(symbol: string) {
    const match = symbol.match(/^([A-Z]+?)(USD|USDT|BTC|ETH|EUR|JPY)$/);
    return match ? `${match[1]}` : symbol;
  }

  // NYSE full market holidays - 2026
  private readonly holidays = [
    '2026-01-01', // New Year's Day (Thursday)
    '2026-01-19', // Martin Luther King Jr. Day
    '2026-02-16', // Washington's Birthday (Presidents' Day)
    '2026-04-03', // Good Friday
    '2026-05-25', // Memorial Day
    '2026-06-19', // Juneteenth National Independence Day (Observed)
    '2026-07-03', // Independence Day (Observed)
    '2026-09-07', // Labor Day
    '2026-11-26', // Thanksgiving Day
    '2026-12-25', // Christmas Day
  ];

  // NYSE early close (1:00 PM ET) - 2026
  private readonly halfDays = [
    '2026-11-27', // Day after Thanksgiving
    '2026-12-24', // Christmas Eve
  ];

  isMarketOpen(): boolean {
    const now = new Date();
    const nyTime = new Date(
      now.toLocaleString('en-US', { timeZone: 'America/New_York' }),
    );

    const day = nyTime.getDay(); // 0=Sun, 6=Sat
    if (day === 0 || day === 6) return false; // weekend

    const dateStr = nyTime.toISOString().split('T')[0];
    if (this.holidays.includes(dateStr)) return false;

    const minutes = nyTime.getHours() * 60 + nyTime.getMinutes();
    const marketOpen = 9 * 60 + 30; // 9:30 AM
    const marketClose = this.halfDays.includes(dateStr) ? 13 * 60 : 16 * 60; // 1:00 PM or 4:00 PM

    return minutes >= marketOpen && minutes <= marketClose;
  }

  async earlyBuyInRSI(last: StockData, prev: StockData): Promise<boolean> {
    if (!last || !prev) return false; // safety

    const isDivergenceNegative = last.divergence != null && last.divergence < 0;
    const isRSISetup =
      last.RSI != null &&
      prev.RSI != null &&
      last.RSI < 40 &&
      last.RSI > prev.RSI;
    const isMACDRising =
      last.MACDLine != null &&
      prev.MACDLine != null &&
      last.MACDLine > prev.MACDLine;

    return (
      isDivergenceNegative &&
      isRSISetup &&
      isMACDRising &&
      last.close > last.MA200
    );
  }

  async earlySellInRSI(last: StockData, prev: StockData): Promise<boolean> {
    if (!last || !prev) return false; // safety

    const isDivergenceNegative = last.divergence != null && last.divergence > 0;
    const isRSISetup =
      last.RSI != null &&
      prev.RSI != null &&
      last.RSI > 60 &&
      last.RSI < prev.RSI;
    const isMACDRising =
      last.MACDLine != null &&
      prev.MACDLine != null &&
      last.MACDLine < prev.MACDLine;

    return isDivergenceNegative && isRSISetup && isMACDRising;
  }

  async macdCrossAB(last: StockData, prev: StockData): Promise<boolean> {
    if (!last || !prev) return false; // safety
    return last.divergence > 0 && prev.divergence < 0;
  }
  async macdCrossBL(last: StockData, prev: StockData): Promise<boolean> {
    if (!last || !prev) return false; // safety
    return last.divergence < 0 && prev.divergence > 0;
  }
  async macdCrossAB_BL0(last: StockData, prev: StockData): Promise<boolean> {
    if (!last || !prev) return false; // safety
    return (
      last.divergence > 0 &&
      prev.divergence < 0 &&
      (last.MACDLine < 0 ||
        last.SignalLine < 0 ||
        prev.MACDLine < 0 ||
        prev.SignalLine < 0)
    );
  }
  async macdCross(last: StockData, prev: StockData): Promise<{AB: boolean;AB_BL0:boolean, BL: boolean}> {
    if (!last || !prev) return {AB:false,AB_BL0:false, BL:false}; // safety
    const AB = last.divergence > 0 && prev.divergence < 0;
    const AB_BL0 = AB && (last.MACDLine < 0 || last.SignalLine < 0 || prev.MACDLine < 0 || prev.SignalLine < 0);
    const BL = last.divergence < 0 && prev.divergence > 0;
    return {AB,AB_BL0, BL};
  }
  private readonly forexHolidays = [
    '2026-01-01', // New Year's Day (global)
    '2026-12-25', // Christmas
    '2026-12-26', // Boxing Day (some brokers close)
  ];

  isForexMarketOpen(): boolean {
    const now = new Date();
    // Convert to Eastern Time
    const nyTime = new Date(
      now.toLocaleString('en-US', { timeZone: 'America/New_York' }),
    );

    const day = nyTime.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const hours = nyTime.getHours();
    const dateStr = nyTime.toISOString().split('T')[0];

    // Check global holidays (rare, but some brokers close)
    if (this.forexHolidays.includes(dateStr)) return false;

    // Forex market opens Sunday 5 PM ET
    if (day === 0 && hours < 17) return false; // before 5 PM Sunday

    // Forex market closes Friday 5 PM ET
    if (day === 5 && hours >= 17) return false; // after 5 PM Friday

    // Closed all Saturday
    if (day === 6) return false;

    return true; // otherwise open
  }
  async priceAbAll1or5or15MinBUY(
    last: StockData,
    prev: StockData,
  ): Promise<boolean> {
    if (!last) return false; // safety
    const highestLast = Math.max(
      last.MA5,
      last.MA10,
      last.MA20,
      last.MA50,
      last.MA100,
      last.MA200,
    );
    const LastaboveAll = last.close > highestLast;

    const highestPrev = Math.max(
      prev.MA5,
      prev.MA10,
      prev.MA20,
      prev.MA50,
      prev.MA100,
      prev.MA200,
    );
    const PrevBlowAll = prev.close < highestPrev;
    return LastaboveAll && PrevBlowAll;
  }
  async priceAbMA200BUY(last: StockData, prev: StockData): Promise<boolean> {
    if (!last || !prev) return false; // safety
    const LastAbMA200 = last.high > last.MA200;
    const PrevBlMa200 = prev.low < prev.MA200;
    return LastAbMA200 && PrevBlMa200;
  }

  async AbMA200BUY_MACDCR(last: StockData, prev: StockData): Promise<boolean> {
    return (await this.macdCrossAB(last, prev)) && last.close > last.MA200;
  }

  async priceBlMA200SELL(last: StockData, prev: StockData): Promise<boolean> {
    if (!last || !prev) return false; // safety
    const LastAbMA200 = last.low < last.MA200;
    const PrevBlMa200 = prev.high > prev.MA200;
    return LastAbMA200 && PrevBlMa200;
  }

  async priceBlAll1or5or15MinSELL(
    last: StockData,
    prev: StockData,
  ): Promise<boolean> {
    if (!last) return false; // safety
    const lowestLast = Math.min(
      last.MA5,
      last.MA10,
      last.MA20,
      last.MA50,
      last.MA100,
      last.MA200,
    );
    const blowAll = last.low < lowestLast;
    return blowAll && last.divergence < 0;
  }

  async Over200NUpBuy(last: StockData, prev: StockData): Promise<boolean> {
    if (!last || !prev) return false; // safety
    return last.divergence > 0 && (await this.priceAbMA200BUY(last, prev));
  }

  async Under200NDownSell(last: StockData, prev: StockData): Promise<boolean> {
    if (!last || !prev) return false; // safety
    return last.divergence < 0 && (await this.priceBlMA200SELL(last, prev));
  }

  /**
BUY ALL
   */
  async BlMA200_MA20_MA50_MA100_BUY(
    last: StockData,
    prev: StockData,
  ): Promise<boolean> {
    if (!last || !prev) return false; // safety
    const BlMa200 = last.MA200 > last.close;
    const abMa20 = last.high > last.MA20 && prev.low < prev.MA20;
    const abMa50 = last.high > last.MA50 && prev.low < prev.MA50;
    const abMa100 = last.high > last.MA100 && prev.low < prev.MA100;
    const MacdLine_divergen = last.divergence > 0;
    return abMa50 && MacdLine_divergen && BlMa200;
  }

  async ABMA200_macdCrossAB_BUY(
    last: StockData,
    prev: StockData,
  ): Promise<boolean> {
    if (!last || !prev) return false; // safety
    const ABMa200 = last.MA200 < last.close;
    return ABMa200 && (await this.macdCrossAB(last, prev));
  }

  /**
SELL ALL
   */
  async BlMA200_MA20_MA50_MA100_SELL(
    last: StockData,
    prev: StockData,
  ): Promise<boolean> {
    if (!last || !prev) return false; // safety
    const BlMa200 = last.MA200 > last.close;
    const blMA20 = last.low < last.MA20 && prev.high > prev.MA20;
    const blMA50 = last.low < last.MA50 && prev.high > prev.MA50;
    const blMA100 = last.low < last.MA100 && prev.high > prev.MA100;
    const MacdLine_divergen = last.divergence < 0;
    return (blMA20 || blMA50 || blMA100) && MacdLine_divergen
    return (blMA20 || blMA50 || blMA100) && MacdLine_divergen && BlMa200;
  }

  async ABMA200_macdCrossBL_SELL(
    last: StockData,
    prev: StockData,
  ): Promise<boolean> {
    if (!last || !prev) return false; // safety
    const ABMa200 = last.MA200 > last.close;
    return ABMa200 && (await this.macdCrossBL(last, prev));
  }

  async RSI_28(last: StockData, prev: StockData): Promise<boolean> {
    if (!last || !prev) return false; // safety
    const RSI28 = last.RSI < 28 || prev.RSI < 28;
    const RSIUP = last.RSI > prev.RSI;
    return RSI28 && RSIUP;
  }

  async BlMA200_MA50_BUY(last: StockData, prev: StockData): Promise<boolean> {
    if (!last || !prev) return false; // safety
    const BlMa200 = last.MA200 > last.close;
    const abMa50 = last.high > last.MA50 && prev.low < prev.MA50;
    const MacdLine_divergen = last.divergence > 0;
    return abMa50 && MacdLine_divergen && BlMa200;
  }

  async StochRSIBuy_HOLD(
    last: StockData,
    prev: StockData,
  ): Promise<{ upside: boolean; upside80: boolean ,lowWatch_buyOp,highWatch_sellOp,LLW_BuyOp,SLW_BuyOp}> {
    if (!last || !prev) return { upside: false, upside80: false, lowWatch_buyOp: false, highWatch_sellOp: false ,LLW_BuyOp:false, SLW_BuyOp:false}; // safety
    const stockRSILAUP = last.StochRSI_K - last.StochRSI_D > 0;
    const stockRSIPRUP = prev.StochRSI_K - prev.StochRSI_D > 0;
    const compare2day = stockRSILAUP >= stockRSIPRUP;
    const inrange2080 = last.StochRSI_K < 0.8 && prev.StochRSI_K < 0.8 && last.StochRSI_K > 0.2 && prev.StochRSI_K > 0.2;
    const lowWatch_buyOp = last.StochRSI_K < 0.2 || prev.StochRSI_K < 0.2;
    const LLW_BuyOp = last.StochRSI_K < 0.1 || prev.StochRSI_K < 0.1;
    const SLW_BuyOp = last.StochRSI_K < 0.05 || prev.StochRSI_K < 0.05;
    const highWatch_sellOp = last.StochRSI_K > 0.85 || prev.StochRSI_K > 0.85;
    const macdBuy = last.MACDLine > last.SignalLine
    return {
      upside: stockRSILAUP && compare2day,
      upside80: stockRSILAUP && stockRSIPRUP && inrange2080,
      lowWatch_buyOp:lowWatch_buyOp && stockRSILAUP,
      highWatch_sellOp :highWatch_sellOp && !stockRSILAUP,
      LLW_BuyOp:LLW_BuyOp && stockRSILAUP,
      SLW_BuyOp:SLW_BuyOp && stockRSILAUP
    };
  }

  async StochRSICross(
    last: StockData,
    prev: StockData,
  ): Promise<{ crossUp: boolean; crossDo: boolean }> {
    if (!last || !prev) return { crossUp: false, crossDo: false }; // safety
    const stockRSILast = last.StochRSI_K - last.StochRSI_D;
    const stockRSIPrev = prev.StochRSI_K - prev.StochRSI_D;
    const crossUp =
      stockRSILast >= 0 &&
      stockRSIPrev <= 0 &&
      (last.MACDLine < 0 ||
        last.SignalLine < 0 ||
        prev.MACDLine < 0 ||
        prev.SignalLine < 0);
    const crossDo = stockRSILast <= 0 && stockRSIPrev >= 0;
    return {
      crossUp,
      crossDo,
    };
  }

  async BuyOnly_StochRSICrossAB200(
    last: StockData,
    prev: StockData,
  ): Promise<{
    CrUpAll: boolean;ContinueUp:boolean;
    CrUpMacdBl0: boolean;
    PriceCrMA200: boolean;
    PriceCrMA100: boolean;
    PriceCrMA50: boolean;
    macdCrAB: boolean;
    RSI15up: boolean;
    RSI20up: boolean;
    RSI25up: boolean;
    RSI30up: boolean;
  }> {
    if (!last || !prev)
      return {
        CrUpAll: false,ContinueUp: false,
        CrUpMacdBl0: false,
        PriceCrMA200: false,
        PriceCrMA100: false,
        PriceCrMA50: false,
        macdCrAB: false,
        RSI15up: false,
        RSI20up: false,
        RSI25up: false,
        RSI30up: false,
      }; // safety
    const lastAb50 = last.MA50 > last.close;
    const lastBl200 = last.MA200 > last.close;
    // if (lastAb50)
    //   return {
    //     CrUpAll: false,
    //     CrUpMacdBl0: false,
    //     PriceCrMA200: false,
    //     PriceCrMA100: false,
    //     macdCrAB: false,
    //   }; // safety
    const MACDbelow0 =
      last.MACDLine < 0 ||
      last.SignalLine < 0 ||
      prev.MACDLine < 0 ||
      prev.SignalLine < 0;
    const stockRSILast = last.StochRSI_K - last.StochRSI_D;
    const stockRSIPrev = prev.StochRSI_K - prev.StochRSI_D;
    const CrUpAll = stockRSILast >= 0 && stockRSIPrev <= 0;
    const ContinueUp = stockRSILast >= 0
    const CrUpMacdBl0 = CrUpAll && MACDbelow0;
    const PriceCrMA200 = await this.priceAbMA200BUY(last, prev);
    // const PriceCrMA100 = await this.priceAbMABUY(last, prev, 'MA100') && lastBl200;
    // const PriceCrMA50 = await this.priceAbMABUY(last, prev, 'MA50') && lastBl200;    
    const PriceCrMA100 = await this.priceAbMABUY(last, prev, 'MA100')
    const PriceCrMA50 = await this.priceAbMABUY(last, prev, 'MA50')
    const macdCrAB = await this.macdCrossAB(last, prev);
    // const RSI15up = last.RSI > 15 && prev.RSI < 15;
    // const RSI20up = last.RSI > 20 && prev.RSI < 20;
    // const RSI25up = last.RSI > 25 && prev.RSI < 25;
    // const RSI30up = last.RSI > 30 && prev.RSI < 30;
    const RSI15up = last.RSI < 15 
    const RSI20up = last.RSI < 20 && last.RSI >= 15
    const RSI25up = last.RSI < 25 && last.RSI >= 20
    const RSI30up = last.RSI < 30 && last.RSI >= 25
    return {
      CrUpAll,ContinueUp,
      CrUpMacdBl0,
      PriceCrMA200,
      PriceCrMA100,
      PriceCrMA50,
      macdCrAB,RSI15up,RSI20up,RSI25up,RSI30up
    };
  }

  async priceAbMABUY(
    last: StockData,
    prev: StockData,
    maType: 'MA100' | 'MA200' |'MA50' | 'MA20' | 'MA10' | 'MA5',
  ): Promise<boolean> {
    if (!last || !prev) return false; // safety

    const lastAbMA = last.high > last[maType]; // Check if the last high is above the MA
    const prevBlMA = prev.low < prev[maType]; // Check if the previous low is below the MA

    return lastAbMA && prevBlMA;
  }

  shouldRunTradingLogicUS(
    timeframe: string,
    logger
  ): boolean {
    const now = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
    });
    if (!this.isMarketOpen()) {
      logger.log(
        `🕒 Market closed — skipping ${timeframe} check (${now} ET)`,
      );
      return false;
    }
  
    logger.log(
      `✅ Market open — running ${timeframe} trading logic (${now} ET)`,
    );
  
    return true;
  }

  combineUnique(...arrays) {
    return [...new Set(arrays.flat())];
  }

  async writeAbove2BillionToFile(tickers,filename = 'above5billion') {
    // write to file
    const fs = require('fs');
    const filePath = filename+'.json';
    fs.writeFile(filePath, JSON.stringify(tickers, null, 2), (err) => {
      if (err) {
        console.error('Error writing to file:', err);
      } else {
        console.log(`Above 5 billion tickers saved to ${filePath}`);
      }
    });
  }

  TurnDateToUnderFM(inputDate: string): string { //"2025-10-07 13:30:00";
    const formatted = inputDate.replace(/[-:\s]/g, "_");
    return formatted; // Output: "2025_10_07_13_30_00"
  }
  TurnDateToDashFormat(inputDate: string): string {
    // "2025_10_07_13_30_00"
    const parts = inputDate.split("_");
  
    const formatted = `${parts[0]}-${parts[1]}-${parts[2]} ${parts[3]}:${parts[4]}:${parts[5]}`;
    return formatted; // "2025-10-07 13:30:00"
  }

  getKeysFromLastN(data: any, n: number = 3): string[] {
    const latestDates = Object.keys(data)
      .sort()        // lexicographically correct for your format
      .reverse()     // newest first
      .slice(0, n);
    
    console.log(latestDates)
    return [...new Set(
      latestDates.flatMap(date => Object.keys(data[date] || {}))
    )];
  }

  getMACDRange(data: any[]) {
    const values = data
      .map(item => item.MACDLine)
      .filter(value => value != null);
  
    if (!values.length) {
      return {
        min: null,
        max: null,
        mid: null,
      };
    }
  
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mid = (min + max) / 2;
  
    return { min, max, mid };
  }

  getSlackMessageLink(
    channel: string,
    ts: string,
    workspace: string = 'myworkspace',
  ): string {
    return `<https://${workspace}.slack.com/archives/${channel}/p${ts.replace('.', '')} |View Signal>`;
  }


  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  
  async sendBatchNotification(
    type: 'START' | 'END',
    timeframe: string,
    webhooks: string[],
    service:any,
    delayMs = 1000,
  ): Promise<void> {
    const today = this.getCSTTime();
    const message = `${type}+${timeframe}+${today}+${type}${'='.repeat(50)}`;
  
    for (const hook of webhooks) {
      try {
        console.log(`Sending notification to ${hook}: ${message}`);
        await service.sendSlackNotification(message, hook);
        await this.sleep(delayMs);
      } catch (error) {
        console.log(error)
        console.error(`Failed to send notification to ${hook}`, error);
      }
    }
    // const sendBatchNotification = async (type: 'START' | 'END') => {
    //   const message = `${type}+4hour+${today}+${type}${'='.repeat(32)}`;
    //   await Promise.all(
    //     webhooks.map((hook) =>
    //       this.webhooksService.sendSlackNotification(message, hook),
    //     ),
    //   );
    // };
  }
  markdownToSlack(markdown) {
  return markdown
    // Convert headings
    .replace(/^#{1,6}\s+\*\*(.*?)\*\*$/gm, '\n*$1*\n')
    .replace(/^#{1,6}\s+(.*?)$/gm, '\n*$1*\n')

    // Convert bold
    .replace(/\*\*(.*?)\*\*/g, '*$1*')

    // Convert markdown links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<$2|$1>')

    // Convert horizontal rules
    .replace(/^---+$/gm, '\n──────────\n')

    // Convert bullet lists
    .replace(/^\s*[-*+]\s+/gm, '• ')

    // Convert numbered lists
    .replace(/^\s*(\d+)\.\s+/gm, '$1. ')

    // Remove non-breaking spaces
    .replace(/\u00A0/g, ' ')

    // Collapse excessive blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  }

  async CHECKBULL_BEAR_ReTurnText(
    ticker: string,
    timeframe: string,
    fullData:StockData[]
  ) {
    const [
      lastData,
      secondLastData,
      thirdLastData,
      fourthLastData,
      fifthLastData,
      sixthLastData,
    ] = fullData.slice(-6).reverse();
    const aboveOrBelowma50 = lastData.low > lastData.MA50
    const macdCrossAB = lastData.divergence > 0 && secondLastData.divergence < 0
    const macdCrossBL = lastData.divergence < 0 && secondLastData.divergence > 0
    let text = ''
    const macdGreenOrRed = lastData.divergence > 0 ?'BUYY🟢🟢':'SELL🔴🔴'
    const getMACross = (
      lastData: StockData,
      secondLastData: StockData,
      period: keyof StockData
    ) => {
      if (
        lastData.close > lastData[period] &&
        secondLastData.close < secondLastData[period]
      ) {
        return 'CR_AB';
      }
    
      if (
        lastData.close < lastData[period] &&
        secondLastData.close > secondLastData[period]
      ) {
        return 'CR_BL';
      }
      if (
        lastData.close > lastData[period] ){
        return 'AB';
      }
      if (
        lastData.close < lastData[period] ){
        return 'BL';
      }
      return '';
    };
    const crMA50Text = getMACross(lastData, secondLastData, 'MA50')
    const crMA120Text = getMACross(lastData, secondLastData, 'MA120')
    const crMA200Text = getMACross(lastData, secondLastData, 'MA200')
    const crMA50 = crMA50Text==='CR_AB'? '`CrAbMA50🟢🟢`':crMA50Text==='AB'?'50AB🟢':'CrBlMA50🔴';
    const crMA120 = crMA120Text ==='CR_AB' && crMA50Text==='AB'? '`CrAbMA50CrAbMA120🟢🟢`':crMA120Text==='AB'?'120AB🟢':'CrBlMA120🔴';
    const crMA200 = crMA200Text ==='CR_AB' && crMA50Text==='AB' && crMA120Text==='AB' ? '`CrAbMA50CrAbMA120CrAbMA200🟢🟢`':crMA200Text==='AB'?'200AB🟢':'CrBlMA200🔴';
    const crSignal = `${crMA50}${crMA120}${crMA200}${lastData.MA50_Angle}`
    const isGreenOrRed = lastData.close > lastData.open ?'bar_🟢_green':lastData?.close < lastData?.open ?'bar_🔴_red':'';
    if(macdCrossAB){
      text = aboveOrBelowma50?'*macdCr_N🟢AB🟢🟢BUYY🟢🟢🟢BUY_CALL_NOW_🟢*':'*macdCr_N🔴BL50_BUYY🟢🟢🟢🔴🔴*'
    }else if(macdCrossBL){
      text = aboveOrBelowma50?'*macdCrossNBL-🔴🔴🔴AB_SELL🔴🔴🔴*':'macdCrossNBL-SELLLLLLLL-DAY-🔴🔴🔴PUT_NOW_SELL🔴🔴🔴'
    }else if(aboveOrBelowma50){
      text = `*BUY🟢🟢AB🟢🟢${macdGreenOrRed}*(MA50:${lastData.MA50})`
    }else{
      text = `*SELL🔴🔴BL🔴🔴${macdGreenOrRed}*(MA50:${lastData.MA50})`
    }
    // by volume
    const avgVolume =  (
        secondLastData.volume +
        thirdLastData.volume +
        fourthLastData.volume +
        fifthLastData.volume +
        sixthLastData.volume
      ) / 5;
    const compareV = lastData.volume/secondLastData.volume
    const volumeUP = (lastData.volume > avgVolume *1.5 && lastData.close > lastData.open && lastData.divergence > 0) ? `|BIG_🟡🟡_VOL *${compareV?.toFixed(2)}*`:''
    return `*${ticker}* *${timeframe}* =${text}|(${lastData.divergence})|${isGreenOrRed}${volumeUP}${crSignal}==${lastData.date}=*${lastData.close}*`
  } 

  async CHECKBULL_BEAR_processTickers(
    stockService,
    webhooksService,
    ticker: string,
    timeframe: string,
    postToCSLRE
  ) {
    // Prepare ticker promises with concurrency limit
    let data = await stockService.TwReveseNOAPI(ticker, timeframe);
    if (!Array.isArray(data) || data.length < 2) {
      await this.sendBatchNotification('START',`${true?'TwReveseNOAPI':'POLYGON2'}-`+`<https://new-site-pwa.web.app/?stockTicker=${ticker}&endpoint=po&timeframe=1day|${ticker}>`,[this.Z_US_SL_.OR4],webhooksService,500);
      return;
    }
    const getText = await this.CHECKBULL_BEAR_ReTurnText(ticker,timeframe,data)
    const checkSym = (ticker==='QQQ'||ticker === 'SPY')
    if(checkSym){
      await webhooksService.sendSlackNotification(`${getText}=*CLICK_CALL*`, postToCSLRE.channel)
    }else{
      await webhooksService.reply_SLack(
        postToCSLRE.channel,
        postToCSLRE.ts,
        `======${getText}=*CLICK_CALL*======`
      )
    }

  } async catch (error) {
    // Send error notification and log the error
  }

  getCSTTime() {
    return new Date().toLocaleString('sv-SE', {
      timeZone: 'America/Chicago',
      hour12: false,
    }).slice(0, 16);
  }
}