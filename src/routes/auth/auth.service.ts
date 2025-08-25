import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException
} from '@nestjs/common'
import { AuthRepo } from './auth.repo'
import {
  FindVerificationCodeType,
  ForgotPasswordBodyType,
  LoginBodyType,
  RefreshTokenBodyType,
  RegisterBodyType,
  SendOTPBodyType
} from './auth.model'
import { TokenService } from 'src/shared/services/token.service'
import { OtpService } from 'src/shared/services/otp.service'
import { addMilliseconds } from 'date-fns'
import envConfig from 'src/shared/config'
import ms from 'ms'
import { UtilService } from 'src/shared/services/util.service'
import { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis'
import { v4 as uuidv4 } from 'uuid'
import { UserStatus } from 'src/shared/constants/user.constant'
import { SharedUserRepo } from 'src/shared/repositories/shared-user.repo'
import { SharedRoleRepo } from 'src/shared/repositories/shared-role.repo'
import { VerificationCode } from 'src/shared/constants/auth.constant'
import { generateRandomString, isUniquePrismaError } from 'src/shared/helpers'
import { RoleName } from 'src/shared/constants/role.constant'

@Injectable()
export class AuthService {
  private oAuth2Client: OAuth2Client

  constructor(
    private readonly authRepo: AuthRepo,
    private readonly sharedUserRepo: SharedUserRepo,
    private readonly tokenService: TokenService,
    private readonly otpService: OtpService,
    private readonly sharedRoleRepo: SharedRoleRepo,
    private readonly utilService: UtilService
  ) {
    this.oAuth2Client = new google.auth.OAuth2(
      envConfig.GOOGLE_CLIENT_ID,
      envConfig.GOOGLE_CLIENT_SECRET,
      envConfig.GOOGLE_REDIRECT_URI
    )
  }

  private async verifyVerificationCodeExists(payload: FindVerificationCodeType) {
    const verificationCode = await this.authRepo.findVerificationCode(payload)
    if (!verificationCode) {
      throw new NotFoundException('Verification code not found')
    }
    if (verificationCode.expiresAt < new Date()) {
      await this.authRepo.deleteVerificationCode(payload)
      throw new UnprocessableEntityException({
        message: 'Verification code has expired',
        path: 'code'
      })
    }
    return verificationCode
  }

  private async verifyRefreshTokenExists(token: string) {
    const refreshToken = await this.authRepo.findRefreshToken(token)
    if (!refreshToken) {
      throw new NotFoundException('Refresh token not found')
    }
    if (refreshToken.expiresAt < new Date()) {
      await this.authRepo.deleteRefreshToken(token)
      throw new UnauthorizedException('Refresh token has expired')
    }
    return refreshToken
  }

  async sendOTP(data: SendOTPBodyType) {
    // 1. Kiểm tra email đã tồn tại hay chưa
    const user = await this.sharedUserRepo.findFirst({
      email: data.email,
      deletedAt: null
    })
    if (data.type === VerificationCode.Register && user) {
      throw new UnprocessableEntityException({
        message: 'Email already exists',
        path: 'email'
      })
    }
    if (data.type === VerificationCode.ForgotPassword && !user) {
      throw new NotFoundException('User not found')
    }

    // 2. Tạo mã OTP
    const code = this.otpService.generateOTP()
    await this.authRepo.createVerificationCode({
      email: data.email,
      code,
      type: data.type,
      expiresAt: addMilliseconds(new Date(), ms(envConfig.OTP_EXPIRES_IN as ms.StringValue))
    })

    // 3. Gửi mã OTP
    const { error } = await this.otpService.sendOTP({
      to: data.email,
      subject: data.type === VerificationCode.Register ? 'Xác thực tài khoản' : 'Đặt lại mật khẩu',
      code
    })
    if (error) {
      throw new UnprocessableEntityException({
        message: 'Failed to send OTP',
        path: 'code'
      })
    }
    return { message: 'Sent OTP successfully', code }
  }

  async refreshToken(data: RefreshTokenBodyType) {
    try {
      const decodedRefreshToken = await this.tokenService.verifyRefreshToken(data.refreshToken)
      const tokenInDb = await this.authRepo.findRefreshTokenWithUserRole(data.refreshToken)
      if (!tokenInDb) {
        throw new NotFoundException('Refresh token not found')
      }
      await this.authRepo.deleteRefreshToken(data.refreshToken)

      const [accessToken, refreshToken] = await this.tokenService.signAccessAndRefreshToken({
        userId: tokenInDb.userId,
        roleId: tokenInDb.user.roleId,
        roleName: tokenInDb.user.role.name,
        exp: decodedRefreshToken.exp
      })

      await this.authRepo.createRefreshToken({
        userId: tokenInDb.userId,
        token: refreshToken,
        expiresAt: new Date(decodedRefreshToken.exp * 1000) // Date:ms and exp:s
      })

      return {
        accessToken,
        refreshToken
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new UnauthorizedException()
    }
  }

  async register(data: RegisterBodyType) {
    const verificationCodePayload = { email: data.email, type: VerificationCode.Register }
    await this.verifyVerificationCodeExists({ email_type: verificationCodePayload })
    try {
      const [hashedPassword, clientRoleId] = await Promise.all([
        this.utilService.hash(data.password),
        this.sharedRoleRepo.getClientRoleId()
      ])
      const [user] = await Promise.all([
        this.authRepo.createUser({
          email: data.email,
          password: hashedPassword,
          name: data.name,
          phoneNumber: data.phoneNumber,
          roleId: clientRoleId
        }),
        this.authRepo.deleteVerificationCode({
          email_type: verificationCodePayload
        })
      ])

      const [accessToken, refreshToken] = await this.tokenService.signAccessAndRefreshToken({
        userId: user.id,
        roleId: user.roleId,
        roleName: user.role.name
      })

      const { userId, exp } = await this.tokenService.verifyRefreshToken(refreshToken)
      await this.authRepo.createRefreshToken({
        userId,
        token: refreshToken,
        expiresAt: new Date(exp * 1000) // Date:ms and exp:s
      })

      return {
        tokens: {
          accessToken,
          refreshToken
        },
        user
      }
    } catch (error) {
      if (isUniquePrismaError(error)) {
        throw new UnprocessableEntityException({
          message: 'Email already exists',
          path: 'email'
        })
      }
      throw error
    }
  }

  async login(data: LoginBodyType) {
    const user = await this.sharedUserRepo.findFirstWithRole({ email: data.email, deletedAt: null })
    if (!user) {
      throw new UnprocessableEntityException({
        message: 'Email  mật khẩu không đúng',
        path: 'password'
      })
    }

    if (user.status === UserStatus.Blocked) {
      throw new UnprocessableEntityException({
        message: 'Tài khoản của bạn đã bị khóa',
        path: 'status'
      })
    }

    const isValidPassword = await this.utilService.compare(data.password, user.password)
    if (!isValidPassword) {
      throw new UnprocessableEntityException({
        message: 'Email hoặc mật khẩu không đúng',
        path: 'password'
      })
    }
    const [accessToken, refreshToken] = await this.tokenService.signAccessAndRefreshToken({
      userId: user.id,
      roleId: user.roleId,
      roleName: user.role.name
    })

    const { userId, exp } = await this.tokenService.verifyRefreshToken(refreshToken)
    await this.authRepo.createRefreshToken({
      userId,
      token: refreshToken,
      expiresAt: new Date(exp * 1000) // Date:ms and exp:s
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, totpSecret, ...rest } = user
    return {
      tokens: {
        accessToken,
        refreshToken
      },
      user: rest
    }
  }

  async logout(token: string) {
    try {
      await this.tokenService.verifyRefreshToken(token)
      await this.verifyRefreshTokenExists(token)
      await this.authRepo.deleteRefreshToken(token)
      return { message: 'Logout successful' }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new UnauthorizedException()
    }
  }

  async forgotPassword(data: ForgotPasswordBodyType) {
    await this.verifyVerificationCodeExists({
      email_type: { email: data.email, type: VerificationCode.ForgotPassword }
    })
    try {
      const user = await this.sharedUserRepo.findFirst({ email: data.email, deletedAt: null })
      if (!user) {
        throw new NotFoundException('User not found')
      }
      const hashedPassword = await this.utilService.hash(data.password)
      await this.sharedUserRepo.changePassword({ where: { id: user.id }, password: hashedPassword })
      return { message: 'Reset password successful' }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new BadRequestException()
    }
  }

  generateAuthUrl() {
    const url = this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile'],
      include_granted_scopes: true
    })

    return {
      url
    }
  }

  async googleCallback(code: string) {
    try {
      const { tokens } = await this.oAuth2Client.getToken(code)
      this.oAuth2Client.setCredentials(tokens)

      const oauth2 = google.oauth2({ version: 'v2', auth: this.oAuth2Client })
      const { data } = await oauth2.userinfo.get()

      if (!data.email) {
        throw new UnauthorizedException('Google account does not have an email')
      }

      const user = await this.sharedUserRepo.findDetail({ email: data.email, deletedAt: null })
      if (!user) {
        const clientRoleId = await this.sharedRoleRepo.getClientRoleId()
        const hashedPassword = await this.utilService.hash(uuidv4())

        const newUser = await this.authRepo.createUser({
          email: data.email,
          password: hashedPassword,
          name: data.name ?? `User ${generateRandomString(1)}`,
          phoneNumber: '',
          roleId: clientRoleId
        })

        const [accessToken, refreshToken] = await this.tokenService.signAccessAndRefreshToken({
          userId: newUser.id,
          roleId: newUser.roleId,
          roleName: RoleName.Client
        })

        const { userId, exp } = await this.tokenService.verifyRefreshToken(refreshToken)
        await this.authRepo.createRefreshToken({
          userId: userId,
          token: refreshToken,
          expiresAt: new Date(exp * 1000) // Date:ms and exp:s
        })
        return {
          accessToken,
          refreshToken,
          user: newUser
        }
      } else {
        const [accessToken, refreshToken] = await this.tokenService.signAccessAndRefreshToken({
          userId: user.id,
          roleId: user.roleId,
          roleName: RoleName.Client
        })

        const { userId, exp } = await this.tokenService.verifyRefreshToken(refreshToken)
        await this.authRepo.createRefreshToken({
          userId: userId,
          token: refreshToken,
          expiresAt: new Date(exp * 1000) // Date:ms and exp:s
        })
        return {
          accessToken,
          refreshToken,
          user
        }
      }
    } catch {
      throw new UnauthorizedException('Google authentication failed')
    }
  }
}
