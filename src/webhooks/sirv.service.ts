import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { randomUUID } from 'crypto';

@Injectable()
export class SirvService {
  private readonly apiUrl = 'https://api.sirv.com/v2';

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly cdnUrl: string;

  private accessToken?: string;
  private tokenExpiresAt = 0;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.clientId =
      this.configService.getOrThrow<string>(
        'SIRV_CLIENT_ID',
      );

    this.clientSecret =
      this.configService.getOrThrow<string>(
        'SIRV_CLIENT_SECRET',
      );

    this.cdnUrl = this.configService
      .getOrThrow<string>('SIRV_CDN_URL')
      .replace(/\/$/, '');
  }

  /**
   * Reuse the token until shortly before it expires.
   */
  private async getToken(): Promise<string> {
    const now = Date.now();

    // Keep a 30-second safety buffer.
    if (
      this.accessToken &&
      now < this.tokenExpiresAt - 30_000
    ) {
      return this.accessToken;
    }

    try {
      const { data } = await axios.post<{
        token: string;
        expiresIn: number;
      }>(
        `${this.apiUrl}/token`,
        {
          clientId: this.clientId,
          clientSecret: this.clientSecret,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      this.accessToken = data.token;

      this.tokenExpiresAt =
        Date.now() + data.expiresIn * 1000;

      return this.accessToken;
    } catch (error: unknown) {
      throw new InternalServerErrorException(
        `Could not authenticate with Sirv: ${this.getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Upload an image and return its public URL.
   */
  async uploadImage(
    file: import('multer').File | Buffer,
  ): Promise<{
    success: boolean;
    filename: string;
    url: string;
  }> {
    if (!file) {
      throw new BadRequestException(
        'Image is required',
      );
    }
  
    // Support Buffer (Playwright/Puppeteer screenshot)
    const buffer = Buffer.isBuffer(file)
      ? file
      : file.buffer;
  
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException(
        'Image file is empty',
      );
    }
  
    const mimetype = Buffer.isBuffer(file)
      ? 'image/png'
      : file.mimetype;
  
    if (!mimetype.startsWith('image/')) {
      throw new BadRequestException(
        'Only image files are allowed',
      );
    }
  
    const extension = Buffer.isBuffer(file)
      ? 'png'
      : this.getExtension(file);
  
    const filename =
      `/uploads/${randomUUID()}.${extension}`;
  
    try {
      const token = await this.getToken();
  
      await axios.post(
        `${this.apiUrl}/files/upload`,
        buffer,
        {
          params: {
            filename,
          },
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': mimetype,
            'Content-Length': String(
              buffer.length,
            ),
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        },
      );
  
      return {
        success: true,
        filename,
        url: `${this.cdnUrl}${filename}`,
      };
    } catch (error: unknown) {
      throw new InternalServerErrorException(
        `Sirv upload failed: ${this.getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Delete one image using its Sirv path.
   *
   * Example:
   * /uploads/abc-123.png
   */
  async deleteImage(
    filename: string,
  ): Promise<{
    success: boolean;
    deleted: string;
  }> {
    if (!filename?.trim()) {
      throw new BadRequestException(
        'Filename is required',
      );
    }

    const normalizedFilename =
      filename.startsWith('/')
        ? filename
        : `/${filename}`;

    try {
      const token = await this.getToken();

      await axios.post(
        `${this.apiUrl}/files/delete`,
        {
          filename: normalizedFilename,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        success: true,
        deleted: normalizedFilename,
      };
    } catch (error: unknown) {
      throw new InternalServerErrorException(
        `Sirv delete failed: ${this.getErrorMessage(error)}`,
      );
    }
  }

  private getExtension(
    file: import('multer').File,
  ): string {
    const originalExtension =
      file.originalname
        .split('.')
        .pop()
        ?.toLowerCase();

    if (
      originalExtension &&
      /^[a-z0-9]+$/.test(
        originalExtension,
      )
    ) {
      return originalExtension;
    }

    const mimeExtensions: Record<
      string,
      string
    > = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
    };

    return (
      mimeExtensions[file.mimetype] ??
      'png'
    );
  }

  private getErrorMessage(
    error: unknown,
  ): string {
    if (axios.isAxiosError(error)) {
      const axiosError =
        error as AxiosError<{
          message?: string;
          error?: string;
        }>;

      return (
        axiosError.response?.data?.message ??
        axiosError.response?.data?.error ??
        `HTTP ${axiosError.response?.status ?? 'unknown'}`
      );
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error';
  }
}