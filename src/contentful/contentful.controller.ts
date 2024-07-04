import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Session,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ContentfulService } from './contentful.service';
import { ContentfulDto } from './dto/env.dto';

@Controller('contentful')
export class ContentfulController {
  constructor(private readonly contentfulService: ContentfulService) {}
  
  @Get('/letcode')
  async leetCodeData(@Param('preview') preview: boolean) {
    try {
      const data = await this.contentfulService.getLeetCode(preview);
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }

  @Get('/profolio/:env')
  async profolioData2(
    @Param('preview') preview: boolean,
    @Param() params: ContentfulDto,
  ) {
    try {
      const data = await this.contentfulService.fetchData(preview, params.env);
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }
}
