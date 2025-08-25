import { Injectable } from '@nestjs/common'
import { compare, hash } from 'bcrypt'

const saltRounds = 10

@Injectable()
export class UtilService {
  hash(content: string) {
    return hash(content, saltRounds)
  }

  compare(content: string, hash: string) {
    return compare(content, hash)
  }
}
