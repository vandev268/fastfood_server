import { Prisma } from '@prisma/client'
import { extname } from 'path'
import { v4 as uuidv4 } from 'uuid'

export function isNotFoundPrismaError(error: any): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'
}

export function isUniquePrismaError(error: any): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

export const generateRandomString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    result += characters[randomIndex]
  }
  return result
}

export const generateRandomFilename = (filename: string) => {
  const ext = extname(filename)
  return `${uuidv4()}${ext}`
}

export const getOrderIdByPaymentInfo = (orderInfo: string) => {
  const orderId = orderInfo.split('#')[1]
  return Number(orderId)
}
