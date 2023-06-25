import { Module } from '@nestjs/common';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/entity/product.entity';
import { ProductBrand } from 'src/entity/ProductBrands.entity';
import { ProductType } from 'src/entity/productTypes.entity';
import { SeedService } from 'src/SeedData/shop.service';

@Module({
  controllers: [ShopController],
  providers: [ShopService, SeedService],
  imports: [TypeOrmModule.forFeature([Product, ProductBrand, ProductType])],
})
export class ShopModule {}
