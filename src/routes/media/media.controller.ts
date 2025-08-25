import { Controller, Get, NotFoundException, Param, Post, Res, UploadedFiles, UseInterceptors } from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { MediaService } from './media.service'
import { ZodSerializerDto } from 'nestjs-zod'
import { UploadFilesResDTO } from './media.dto'
import { Response } from 'express'
import { UPLOAD_FILE_DIR } from 'src/shared/constants/common.constant'
import { Public } from 'src/shared/decorators/auth.decorator'
import { FilesValidationPipe } from 'src/shared/pipes/parse-file-with-unlink.pipe'

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}
  @Post('images/upload')
  @UseInterceptors(FilesInterceptor('files', 100))
  @ZodSerializerDto(UploadFilesResDTO)
  uploadFiles(@UploadedFiles(new FilesValidationPipe()) files: Array<Express.Multer.File>) {
    return this.mediaService.uploadFiles(files)
  }

  @Get('static/:filename')
  @Public()
  getStaticFile(@Param('filename') filename: string, @Res() res: Response) {
    return res.sendFile(`${UPLOAD_FILE_DIR}/${filename}`, (error) => {
      if (error) {
        const NotFound = new NotFoundException('File not found')
        res.status(NotFound.getStatus()).send(NotFound.getResponse())
      }
    })
  }
}
