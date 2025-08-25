import { S3 } from '@aws-sdk/client-s3'
import { Injectable } from '@nestjs/common'
import envConfig from '../config'
import { Upload } from '@aws-sdk/lib-storage'
import { readFileSync } from 'fs'

@Injectable()
export class S3Service {
  private s3: S3
  constructor() {
    this.s3 = new S3({
      region: envConfig.AWS_S3_REGION,
      credentials: {
        accessKeyId: envConfig.AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: envConfig.AWS_S3_SECRET_KEY
      }
    })
  }

  async uploadFile(filename: string, filepath: string, contentType: string) {
    try {
      const parallelUploads3 = new Upload({
        client: this.s3,
        params: {
          Bucket: envConfig.AWS_S3_BUCKET_NAME,
          Key: filename,
          Body: readFileSync(filepath),
          ContentType: contentType
        },
        queueSize: 4,
        partSize: 1024 * 1024 * 5,
        leavePartsOnError: false
      })

      return parallelUploads3.done()
    } catch (error) {
      console.log(error)
      throw new Error('Failed to upload file to S3')
    }
  }

  async deleteFiles(urls: string[]) {
    const objects = urls.map((url) => ({
      Key: url.split('amazonaws.com/')[1]
    }))
    try {
      const params = {
        Bucket: envConfig.AWS_S3_BUCKET_NAME,
        Delete: {
          Objects: objects
        }
      }

      await this.s3.deleteObjects(params)
    } catch {
      throw new Error('Failed to delete files from S3')
    }
  }
}
