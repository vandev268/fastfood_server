import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { v4 as uuidv4 } from 'uuid'
import envConfig from '../config'
import { AccessTokenPayloadType, RefreshTokenPayloadType } from '../types/token.type'

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  signAccessToken(payload: Omit<AccessTokenPayloadType, 'iat' | 'exp'>) {
    return this.jwtService.signAsync(
      {
        ...payload,
        uuid: uuidv4()
      },
      {
        secret: envConfig.JWT_ACCESS_TOKEN_SECRET,
        expiresIn: envConfig.JWT_ACCESS_TOKEN_EXPIRES_IN,
        algorithm: 'HS256'
      }
    )
  }

  signRefreshToken(payload: Omit<RefreshTokenPayloadType, 'iat' | 'exp'> & { exp?: number }) {
    if (!payload.exp) {
      return this.jwtService.signAsync(
        {
          ...payload,
          uuid: uuidv4()
        },
        {
          secret: envConfig.JWT_REFRESH_TOKEN_SECRET,
          expiresIn: envConfig.JWT_REFRESH_TOKEN_EXPIRES_IN,
          algorithm: 'HS256'
        }
      )
    } else {
      return this.jwtService.signAsync(
        {
          ...payload,
          uuid: uuidv4()
        },
        {
          secret: envConfig.JWT_REFRESH_TOKEN_SECRET,
          algorithm: 'HS256'
        }
      )
    }
  }

  signAccessAndRefreshToken(payload: Omit<AccessTokenPayloadType, 'iat' | 'exp'> & { exp?: number }) {
    if (!payload.exp) {
      return Promise.all([this.signAccessToken(payload), this.signRefreshToken({ userId: payload.userId })])
    } else {
      return Promise.all([
        this.signAccessToken({
          userId: payload.userId,
          roleId: payload.roleId,
          roleName: payload.roleName
        }),
        this.signRefreshToken({ userId: payload.userId, exp: payload.exp })
      ])
    }
  }

  verifyAccessToken(token: string) {
    return this.jwtService.verifyAsync<AccessTokenPayloadType>(token, {
      secret: envConfig.JWT_ACCESS_TOKEN_SECRET
    })
  }

  verifyRefreshToken(token: string) {
    return this.jwtService.verifyAsync<RefreshTokenPayloadType>(token, {
      secret: envConfig.JWT_REFRESH_TOKEN_SECRET
    })
  }
}
