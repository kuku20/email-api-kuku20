import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AlphavantageService } from './alphavantage.service';

@Controller('alphavantage')
export class AlphavantageController {
  constructor(private readonly alphavantageService: AlphavantageService) {}

  @Get('tc-po')
  async TC_POLYGON(
    @Query('symbol') symbol: string,
    @Query('interval') interval?: string,
  ) {
    return this.alphavantageService.fasfda(symbol, interval);
  }

  @Get('weekORmonthly')
  async weekORmonthly(
    @Query('symbol') symbol: string,
    @Query('seriesType') seriesType?: string,
  ) {
    return this.alphavantageService.weekORmonthly(symbol, seriesType);
  }

}
