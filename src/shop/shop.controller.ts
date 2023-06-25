import { Controller, Get, Param } from '@nestjs/common';
import { ShopService } from './shop.service';

@Controller('shop/products')
export class ShopController {
    constructor(private shopService : ShopService){}

    @Get()
    getAllProducts(){
        return this.shopService.getAllProducts()
    }

    @Get('/brands')
    getBrands(){
        return this.shopService.getBrands()
    }

    @Get('/types')
    getTypes(){
        return this.shopService.getTypes()
    }

    @Get('/:id')
    getProduct(@Param('id') id: string) {
        return this.shopService.getProduct(parseInt(id))
    }


}
