import type { AxiosResponse } from 'axios'
import client from './client'
import type { Category, CategoryRequest } from '../types'

export const getCategories = (): Promise<AxiosResponse<Category[]>> =>
  client.get('/categories')

export const createCategory = (data: CategoryRequest): Promise<AxiosResponse<Category>> =>
  client.post('/categories', data)

export const updateCategory = (id: string, data: CategoryRequest): Promise<AxiosResponse<Category>> =>
  client.put(`/categories/${id}`, data)

export const deleteCategory = (id: string): Promise<AxiosResponse<void>> =>
  client.delete(`/categories/${id}`)
