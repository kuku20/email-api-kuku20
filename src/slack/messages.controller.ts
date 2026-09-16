import { Body, Controller, Post } from '@nestjs/common';

import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('msg')
  async sendMessage(
    @Body()
    body: {
      workspaceId: string;
      channelId: string;
      userId: string;
      userName: string;
      text: string;
    },
  ) {
    await this.messagesService.sendMessage(
      body.workspaceId,
      body.channelId,
      body.userId,
      body.userName,
      body.text,
    );
    console.log(123);
    // await this.messagesService.sendNotificationToUser(
    //   'n90Q4DYyzQc8Ibv9Xw5xTmT1G5F3',
    //   'SMCI Alert',
    //   'SMCI 5min BUY 🟢',
    //   {
    //     ticker: 'SMCI',
    //     channelId: 'UdbaWlLJw4YmcY0QQezb',
    //   },
    // );
  }

  @Post('fcm-token') async saveFcmToken(
    @Body() body: { userId: string; token: string },
  ) {
    console.log('Received FCM token for user:', body.userId);
    return this.messagesService.saveFcmToken(body.userId, body.token);
  }
}
