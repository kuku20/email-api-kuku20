import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { File } from 'megajs';

@Controller('mega')
export class MegaController {
  @Get('stream')
  async stream(@Query('url') megaUrl: string, @Res() res: Response) {
    if (!megaUrl) {
      return res.status(HttpStatus.BAD_REQUEST).send('Missing "url" parameter');
    }
  
    try {
      const file = File.fromURL(megaUrl);
      await file.loadAttributes();
      const fileSize = file.size;
  
      const range = res.req.headers.range;
  
      if (!range) {
        // Stream full file
        res.writeHead(200, { 'Content-Length': fileSize, 'Content-Type': 'video/mp4' });
        return file.download({}).pipe(res); // ✅ pass empty options object
      }
  
      // Parse range "bytes=start-end"
      const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
      const chunkSize = end - start + 1;
  
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });
  
      // ✅ Pass start/end options
      file.download({ start, end }).pipe(res);
    } catch (err) {
      console.error(err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Failed to stream MEGA file');
    }
  }
  
}
