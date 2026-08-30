
import {
  Body,
  Controller,
  Post
} from '@nestjs/common';

import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {

  constructor(
    private readonly messagesService: MessagesService
  ) {}

  @Post()
  async sendMessage(
    @Body()
    body: {
      workspaceId: string;
      channelId: string;
      userId: string;
      userName: string;
      text: string;
    }
  ) {
console.log(123)
    return this.messagesService.sendMessage(
      body.workspaceId,
      body.channelId,
      body.userId,
      body.userName,
      body.text
    );
  }
}

