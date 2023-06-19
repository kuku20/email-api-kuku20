import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/sent')
  async postMail(@Body() data: any){
    return await this.appService.sendMail(data);
  }

  @Post('/sentEmail')
  async createEmail(
    @Body('name') name: string,
    @Body('email') email: string,
    @Body('message') message: string,
  ) {
    return this.appService.createEmail(name, email, message);
  }
}
