import { Module } from '@nestjs/common';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/entity/product.entity';
import { ProductBrand } from 'src/entity/ProductBrands.entity';
import { ProductType } from 'src/entity/productTypes.entity';

@Module({
  controllers: [ShopController],
  providers: [ShopService],
  imports: [TypeOrmModule.forFeature([Product, ProductBrand, ProductType])],
})
export class ShopModule {}
