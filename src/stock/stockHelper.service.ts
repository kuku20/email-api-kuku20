import { Injectable, NotAcceptableException } from '@nestjs/common';

@Injectable()
export class StockHelperService {
  async returnNewData(dataIn: any) {
    dataIn = await this.calculateMovingAverage(dataIn, 5, 'MA5');
    dataIn = await this.calculateMovingAverage(dataIn, 10, 'MA10');
    dataIn = await this.calculateMovingAverage(dataIn, 20, 'MA20');
    dataIn = await this.calculateMovingAverage(dataIn, 50, 'MA50');
    dataIn = await this.calculateMovingAverage(dataIn, 100, 'MA100');
    dataIn = await this.calculateMovingAverage(dataIn, 200, 'MA200');
    dataIn = await this.calculateRSI(dataIn);
    dataIn = await this.calculateMACD(dataIn);
    return dataIn
    .sort(
      (a: { date: string }, b: { date: string }) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }

  async calculateMovingAverage(
    data: any[],
    windowSize: number,
    maLabel: string,
  ) {
    if(!data?.length){
      return []
    }
    for (let i = 0; i < data.length; i++) {
      if (i >= windowSize - 1) {
        let windowData = data.slice(i - windowSize + 1, i + 1);
        let sum = windowData.reduce(
          (acc: any, val: { close: any }) => acc + val?.close,
          0,
        );
        let average = (sum / windowSize).toFixed(2);
        data[i - windowSize + 1][maLabel] = parseFloat(average);
      } else {
        // data[i][maLabel] = null; // Not enough data for MA
      }
    }
    return data;
  }

  async calculateRSI(data: any[], period = 14) {
    if(!data?.length){
      return []
    }
    let gains = [];
    let losses = [];
    let rsiArray = [];

    // Calculate gains and losses
    for (let i = 0; i < data.length; i++) {
      let change = data[i]?.close - data[i + 1]?.close;
      if (change > 0) {
        gains.push(change);
        losses.push(0);
      } else {
        gains.push(0);
        losses.push(Math.abs(change));
      }
    }
    // Calculate the first average gain and loss
    let avgGain =
      gains.slice(0, period).reduce((acc, val) => acc + val, 0) / period;
    let avgLoss =
      losses.slice(0, period).reduce((acc, val) => acc + val, 0) / period;

    // Calculate the RSI for the rest of the days
    for (let i = period; i < data?.length; i++) {
      // Update the average gain and loss
      avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;

      // Calculate RS (Relative Strength)
      let rs = avgGain / avgLoss;

      // Calculate RSI
      let rsi = 100 - 100 / (1 + rs);

      // Add RSI to the array
      rsiArray.push(rsi);
    }

    // Add RSI values to the data array
    return data.map((item: any, index: string | number) => ({
      ...item,
      RSI: rsiArray[index],
    }));
  }
  async calculateMACD(
    data: any[],
    shortPeriod = 12,
    longPeriod = 26,
    signalPeriod = 9,
  ) {
    if(!data?.length){
      return []
    }
    // Calculate the short and long EMAs
    let shortEMA = await this.calculateEMA(data, shortPeriod);
    let longEMA = await this.calculateEMA(data, longPeriod);
    // Calculate the MACD line (difference between short and long EMA)
    let macdLine = [];
    for (let i = 0; i < data.length; i++) {
      macdLine[i] = shortEMA[i + shortPeriod - 1] - longEMA[i + longPeriod - 1];
    }
    // Calculate the Signal line (9-period EMA of the MACD line)
    let signalLine = await this.calculateEMA(
      macdLine
        .filter((value) => value !== 'N/A')
        .map((val, idx) => ({ close: val })),
      signalPeriod,
    );
    // Add the MACD and Signal line to the data
    let result = data.map((item: any, index: number) => {
      let macd = macdLine[index];
      let signal = signalLine[index + signalPeriod - 1];
      let histogram =
        macd !== 'N/A' && signal !== undefined ? macd - signal : 'N/A';

      return {
        ...item,
        MACDLine: macd,
        SignalLine: signal !== undefined ? signal : 'N/A',
        MACDHistogram: histogram,
      };
    });

    return result;
  }

  async calculateEMA(data: any[], period: number) {
    if(!data?.length){
      return []
    }
    let multiplier = 2 / (period + 1);
    let emaArray = [];
    let sum = 0;

    // Start by calculating the simple moving average for the first period
    for (let i = 0; i < period; i++) {
      sum += data[i]?.close;
    }

    let sma = sum / period;
    emaArray[period - 1] = sma;

    // Calculate the remaining EMAs
    for (let i = period; i < data.length; i++) {
      let ema =
        (data[i]?.close - emaArray[i - 1]) * multiplier + emaArray[i - 1];
      emaArray[i] = ema;
    }
    return emaArray;
  }

  async getDateRanges(startDateStr:string, endDateStr:string, daysPerRange:number) {
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
    console.log(ranges)
    return ranges;
  }

  async calculateDaysBetween(startDateStr:string, endDateStr:string) {
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

async transformData(data: any[]) {
  const transformedData = {};

  data.forEach((entry: { date: string; }) => {
    const dateKey = entry.date.split(" ")[0]; // Extracting the date part
    if (!transformedData[dateKey]) {
      transformedData[dateKey] = []; // Initializing a list for that date
    }
    transformedData[dateKey].push(entry); // Appending the entry to the list
  });

  return transformedData;
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
}
