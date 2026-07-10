import type { AxiosResponse } from 'axios'
import client from './client'
import type { MonthlyIncome, MonthlyIncomeRequest } from '../types'

export const getMonthlyIncome = (year: number, month: number): Promise<AxiosResponse<MonthlyIncome>> =>
  client.get(`/incomes/${year}/${month}`)

export const saveMonthlyIncome = (
  year: number,
  month: number,
  data: MonthlyIncomeRequest,
): Promise<AxiosResponse<MonthlyIncome>> =>
  client.put(`/incomes/${year}/${month}`, data)
