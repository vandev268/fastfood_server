import path from 'path'

export const DeleteMode = 'soft' as const

export const UPLOAD_FILE_DIR = path.resolve('upload')

export const OrderBy = {
  Asc: 'asc',
  Desc: 'desc'
} as const

export const SortBy = {
  Price: 'price',
  CreatedAt: 'createdAt',
  Sale: 'sale'
} as const
