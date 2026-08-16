import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { getExpenses, createExpense } from '../api/expenses'
import { getCategories } from '../api/categories'
import { getPaymentMethods } from '../api/paymentMethods'
import { getCurrencies } from '../api/currencies'
import { getMonthlyIncome, saveMonthlyIncome } from '../api/incomes'
import { getErrorMessage } from '../api/client'
import {
  TrendingUp, Receipt, Tag, ChevronLeft, ChevronRight, Clock, Plus, Wallet, Sparkles,
} from 'lucide-react'
import type { Category, Currency, Expense, ExpenseRequest, ExpenseType, MonthlyIncome, PaymentMethod } from '../types'
import { useCountUp } from '../hooks/useCountUp'
import { money } from '../lib/format'
import { cn } from '../lib/cn'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Field from '../components/ui/Field'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Money from '../components/ui/Money'
import EmptyState from '../components/ui/EmptyState'
import { TypeBadge } from '../components/ui/Badge'
import SpendBarChart from '../components/charts/SpendBarChart'

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MONTHS_FULL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const today = new Date()
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

interface ExpenseFormState {
  amount: string
  type: ExpenseType
  description: string
  date: string
  categoryId: string
  paymentMethodId: string
  currencyCode: string
}

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading]   = useState(true)
  const [currencies, setCurrencies]         = useState<Currency[]>([])
  const [categories, setCategories]         = useState<Category[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [modal, setModal]         = useState(false)
  const [form, setForm]           = useState<ExpenseFormState | null>(null)
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState('')
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
    Promise.all([getExpenses(), getCurrencies(), getCategories(), getPaymentMethods()])
      .then(([expensesRes, currenciesRes, categoriesRes, paymentMethodsRes]) => {
        setExpenses(expensesRes.data)
        setCurrencies(currenciesRes.data)
        setCategories(categoriesRes.data)
        setPaymentMethods(paymentMethodsRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const reloadExpenses = useCallback(async () => {
    const { data } = await getExpenses()
    setExpenses(data)
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

  const openNewExpense = () => {
    // La fecha arranca dentro del mes que se está viendo: hoy si es el mes actual,
    // o el día 1 si es otro mes (el usuario puede cambiar el día en el form).
    const date = isCurrentMonth
      ? todayStr
      : `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`
    setForm({
      amount: '', type: 'PERSONAL', description: '', date,
      categoryId: '', paymentMethodId: '', currencyCode: currencies[0]?.code ?? 'ARS',
    })
    setFormError('')
    setModal(true)
  }

  const handleCreateExpense = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    setFormError('')
    try {
      const payload: ExpenseRequest = {
        amount: parseFloat(form.amount),
        type: form.type,
        description: form.description || null,
        date: form.date,
        categoryId: form.categoryId || null,
        paymentMethodId: form.paymentMethodId || null,
        currencyCode: form.currencyCode,
      }
      await createExpense(payload)
      setModal(false)
      await reloadExpenses()
    } catch (err) {
      setFormError(getErrorMessage(err, 'Error al guardar'))
    } finally {
      setSaving(false)
    }
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

  // Solo lo pagado cuenta como gasto; lo pendiente (ocurrencias de gastos fijos
  // sin pagar) se muestra aparte y no suma al total ni al gráfico.
  const paidMonthExpenses = monthExpenses.filter(e => e.paid)
  const pendingMonthExpenses = monthExpenses.filter(e => !e.paid)

  const totalMonth = paidMonthExpenses.reduce((s, e) => s + Number(e.amount), 0)
  const pendingMonth = pendingMonthExpenses.reduce((s, e) => s + Number(e.amount), 0)

  // Restante = lo que queda del ingreso tras cubrir lo gastado y lo pendiente de pagar.
  const monthIncome = income ? Number(income.amount) : 0
  const remaining = monthIncome - totalMonth - pendingMonth
  const animatedRemaining = useCountUp(remaining)

  const chartData = MONTHS.map((name, i) => ({
    name,
    total: expenses
      .filter(e => {
        const d = new Date(e.date)
        return e.paid && d.getMonth() === i && d.getFullYear() === today.getFullYear()
      })
      .reduce((s, e) => s + Number(e.amount), 0),
  }))

  const categoryCount: Record<string, number> = {}
  paidMonthExpenses.forEach(e => {
    if (e.category) categoryCount[e.category.name] = (categoryCount[e.category.name] || 0) + 1
  })
  const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  if (loading) {
    return (
      <div className="p-4 sm:p-8 flex items-center gap-2 text-fg-muted text-sm">
        <span className="animate-spin inline-block w-4 h-4 border-2 border-line border-t-accent rounded-full" />
        Cargando...
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      {/* Header + navegador de mes */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display font-semibold text-fg tracking-tight">Dashboard</h2>
          <p className="text-fg-muted text-sm mt-0.5">Resumen de tus finanzas</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 rounded-lg border border-line text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <p className="text-sm font-medium text-fg w-36 text-center font-display">
            {MONTHS_FULL[viewMonth]} {viewYear}
          </p>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 rounded-lg border border-line text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={16} />
          </button>
          {!isCurrentMonth && (
            <button
              onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))}
              className="text-sm text-accent hover:brightness-110 ml-1"
            >
              Hoy
            </button>
          )}
        </div>
      </div>

      {/* Hero (Restante) + editor de ingreso */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card glow className="lg:col-span-2 p-6 sm:p-8 relative overflow-hidden animate-fade-up">
          <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 text-fg-muted text-xs uppercase tracking-widest mb-3">
              <Sparkles size={14} className="text-accent" />
              Te queda en {MONTHS_FULL[viewMonth]}
            </div>
            <p className={cn(
              'font-display font-semibold tracking-tight text-4xl sm:text-5xl',
              remaining < 0 ? 'text-negative' : 'text-accent',
            )}>
              {money(animatedRemaining)}
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-4 text-sm text-fg-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-fg-muted/50" /> Ingreso <Money value={monthIncome} className="text-fg" />
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent" /> Gastado <Money value={totalMonth} className="text-fg" />
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-warning" /> Pendiente <Money value={pendingMonth} className="text-fg" />
              </span>
            </div>
          </div>
        </Card>

        {/* Editor de ingreso */}
        <Card className="p-5 animate-fade-up" style={{ animationDelay: '60ms' }}>
          <p className="text-sm font-medium text-fg mb-3">
            Ingreso de {MONTHS_FULL[viewMonth]}
          </p>
          <div className="space-y-3">
            <Field label="Monto">
              <Input
                type="number" step="0.01" min="0.01"
                value={incomeAmount}
                onChange={e => setIncomeAmount(e.target.value)}
                placeholder="0.00"
              />
            </Field>
            <Field label="Moneda">
              <Select value={incomeCurrency} onChange={e => setIncomeCurrency(e.target.value)}>
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                ))}
              </Select>
            </Field>
            <Button onClick={handleIncomeSave} disabled={incomeSaving || !incomeAmount} className="w-full">
              {incomeSaving ? 'Guardando...' : income ? 'Actualizar ingreso' : 'Guardar ingreso'}
            </Button>
            {incomeError && <p className="text-negative text-sm">{incomeError}</p>}
            {incomeSaved && !incomeError && <p className="text-positive text-sm">Ingreso guardado ✓</p>}
          </div>
        </Card>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Ingreso"   value={monthIncome}  icon={Wallet}      delay={0} />
        <StatCard label="Gastado"   value={totalMonth}   icon={TrendingUp}  accent="accent" delay={60} />
        <StatCard label="Pendiente" value={pendingMonth} icon={Clock}       accent={pendingMonth > 0 ? 'warning' : 'default'} delay={120} />
        <StatCard label="Categoría top" text={topCategory} icon={Tag}       delay={180} />
      </div>

      {/* Gráfico anual */}
      <Card className="p-6 mb-4 animate-fade-up">
        <p className="text-sm font-medium text-fg mb-5">
          Gastos por mes — {today.getFullYear()}
        </p>
        <SpendBarChart data={chartData} highlightIndex={isCurrentMonth ? viewMonth : undefined} />
      </Card>

      {/* Gastos del mes */}
      <Card className="animate-fade-up overflow-hidden">
        <div className="px-6 py-4 border-b border-line flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-fg">Gastos de {MONTHS_FULL[viewMonth]} {viewYear}</p>
            <p className="text-xs text-fg-muted mt-0.5">{paidMonthExpenses.length} registros</p>
          </div>
          <Button size="sm" onClick={openNewExpense}>
            <Plus size={14} />
            Agregar gasto
          </Button>
        </div>
        {paidMonthExpenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Sin gastos este mes"
            description="Agregá tu primer gasto de este mes para verlo acá."
            action={<Button size="sm" onClick={openNewExpense}><Plus size={14} />Agregar gasto</Button>}
          />
        ) : (
          <div className="divide-y divide-line max-h-[420px] overflow-y-auto">
            {paidMonthExpenses.map(e => (
              <div key={e.id} className="px-6 py-3 flex items-center justify-between gap-3 hover:bg-surface-2/60 transition-colors">
                <div className="min-w-0 flex items-center gap-3">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: e.category?.color ?? 'var(--fg-muted)' }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-fg truncate">
                      {e.description || <span className="text-fg-muted italic">Sin descripción</span>}
                    </p>
                    <p className="text-xs text-fg-muted mt-0.5 truncate">
                      {e.category?.name ?? 'Sin categoría'} · {e.date}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 flex items-center gap-3">
                  <Money value={Number(e.amount)} symbol={e.currency?.symbol ?? '$'} className="text-sm font-medium text-fg" />
                  <TypeBadge type={e.type} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Nuevo gasto */}
      {modal && form && (
        <Modal title={`Nuevo gasto — ${MONTHS_FULL[viewMonth]} ${viewYear}`} onClose={() => setModal(false)}>
          <form onSubmit={handleCreateExpense} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Monto" required>
                <Input type="number" step="0.01" min="0.01" value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00" required />
              </Field>
              <Field label="Moneda" required>
                <Select value={form.currencyCode}
                  onChange={e => setForm({ ...form, currencyCode: e.target.value })}>
                  {currencies.map(c => (
                    <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Descripción">
              <Input type="text" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Ej: Almuerzo de trabajo" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo" required>
                <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ExpenseType })}>
                  <option value="PERSONAL">Personal</option>
                  <option value="WORK">Trabajo</option>
                </Select>
              </Field>
              <Field label="Fecha" required>
                <Input type="date" value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })} required />
              </Field>
            </div>

            <Field label="Categoría">
              <Select value={form.categoryId}
                onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Sin categoría</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>

            <Field label="Método de pago">
              <Select value={form.paymentMethodId}
                onChange={e => setForm({ ...form, paymentMethodId: e.target.value })}>
                <option value="">Sin método de pago</option>
                {paymentMethods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>

            {formError && <p className="text-negative text-sm">{formError}</p>}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="subtle" onClick={() => setModal(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
