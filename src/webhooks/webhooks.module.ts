import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  controllers: [WebhooksController],
  providers: [WebhooksService],
  imports:[JwtModule.register({})]
})
export class WebhooksModule {}
