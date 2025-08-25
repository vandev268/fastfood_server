export type AccessTokenPayloadType = {
  userId: number
  roleId: number
  roleName: string
  iat: number
  exp: number
}

export type RefreshTokenPayloadType = {
  userId: number
  iat: number
  exp: number
}
