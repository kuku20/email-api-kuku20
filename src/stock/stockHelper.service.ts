import { Injectable } from '@nestjs/common';

@Injectable()
export class StockHelperService {
  async returnNewData(dataIn: any) {
    dataIn = await this.calculateMovingAverage(dataIn, 20, 'MA20');
    dataIn = await this.calculateMovingAverage(dataIn, 50, 'MA50');
    dataIn = await this.calculateMovingAverage(dataIn, 200, 'MA200');
    dataIn = await this.calculateRSI(dataIn);
    dataIn = await this.calculateMACD(dataIn);
    return dataIn;
  }

  async calculateMovingAverage(
    data: any[],
    windowSize: number,
    maLabel: string,
  ) {
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
    for (let i = period; i < data.length; i++) {
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
}
