import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common'
import { AuthService } from './auth.service'
import {
  ForgotPasswordBodyDTO,
  GoogleAuthResDTO,
  LoginBodyDTO,
  LoginResDTO,
  LogoutBodyDTO,
  RefreshTokenBodyDTO,
  RefreshTokenResDTO,
  RegisterBodyDTO,
  RegisterResDTO,
  SendOTPBodyDTO,
  SendOTPResDTO
} from './auth.dto'
import { ZodSerializerDto } from 'nestjs-zod'
import { Response } from 'express'
import envConfig from 'src/shared/config'
import { Public } from 'src/shared/decorators/auth.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  @Public()
  @ZodSerializerDto(SendOTPResDTO)
  sendOTP(@Body() body: SendOTPBodyDTO) {
    return this.authService.sendOTP(body)
  }

  @Post('refresh-token')
  @Public()
  @ZodSerializerDto(RefreshTokenResDTO)
  refreshToken(@Body() body: RefreshTokenBodyDTO) {
    return this.authService.refreshToken(body)
  }

  @Post('register')
  @Public()
  @ZodSerializerDto(RegisterResDTO)
  register(@Body() body: RegisterBodyDTO) {
    return this.authService.register(body)
  }

  @Post('login')
  @Public()
  @ZodSerializerDto(LoginResDTO)
  login(@Body() body: LoginBodyDTO) {
    return this.authService.login(body)
  }

  @Post('logout')
  @ZodSerializerDto(MessageResDTO)
  logout(@Body() body: LogoutBodyDTO) {
    return this.authService.logout(body.refreshToken)
  }

  @Post('forgot-password')
  @Public()
  @ZodSerializerDto(MessageResDTO)
  forgotPassword(@Body() body: ForgotPasswordBodyDTO) {
    return this.authService.forgotPassword(body)
  }

  @Get('google-link')
  @Public()
  @ZodSerializerDto(GoogleAuthResDTO)
  googleLink() {
    return this.authService.generateAuthUrl()
  }

  @Get('google/callback')
  @Public()
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      const { accessToken, refreshToken, user } = await this.authService.googleCallback(code)
      return res.redirect(
        `${envConfig.GOOGLE_CLIENT_REDIRECT_URI}?accessToken=${accessToken}&refreshToken=${refreshToken}&profile=${encodeURIComponent(JSON.stringify(user))}`
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred during Google authentication.'
      return res.redirect(`${envConfig.GOOGLE_CLIENT_REDIRECT_URI}?errorMessage=${encodeURIComponent(message)}`)
    }
  }
}
