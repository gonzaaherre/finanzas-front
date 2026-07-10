import { useState, useEffect, type ComponentType } from 'react'
import { isAxiosError } from 'axios'
import { getExpenses } from '../api/expenses'
import { getCurrencies } from '../api/currencies'
import { getMonthlyIncome, saveMonthlyIncome } from '../api/incomes'
import { getErrorMessage } from '../api/client'
import { TrendingUp, Receipt, Tag, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import type { Currency, Expense, MonthlyIncome } from '../types'

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MONTHS_FULL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
const labelCls = 'block text-xs font-medium text-gray-700 mb-1.5'

interface StatCardProps {
  label: string
  value: string | number
  icon: ComponentType<{ size?: number; className?: string }>
}

function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <Icon size={15} className="text-gray-400" />
      </div>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  )
}

interface CustomTooltipProps {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-md px-3 py-2 text-xs shadow-sm">
      <p className="text-gray-500 mb-0.5">{label}</p>
      <p className="font-medium text-gray-900">
        ${Number(payload[0].value).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
      </p>
    </div>
  )
}

const today = new Date()

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading]   = useState(true)
  const [currencies, setCurrencies]         = useState<Currency[]>([])
  const [viewDate, setViewDate]             = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [income, setIncome]                 = useState<MonthlyIncome | null>(null)
  const [incomeAmount, setIncomeAmount]     = useState('')
  const [incomeCurrency, setIncomeCurrency] = useState('ARS')
  const [incomeSaving, setIncomeSaving]     = useState(false)
  const [incomeError, setIncomeError]       = useState('')
  const [incomeSaved, setIncomeSaved]       = useState(false)

  const viewYear  = viewDate.getFullYear()
  const viewMonth = viewDate.getMonth()
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth()

  useEffect(() => {
    Promise.all([getExpenses(), getCurrencies()])
      .then(([expensesRes, currenciesRes]) => {
        setExpenses(expensesRes.data)
        setCurrencies(currenciesRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let cancelled = false
    setIncomeError('')
    setIncomeSaved(false)

    getMonthlyIncome(viewYear, viewMonth + 1)
      .then(res => res.data)
      .catch(err => {
        if (isAxiosError(err) && err.response?.status === 404) return null
        throw err
      })
      .then(incomeData => {
        if (cancelled) return
        setIncome(incomeData)
        setIncomeAmount(incomeData ? String(incomeData.amount) : '')
        setIncomeCurrency(incomeData ? incomeData.currency.code : 'ARS')
      })

    return () => { cancelled = true }
  }, [viewYear, viewMonth])

  const changeMonth = (delta: number) => {
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() + delta, 1))
  }

  const handleIncomeSave = async () => {
    setIncomeSaving(true)
    setIncomeError('')
    setIncomeSaved(false)
    try {
      const { data } = await saveMonthlyIncome(viewYear, viewMonth + 1, {
        amount: parseFloat(incomeAmount),
        currencyCode: incomeCurrency,
      })
      setIncome(data)
      setIncomeSaved(true)
    } catch (err) {
      setIncomeError(getErrorMessage(err, 'Error al guardar el ingreso'))
    } finally {
      setIncomeSaving(false)
    }
  }

  const monthExpenses = expenses
    .filter(e => {
      const d = new Date(e.date)
      return d.getMonth() === viewMonth && d.getFullYear() === viewYear
    })

  const totalMonth = monthExpenses.reduce((s, e) => s + Number(e.amount), 0)

  const chartData = MONTHS.map((name, i) => ({
    name,
    total: expenses
      .filter(e => {
        const d = new Date(e.date)
        return d.getMonth() === i && d.getFullYear() === today.getFullYear()
      })
      .reduce((s, e) => s + Number(e.amount), 0),
  }))

  const categoryCount: Record<string, number> = {}
  monthExpenses.forEach(e => {
    if (e.category) categoryCount[e.category.name] = (categoryCount[e.category.name] || 0) + 1
  })
  const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  if (loading) {
    return (
      <div className="p-4 sm:p-8 flex items-center gap-2 text-gray-400 text-sm">
        <span className="animate-spin inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full" />
        Cargando...
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="mb-7">
        <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-0.5">Resumen de tus finanzas</p>
      </div>

      {/* Month navigator */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => changeMonth(-1)}
          className="p-1.5 border border-gray-200 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-medium text-gray-900 w-36 text-center">
          {MONTHS_FULL[viewMonth]} {viewYear}
        </p>
        <button
          onClick={() => changeMonth(1)}
          className="p-1.5 border border-gray-200 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
        {!isCurrentMonth && (
          <button
            onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="text-sm text-blue-600 hover:underline"
          >
            Hoy
          </button>
        )}
      </div>

      {/* Monthly income */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">
          Ingreso de {MONTHS_FULL[viewMonth]} {viewYear}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[140px]">
            <label className={labelCls}>Monto</label>
            <input
              type="number" step="0.01" min="0.01"
              value={incomeAmount}
              onChange={e => setIncomeAmount(e.target.value)}
              className={inputCls}
              placeholder="0.00"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className={labelCls}>Moneda</label>
            <select value={incomeCurrency} onChange={e => setIncomeCurrency(e.target.value)} className={inputCls}>
              {currencies.map(c => (
                <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleIncomeSave}
            disabled={incomeSaving || !incomeAmount}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 w-full sm:w-auto"
          >
            {incomeSaving ? 'Guardando...' : income ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
        {incomeError && <p className="text-red-600 text-sm mt-2">{incomeError}</p>}
        {incomeSaved && !incomeError && <p className="text-green-600 text-sm mt-2">Ingreso guardado</p>}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total del mes"
          value={`$${totalMonth.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
        />
        <StatCard
          label="Gastos del mes"
          value={monthExpenses.length}
          icon={Receipt}
        />
        <StatCard
          label="Categoría principal"
          value={topCategory}
          icon={Tag}
        />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-5">
          Gastos por mes — {today.getFullYear()}
        </p>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={chartData} barSize={24} margin={{ top: 0, right: 4, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `$${v.toLocaleString('es-AR')}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="total" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly expenses */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-700">Gastos de {MONTHS_FULL[viewMonth]} {viewYear}</p>
        </div>
        {monthExpenses.length === 0 ? (
          <p className="px-6 py-10 text-center text-gray-400 text-sm">
            No hay gastos registrados en este mes
          </p>
        ) : (
          <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
            {monthExpenses.map(e => (
              <div key={e.id} className="px-6 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-gray-800 truncate">
                    {e.description || <span className="text-gray-400 italic">Sin descripción</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {e.category?.name ?? 'Sin categoría'} · {e.date}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium text-gray-900">
                    {e.currency?.symbol}{Number(e.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    e.type === 'PERSONAL'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {e.type === 'PERSONAL' ? 'Personal' : 'Trabajo'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
