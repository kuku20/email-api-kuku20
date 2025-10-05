import { Module } from '@nestjs/common';
import { MegaController } from './mega.controller';

@Module({
  controllers: [MegaController],
})
export class MegaModule {}
