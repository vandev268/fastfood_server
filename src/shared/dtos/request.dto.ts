import { createZodDto } from 'nestjs-zod'
import { PaginationQuerySchema } from '../models/request.model'

export class PaginationQueryDTO extends createZodDto(PaginationQuerySchema) {}
