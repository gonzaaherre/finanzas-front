import type { AxiosResponse } from 'axios'
import client from './client'
import type { Expense, ExpenseFilters, ExpenseRequest } from '../types'

export const getExpenses = (params?: ExpenseFilters): Promise<AxiosResponse<Expense[]>> =>
  client.get('/expenses', { params })

export const createExpense = (data: ExpenseRequest): Promise<AxiosResponse<Expense>> =>
  client.post('/expenses', data)

export const updateExpense = (id: string, data: ExpenseRequest): Promise<AxiosResponse<Expense>> =>
  client.put(`/expenses/${id}`, data)

export const deleteExpense = (id: string): Promise<AxiosResponse<void>> =>
  client.delete(`/expenses/${id}`)
