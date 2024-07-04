import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { blogPageQuery, leetCodeQuery } from './contenful.constant';
@Injectable()
export class ContentfulService {
  private readonly graphRoot =
    'https://graphql.contentful.com/content/v1/spaces/9gvoywspr3ip/environments';
  private readonly graphqlEndpoint = `${this.graphRoot}/master`;
  private readonly graphqlEndpointProd = `${this.graphRoot}/prod`;
  private readonly graphqlEndpointDev = `${this.graphRoot}/dev`;
  constructor(private readonly configService: ConfigService) {}
  async fetchData(preview: boolean, env: string = 'master') {
    const token = this.configService.get<string>('CONTENTFUL_TOKEN'); // Retrieve the token from environment variables
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await axios.post(
        env === 'master'
          ? this.graphqlEndpoint
          : env === 'prod'
          ? this.graphqlEndpointProd
          : this.graphqlEndpointDev,
        { query: blogPageQuery, variables: { preview } },
        { headers },
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getLeetCode(preview: boolean) {
    const token = this.configService.get<string>('CONTENTFUL_TOKEN'); // Retrieve the token from environment variables
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
