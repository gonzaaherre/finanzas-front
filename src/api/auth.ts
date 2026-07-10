import type { AxiosResponse } from 'axios'
import client from './client'
import type {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
  ResetPasswordRequest,
} from '../types'

export const register = (data: RegisterRequest): Promise<AxiosResponse<AuthResponse>> =>
  client.post('/auth/register', data)

export const login = (data: LoginRequest): Promise<AxiosResponse<AuthResponse>> =>
  client.post('/auth/login', data)

export const forgotPassword = (data: ForgotPasswordRequest): Promise<AxiosResponse<MessageResponse>> =>
  client.post('/auth/forgot-password', data)

export const resetPassword = (data: ResetPasswordRequest): Promise<AxiosResponse<MessageResponse>> =>
  client.post('/auth/reset-password', data)
