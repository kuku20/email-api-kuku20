import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ShopService } from './shop.service';
import { PaginationDto } from 'src/dto/paginatiorDto';
import { ProductOutputDto } from 'src/dto/productOutputDto';

@Controller('shop/products')
export class ShopController {
    constructor(private shopService : ShopService){}

    // @Get()
    // getAllProducts(){
    //     return this.shopService.getAllProducts()
    // }

    @Get('/brands')
    getBrands(){
        return this.shopService.getBrands()
    }

    @Get('/types')
    getTypes(){
        return this.shopService.getTypes()
    }

    @Get('')
    async getPaginatedProducts(
      @Query('pageIndex',new DefaultValuePipe(1), ParseIntPipe) page: number,
      @Query('pageSize', new DefaultValuePipe(6),ParseIntPipe) limit: number,
    ): Promise<PaginationDto<ProductOutputDto>> {
      return this.shopService.getPaginatedProducts(page, limit);
    }



    @Get('/:id')
    getProduct(@Param('id') id: string) {
        return this.shopService.getProduct(parseInt(id))
    }


}
