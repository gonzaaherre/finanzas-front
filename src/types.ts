export type ExpenseType = 'PERSONAL' | 'WORK'

export interface Currency {
  code: string
  name: string
  symbol: string
}

export interface Category {
  id: string
  name: string
  color: string | null
  icon: string | null
  isDefault: boolean
  createdAt: string
}

export interface PaymentMethod {
  id: string
  name: string
  isDefault: boolean
  createdAt: string
}

export interface RecurringExpense {
  id: string
  amount: number
  type: ExpenseType
  description: string | null
  category: Category | null
  paymentMethod: PaymentMethod | null
  currency: Currency
  dayOfMonth: number
  startDate: string
  totalInstallments: number | null
  active: boolean
  createdAt: string
}

export interface Expense {
  id: string
  amount: number
  type: ExpenseType
  description: string | null
  date: string
  createdAt: string
  updatedAt: string
  category: Category | null
  paymentMethod: PaymentMethod | null
  currency: Currency
  recurringExpenseId: string | null
  installmentNumber: number | null
  totalInstallments: number | null
}

export interface User {
  email: string
  name: string
}

export interface UserResponse {
  id: string
  email: string
  name: string
  createdAt: string
}

export interface AuthResponse {
  token: string
  refreshToken: string
  email: string
  name: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface CategoryRequest {
  name: string
  color?: string
  icon?: string
}

export interface PaymentMethodRequest {
  name: string
}

export interface RecurringExpenseRequest {
  amount: number
  type: ExpenseType
  description?: string | null
  categoryId?: string | null
  paymentMethodId?: string | null
  currencyCode: string
  dayOfMonth: number
  startDate: string
  totalInstallments?: number | null
}

export interface RecurringExpenseUpdateRequest {
  amount: number
  type: ExpenseType
  description?: string | null
  categoryId?: string | null
  paymentMethodId?: string | null
  currencyCode: string
  dayOfMonth: number
}

export interface ExpenseRequest {
  amount: number
  type: ExpenseType
  description?: string | null
  date: string
  categoryId?: string | null
  paymentMethodId?: string | null
  currencyCode: string
}

export interface ExpenseFilters {
  from?: string
  to?: string
  type?: ExpenseType
  categoryId?: string
  paymentMethodId?: string
}

export interface MonthlyIncome {
  id: string
  amount: number
  year: number
  month: number
  createdAt: string
  updatedAt: string
  currency: Currency
}

export interface MonthlyIncomeRequest {
  amount: number
  currencyCode: string
}

export type PlannedExpenseStatus = 'PLANNED' | 'PAID'

export interface PlannedExpense {
  id: string
  amount: number
  type: ExpenseType
  description: string | null
  year: number
  month: number
  status: PlannedExpenseStatus
  category: Category | null
  paymentMethod: PaymentMethod | null
  currency: Currency
  expenseId: string | null
  createdAt: string
}

export interface PlannedExpenseRequest {
  amount: number
  type: ExpenseType
  description?: string | null
  year: number
  month: number
  categoryId?: string | null
  paymentMethodId?: string | null
  currencyCode: string
}

export interface MarkPaidRequest {
  date?: string
  amount?: number
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export interface MessageResponse {
  message: string
}
