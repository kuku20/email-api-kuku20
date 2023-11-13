import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { StockUserService } from './stock-user.service';
import { WatchListDto,CreateStockUserDto,UpdateStockUserDto } from './dto';

@Controller('stock-user')
export class StockUserController {
  constructor(private readonly stockUserService: StockUserService) {}

  @Post('/list')
  createStockUser(@Body() createStockUserDto: CreateStockUserDto) {
    return this.stockUserService.createStockUser(createStockUserDto);
  }

  @Post('/watchlist')
  createWatchList(@Body() createwatchListDto: WatchListDto) {
    return this.stockUserService.createWatchList(createwatchListDto);
  }

  @Get('/all-lists')
  findAllStockUsers() {
    return this.stockUserService.findAllStockUsers();
  }

  @Get('/all-watchlists')
  findAllwatchlists() {
    return this.stockUserService.findAllwatchlists();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stockUserService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStockUserDto: UpdateStockUserDto) {
    return this.stockUserService.update(+id, updateStockUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stockUserService.remove(+id);
  }
}
