import type { AxiosResponse } from 'axios'
import client from './client'
import type { RecurringExpense, RecurringExpenseRequest, RecurringExpenseUpdateRequest } from '../types'

export const getRecurringExpenses = (): Promise<AxiosResponse<RecurringExpense[]>> =>
  client.get('/recurring-expenses')

export const createRecurringExpense = (data: RecurringExpenseRequest): Promise<AxiosResponse<RecurringExpense>> =>
  client.post('/recurring-expenses', data)

export const updateRecurringExpense = (id: string, data: RecurringExpenseUpdateRequest): Promise<AxiosResponse<RecurringExpense>> =>
  client.put(`/recurring-expenses/${id}`, data)

export const cancelRecurringExpense = (id: string): Promise<AxiosResponse<void>> =>
  client.post(`/recurring-expenses/${id}/cancel`)
