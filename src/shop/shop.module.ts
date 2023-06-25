import { Module } from '@nestjs/common';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/shop/product.entity';
import { ProductBrand } from 'src/shop/ProductBrands.entity';
import { ProductType } from 'src/shop/productTypes.entity';


@Module({
  controllers: [ShopController],
  providers: [ShopService],
  imports: [TypeOrmModule.forFeature([Product, ProductBrand, ProductType])],
})
export class ShopModule {}
