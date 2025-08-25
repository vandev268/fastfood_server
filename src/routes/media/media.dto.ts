import { createZodDto } from 'nestjs-zod'
import { UploadFilesResSchema } from './media.model'

export class UploadFilesResDTO extends createZodDto(UploadFilesResSchema) {}
