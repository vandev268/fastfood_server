import { createZodDto } from 'nestjs-zod'
import {
  ForgotPasswordBodySchema,
  GoogleAuthResSchema,
  LoginBodySchema,
  LoginResSchema,
  LogoutBodySchema,
  RefreshTokenBodySchema,
  RefreshTokenResSchema,
  RegisterBodySchema,
  RegisterResSchema,
  SendOTPBodySchema,
  SendOTPResSchema
} from './auth.model'

export class SendOTPBodyDTO extends createZodDto(SendOTPBodySchema) {}
export class SendOTPResDTO extends createZodDto(SendOTPResSchema) {}
export class RefreshTokenBodyDTO extends createZodDto(RefreshTokenBodySchema) {}
export class RefreshTokenResDTO extends createZodDto(RefreshTokenResSchema) {}
export class RegisterBodyDTO extends createZodDto(RegisterBodySchema) {}
export class RegisterResDTO extends createZodDto(RegisterResSchema) {}
export class LoginBodyDTO extends createZodDto(LoginBodySchema) {}
export class LoginResDTO extends createZodDto(LoginResSchema) {}
export class LogoutBodyDTO extends createZodDto(LogoutBodySchema) {}
export class ForgotPasswordBodyDTO extends createZodDto(ForgotPasswordBodySchema) {}
export class GoogleAuthResDTO extends createZodDto(GoogleAuthResSchema) {}
