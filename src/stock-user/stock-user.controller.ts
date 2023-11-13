import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { StockUserService } from './stock-user.service';
import { WatchListDto,CreateStockUserDto,UpdateStockUserDto } from './dto';

@Controller('stock-user')
export class StockUserController {
  constructor(private readonly stockUserService: StockUserService) {}

  @Post('/user-list')
  createStockUser(@Body() createStockUserDto: CreateStockUserDto) {
    return this.stockUserService.createStockUser(createStockUserDto);
  }

  @Delete('/user-list/:id')
  removelist(@Param('id') id: string) {
    return this.stockUserService.removeStockUserList(id);
  }

  @Post('/watchlist')
  createWatchList(@Body() createwatchListDto: WatchListDto) {
    return this.stockUserService.createWatchList(createwatchListDto);
  }

  @Delete('/watchlist/:id')
  removewatchlist(@Param('id') id: string) {
    return this.stockUserService.removeList(id);
  }



  @Get('/all-lists')
  findAllStockUsers() {
    return this.stockUserService.findAllStockUsers();
  }

  @Get('/all-watchlists')
  findAllwatchlists() {
    return this.stockUserService.findAllwatchlists();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStockUserDto: UpdateStockUserDto) {
    return this.stockUserService.update(+id, updateStockUserDto);
  }

  
}
