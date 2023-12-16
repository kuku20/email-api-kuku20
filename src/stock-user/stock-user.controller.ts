import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { StockUserService } from './stock-user.service';
import { WatchListDto, CreateStockUserDto, UpdateWatchListDto} from './dto';
import { JwtGuard } from 'src/auth/guard';
import { AdminUserAuthGuard, UserAuthGuard } from './guard';

@UseGuards(JwtGuard)
@Controller('stock-user')
export class StockUserController {
  constructor(private readonly stockUserService: StockUserService) {}

  @UseGuards(UserAuthGuard)
  @Post('/user-list')
  createStockUser(@Body() createStockUserDto: CreateStockUserDto) {
    return this.stockUserService.createStockUser(createStockUserDto);
  }

  @UseGuards(UserAuthGuard)
  @Post('/watchlist')
  createWatchList(@Body() createwatchListDto: WatchListDto) {
    return this.stockUserService.createWatchList(createwatchListDto);
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

  @UseGuards(AdminUserAuthGuard)
  @Patch('user-list/:userId')
  updateUlist(
    @Param('userId') userId: string,
    @Body() updateStockUserDto: Partial<CreateStockUserDto>,
  ) {
    return this.stockUserService.updateUlist(userId, updateStockUserDto);
  }

  @UseGuards(UserAuthGuard)
  @Delete('/watchlist/:userId/:listId')
  removewatchlist(@Param('userId') userId: string,@Param('listId') listId: string) {
    return this.stockUserService.removeList(userId,listId);
  }

  @UseGuards(UserAuthGuard)
  @Patch('/watchlist/:userId/:listId')
  updatewatchlist(
    @Param('listId') listId: string,
    @Body() updateStockUserDto: UpdateWatchListDto,
  ) {
    return this.stockUserService.updatewatchList(listId, updateStockUserDto);
  }

  @UseGuards(AdminUserAuthGuard)
  @Get('/all-lists')
  findAllStockUsers() {
    return this.stockUserService.findAllStockUsers();
  }

  @UseGuards(AdminUserAuthGuard)
  @Get('/all-watchlists')
  findAllwatchlists() {
    return this.stockUserService.findAllwatchlists();
  }

  @Get('/all-listTickers')
  findAllUserListTickers() {
    return this.stockUserService.findAllUserListTickers();
  }
}
