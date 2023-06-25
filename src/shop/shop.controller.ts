import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ShopService } from './shop.service';



@Controller('api/products')
export class ShopController {
  constructor(private shopService: ShopService) {}

  @Get('/test')
  getAllProducts() {
    return this.shopService.getAllProducts();
  }

  @Get('/test/:id')
  getId(@Param('id') id: string) {
    return this.shopService.getProductWithRelations(parseInt(id));
  }

  @Get('/brands')
  getBrands() {
    return this.shopService.getBrands();
  }

  @Get('/types')
  getTypes() {
    return this.shopService.getTypes();
  }

  @Get('')
  async getPaginatedProducts(
    @Query('pageIndex', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(6), ParseIntPipe) limit: number,
    @Query('sort') sort: string,
    @Query('brandId') brandId: number,
    @Query('typeId') typeId: number,

  ) {
    return this.shopService.getPaginatedProducts(page, limit, sort,brandId, typeId);
  }

  @Get('/:id')
  getProduct(@Param('id') id: string) {
    return this.shopService.getProduct(parseInt(id));
  }
}
