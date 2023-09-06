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

@Controller('contentful')
export class ContentfulController {
  constructor(private readonly contentfulService: ContentfulService) {}
  @Get('/profolio')
  async profolioData(@Param('preview') preview: boolean) {
    try {
      const data = await this.contentfulService.fetchData(preview);
      return data;
    } catch (error) {
      // Handle errors here
      throw error;
    }
  }
}
