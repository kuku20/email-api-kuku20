import { PartialType } from '@nestjs/mapped-types';
import { CreateStockUserDto } from './create-stock-user.dto';

export class UpdateStockUserDto extends PartialType(CreateStockUserDto) {}
