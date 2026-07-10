import type { AxiosResponse } from 'axios'
import client from './client'
import type { PaymentMethod, PaymentMethodRequest } from '../types'

export const getPaymentMethods = (): Promise<AxiosResponse<PaymentMethod[]>> =>
  client.get('/payment-methods')

export const createPaymentMethod = (data: PaymentMethodRequest): Promise<AxiosResponse<PaymentMethod>> =>
  client.post('/payment-methods', data)

export const updatePaymentMethod = (id: string, data: PaymentMethodRequest): Promise<AxiosResponse<PaymentMethod>> =>
  client.put(`/payment-methods/${id}`, data)

export const deletePaymentMethod = (id: string): Promise<AxiosResponse<void>> =>
  client.delete(`/payment-methods/${id}`)
