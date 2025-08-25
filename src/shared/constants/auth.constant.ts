export const VerificationCode = {
  Register: 'Register',
  ForgotPassword: 'ForgotPassword',
  Login2FA: 'Login2FA',
  Disable2FA: 'Disable2FA'
} as const

export const AuthGuard = {
  Bearer: 'Bearer',
  // PaymentAPIKey: 'PaymentAPIKey',
  None: 'None'
} as const

export type AuthGuardType = (typeof AuthGuard)[keyof typeof AuthGuard]

export const AuthCondition = {
  And: 'And',
  Or: 'Or'
} as const

export type AuthConditionType = (typeof AuthCondition)[keyof typeof AuthCondition]
