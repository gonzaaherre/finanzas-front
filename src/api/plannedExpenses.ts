import type { AxiosResponse } from 'axios'
import client from './client'
import type { PlannedExpense, PlannedExpenseRequest, MarkPaidRequest } from '../types'

export const getPlannedExpenses = (year: number, month: number): Promise<AxiosResponse<PlannedExpense[]>> =>
  client.get('/planned-expenses', { params: { year, month } })

export const createPlannedExpense = (data: PlannedExpenseRequest): Promise<AxiosResponse<PlannedExpense>> =>
  client.post('/planned-expenses', data)

export const updatePlannedExpense = (id: string, data: PlannedExpenseRequest): Promise<AxiosResponse<PlannedExpense>> =>
  client.put(`/planned-expenses/${id}`, data)

export const deletePlannedExpense = (id: string): Promise<AxiosResponse<void>> =>
  client.delete(`/planned-expenses/${id}`)

export const markPlannedExpensePaid = (id: string, data: MarkPaidRequest): Promise<AxiosResponse<PlannedExpense>> =>
  client.post(`/planned-expenses/${id}/mark-paid`, data)

export const unmarkPlannedExpensePaid = (id: string): Promise<AxiosResponse<PlannedExpense>> =>
  client.post(`/planned-expenses/${id}/unmark-paid`)

export const copyPlannedExpensesFromPrevious = (year: number, month: number): Promise<AxiosResponse<PlannedExpense[]>> =>
  client.post('/planned-expenses/copy-from-previous', null, { params: { year, month } })
