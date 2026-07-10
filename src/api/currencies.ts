import type { AxiosResponse } from 'axios'
import client from './client'
import type { Currency } from '../types'

export const getCurrencies = (): Promise<AxiosResponse<Currency[]>> =>
  client.get('/currencies')
