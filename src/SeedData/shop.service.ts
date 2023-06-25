import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductBrand } from 'src/shop/ProductBrands.entity';
import { Product } from 'src/shop/product.entity';
import { ProductType } from 'src/shop/productTypes.entity';
import { Repository } from 'typeorm';
import * as fs from 'fs';
@Injectable()
export class SeedService {
    constructor(
        @InjectRepository(Product)
        private productRepo: Repository<Product>,
        @InjectRepository(ProductBrand)
        private brandRepo: Repository<ProductBrand>,
        @InjectRepository(ProductType)
        private typeRepo: Repository<ProductType>,
      ) {}

      async seedData() {
        try {
          const seedDataPath = 'src/SeedData/products.json'; // Update with the actual path to the JSON file
    
          const seedData = fs.readFileSync(seedDataPath, 'utf8');
          const parsedData: Product[] = JSON.parse(seedData);
    
          const productTypes = parsedData.map(data => this.productRepo.create(data));
          await this.productRepo.save(productTypes);
    
          console.log('Product types seeded successfully!');
        } catch (error) {
          console.error('Error seeding product types:', error);
        }
        // const seedData = [
        //   {
        //     "Id": 1,
        //     "Name": "Boards"
        //   },
        //   {
        //     "Id": 2,
        //     "Name": "Hats"
        //   },
        //   {
        //     "Id": 3,
        //     "Name": "Boots"
        //   },
        //   {
        //     "Id": 4,
        //     "Name": "Gloves"
        //   }
        // ]
    
        // const productTypes = seedData.map(data => this.typeRepo.create(data));
        // await this.typeRepo.save(productTypes);
        // console.log('Product types seeded successfully!');
      }


}
