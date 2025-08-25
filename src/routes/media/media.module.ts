import { Module } from '@nestjs/common'
import { MediaController } from './media.controller'
import { MulterModule } from '@nestjs/platform-express'
import { existsSync, mkdirSync } from 'fs'
import multer from 'multer'
import { generateRandomFilename } from 'src/shared/helpers'
import { MediaService } from './media.service'
import { UPLOAD_FILE_DIR } from 'src/shared/constants/common.constant'

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_FILE_DIR)
  },
  filename: function (req, file, cb) {
    const newFilename = generateRandomFilename(file.originalname)
    cb(null, newFilename)
  }
})

@Module({
  imports: [
    MulterModule.register({
      storage
    })
  ],
  providers: [MediaService],
  controllers: [MediaController]
})
export class MediaModule {
  constructor() {
    if (!existsSync(UPLOAD_FILE_DIR)) {
      mkdirSync(UPLOAD_FILE_DIR, { recursive: true })
    }
  }
}
