import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductBrand } from 'src/entity/ProductBrands.entity';
import { Product } from 'src/entity/product.entity';
import { ProductType } from 'src/entity/productTypes.entity';
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
        try {
          const seedDataPath = 'src/SeedData/brands.json'; // Update with the actual path to the JSON file
    
          const seedData = fs.readFileSync(seedDataPath, 'utf8');
          const parsedData: ProductBrand[] = JSON.parse(seedData);
    
          const productTypes = parsedData.map(data => this.brandRepo.create(data));
          await this.brandRepo.save(productTypes);
    
          console.log('ProductBrand types seeded successfully!');
        } catch (error) {
          console.error('Error seeding product types:', error);
        }
        try {
          const seedDataPath = 'src/SeedData/types.json'; // Update with the actual path to the JSON file
    
          const seedData = fs.readFileSync(seedDataPath, 'utf8');
          const parsedData: ProductType[] = JSON.parse(seedData);
    
          const productTypes = parsedData.map(data => this.typeRepo.create(data));
          await this.typeRepo.save(productTypes);
    
          console.log('ProductType types seeded successfully!');
        } catch (error) {
          console.error('Error seeding product types:', error);
        }
      }


}
