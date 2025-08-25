import { SetMetadata } from '@nestjs/common'
import { AuthCondition, AuthConditionType, AuthGuard, AuthGuardType } from '../constants/auth.constant'

export const AUTH_GUARD_KEY = 'authGuard'
export type AuthGuardMetaType = {
  guardType: AuthGuardType[]
  options: { condition: AuthConditionType }
}

export const Auth = (guardType: AuthGuardType[], options?: { condition: AuthConditionType }) => {
  return SetMetadata(AUTH_GUARD_KEY, { guardType, options: options ?? { condition: AuthCondition.And } })
}

export const Public = () => Auth([AuthGuard.None])
