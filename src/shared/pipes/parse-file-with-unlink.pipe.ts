import { BadRequestException, HttpException, Injectable, PipeTransform } from '@nestjs/common'
import { unlink } from 'fs/promises'

@Injectable()
export class FilesValidationPipe implements PipeTransform {
  private readonly allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  private readonly maxFileSize = 50 * 1024 * 1024

  async transform(files: Express.Multer.File[]) {
    try {
      if (!files || !Array.isArray(files) || files.length === 0) {
        throw new BadRequestException('No files uploaded')
      }

      for (const file of files) {
        if (!this.allowedMimeTypes.includes(file.mimetype)) {
          throw new BadRequestException(
            `Invalid file type: ${file.originalname} (${file.mimetype}). Allowed types: ${this.allowedMimeTypes.join(', ')}`
          )
        }

        if (file.size > this.maxFileSize) {
          throw new BadRequestException(
            `File too large: ${file.originalname}. Max size is ${this.maxFileSize / (1024 * 1024)}MB`
          )
        }
      }

      return files
    } catch (error) {
      await Promise.all(files.map((file) => unlink(file.path)))
      if (error instanceof HttpException) {
        throw error
      }
      throw new BadRequestException('File validation failed')
    }
  }
}
