import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { blogPageQuery } from './contenful.constant'
@Injectable()
export class ContentfulService {
  private readonly graphqlEndpoint = 'https://graphql.contentful.com/content/v1/spaces/9gvoywspr3ip/environments/master';
  constructor(private readonly configService: ConfigService) {}
  async fetchData(preview: boolean) {
    const token = this.configService.get<string>('CONTENTFUL_TOKEN'); // Retrieve the token from environment variables
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await axios.post(
        this.graphqlEndpoint,
        { query:blogPageQuery, variables: { preview } },
        { headers }
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

