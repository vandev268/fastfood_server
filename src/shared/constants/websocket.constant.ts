export const Namespace = {
  Review: 'review',
  Order: 'order',
  Product: 'product',
  Table: 'table',
  Tag: 'tag',
  Category: 'category',
  Reservation: 'reservation'
} as const

export type NamespaceType = (typeof Namespace)[keyof typeof Namespace]

export const Room = {
  Manage: 'manage-room',
  Review: 'review-room',
  Order: 'order-room',
  Product: 'product-room',
  Table: 'table-room',
  Tag: 'tag-room',
  Category: 'category-room',
  Reservation: 'reservation-room'
} as const

export type RoomType = (typeof Room)[keyof typeof Room]
