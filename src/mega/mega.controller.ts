import { Controller, Get, Query, Res, HttpStatus, Req } from '@nestjs/common';
import { Request, Response } from 'express';
import { File } from 'megajs';

@Controller('stream')
export class MegaController {
  @Get('audio')
  async stream(@Query('url') megaUrl: string, @Req() req: Request, @Res() res: Response) {
    const megaRoot = 'https://mega.nz/file/'
    const file = File.fromURL(megaRoot+megaUrl);
    await file.loadAttributes();
    const fileSize = file.size;
    const range = req.headers.range;
    if (!range) {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      });
      return file.download({}).pipe(res);
    }
  
    const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
    const chunkSize = end - start + 1;
  
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    });
  
    file.download({ start, end }).pipe(res);
  }
}  
