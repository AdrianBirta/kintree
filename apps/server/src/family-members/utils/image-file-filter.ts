import { BadRequestException } from '@nestjs/common';
import type { File as MulterFile } from 'multer';

export function imageFileFilter(
  _req: unknown,
  file: MulterFile,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!file.mimetype.match(/^image\/(jpg|jpeg|png|webp|gif)$/)) {
    return callback(new BadRequestException('Doar fișiere imagine (jpg, png, webp, gif) sunt permise.'), false);
  }
  callback(null, true);
}