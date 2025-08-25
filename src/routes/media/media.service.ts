import { Injectable } from '@nestjs/common'
import { unlink } from 'fs/promises'
import { S3Service } from 'src/shared/services/s3.service'

@Injectable()
export class MediaService {
  constructor(private readonly s3Service: S3Service) {}
  async uploadFiles(files: Array<Express.Multer.File>) {
    const data = await Promise.all(
      files.map((file) => {
        const filename = 'bases/' + file.filename
        const filepath = file.path
        const contentType = file.mimetype
        return this.s3Service.uploadFile(filename, filepath, contentType).then((res) => {
          return { url: res?.Location }
        })
      })
    )
    await Promise.all(files.map((file) => unlink(file.path)))
    return {
      data
    }
  }
}
