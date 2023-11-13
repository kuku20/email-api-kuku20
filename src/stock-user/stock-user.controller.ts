import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { StockUserService } from './stock-user.service';
import { WatchListDto,CreateStockUserDto,UpdateStockUserDto } from './dto';
import { JwtGuard } from 'src/auth/guard';
import { UserAuthGuard } from './guard';

@UseGuards(JwtGuard)

@Controller('stock-user')
export class StockUserController {
  constructor(private readonly stockUserService: StockUserService) {}

  // @UseGuards(UserAuthGuard)
  @Post('/user-list')
  createStockUser(@Body() createStockUserDto: CreateStockUserDto) {
    return this.stockUserService.createStockUser(createStockUserDto);
  }

  @UseGuards(UserAuthGuard)
  @Delete('/user-list/:userId')
  removeUlist(@Param('userId') userId: string) {
    return this.stockUserService.removeStockUserList(userId);
  }

  @UseGuards(UserAuthGuard)
  @Get('/user-list/:userId')
  getUserListById(@Param('userId') userId: string) {
    return this.stockUserService.findStockUserByUserId(userId);
  }

  @UseGuards(UserAuthGuard)
  @Patch('user-list/:userId')
  updateUlist(@Param('userId') userId: string, @Body() updateStockUserDto: UpdateStockUserDto) {
    return this.stockUserService.updateUlist(userId, updateStockUserDto);
  }

  @Post('/watchlist')
  createWatchList(@Body() createwatchListDto: WatchListDto) {
    return this.stockUserService.createWatchList(createwatchListDto);
  }

  @UseGuards(UserAuthGuard)
  @Delete('/watchlist/:userId/:listId')
  removewatchlist(@Param('listId') listId: string) {
    return this.stockUserService.removeList(listId);
  }

  @UseGuards(UserAuthGuard)
  @Patch('/watchlist/:userId/:listId')
  updatewatchlist(@Param('listId') listId: string, @Body() updateStockUserDto: Partial<WatchListDto>) {
    return this.stockUserService.updatewatchList(listId, updateStockUserDto);
  }

  @Get('/all-lists')
  findAllStockUsers() {
    return this.stockUserService.findAllStockUsers();
  }

  @Get('/all-watchlists')
  findAllwatchlists() {
    return this.stockUserService.findAllwatchlists();
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateStockUserDto: UpdateStockUserDto) {
  //   return this.stockUserService.update(+id, updateStockUserDto);
  // }

  
}
