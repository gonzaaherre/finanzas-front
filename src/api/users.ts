import type { AxiosResponse } from 'axios'
import client from './client'
import type { UserResponse } from '../types'

export const getCurrentUser = (): Promise<AxiosResponse<UserResponse>> =>
  client.get('/users/me')
