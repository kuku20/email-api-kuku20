import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { blogPageQuery, leetCodeQuery } from './contenful.constant';
@Injectable()
export class ContentfulService {
  private readonly graphRoot =
    'https://graphql.contentful.com/content/v1/spaces/9gvoywspr3ip/environments';
  private readonly graphlBase = 'https://graphql.contentful.com/content/v1/spaces';
  private readonly graphqlEndpoint = `${this.graphRoot}/master`;
  constructor(private readonly configService: ConfigService) {}
  async fetchData(
    preview: boolean,
    env: string = 'master',
    account: string = 'DB',
  ) {
    const token = this.configService.get<string>('CONTENTFUL_TOKEN_' + account); // Retrieve the token from environment variables
    const spaces = this.configService.get<string>('CONTENTFUL_SPACES_' + account);

    const grahqlUrl = `${this.graphlBase}/${spaces}/environments/${env}`;
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await axios.post(
        grahqlUrl,
        { query: blogPageQuery, variables: { preview } },
        { headers },
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getLeetCode(preview: boolean) {
    const token = this.configService.get<string>('CONTENTFUL_TOKEN_DB'); // Retrieve the token from environment variables
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await axios.post(
        this.graphqlEndpoint,
        { query: leetCodeQuery, variables: { preview } },
        { headers },
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }
}
