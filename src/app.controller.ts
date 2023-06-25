import { Body, Controller, Get, Post  , UseInterceptors,
  ClassSerializerInterceptor,} from '@nestjs/common';
import { AppService } from './app.service';
import { EmailDto } from './emailDto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('/sent')
  async postMail(@Body() data: EmailDto){
    return await this.appService.sendMail(data);
  }

  // @Post('/sentEmail')
  // async createEmail(
  //   @Body('name') name: string,
  //   @Body('email') email: string,
  //   @Body('message') message: string,
  // ) {
  //   return this.appService.createEmail(name, email, message);
  // }
}
