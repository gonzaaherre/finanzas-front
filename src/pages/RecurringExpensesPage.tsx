import { useState, useEffect, useCallback, type FormEvent } from 'react'
import {
  getRecurringExpenses, createRecurringExpense, updateRecurringExpense, cancelRecurringExpense,
} from '../api/recurringExpenses'
import { getExpenses, markExpensePaid, unmarkExpensePaid } from '../api/expenses'
import { getCategories } from '../api/categories'
import { getPaymentMethods } from '../api/paymentMethods'
import { getCurrencies } from '../api/currencies'
import { getErrorMessage } from '../api/client'
import { Plus, Pencil, Ban, Check, Repeat } from 'lucide-react'
import type {
  Category, Currency, Expense, PaymentMethod, RecurringExpense,
  RecurringExpenseRequest, RecurringExpenseUpdateRequest, ExpenseType,
} from '../types'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Field from '../components/ui/Field'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Money from '../components/ui/Money'
import EmptyState from '../components/ui/EmptyState'
import { Badge } from '../components/ui/Badge'
import { amount as fmtAmount } from '../lib/format'

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

const pad2 = (n: number) => String(n).padStart(2, '0')
const thCls = 'text-left px-6 py-3 text-xs font-medium text-fg-muted uppercase tracking-wider'

// Rango [primer día, último día] del mes actual en formato YYYY-MM-DD.
function currentMonthRange() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const lastDay = new Date(y, m + 1, 0).getDate()
  return {
    from: `${y}-${pad2(m + 1)}-01`,
    to: `${y}-${pad2(m + 1)}-${pad2(lastDay)}`,
    label: MONTH_NAMES[m],
  }
}

interface RecurringExpenseFormState {
  amount: string
  type: ExpenseType
  description: string
  categoryId: string
  paymentMethodId: string
  currencyCode: string
  dayOfMonth: string
  startDate: string
  hasInstallments: boolean
  totalInstallments: string
}

const EMPTY: RecurringExpenseFormState = {
  amount: '', type: 'PERSONAL', description: '',
  categoryId: '', paymentMethodId: '', currencyCode: 'ARS',
  dayOfMonth: '1', startDate: new Date().toISOString().split('T')[0],
  hasInstallments: false, totalInstallments: '',
}

export default function RecurringExpensesPage() {
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([])
  const [categories,     setCategories]     = useState<Category[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [currencies,     setCurrencies]     = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState<RecurringExpense | null>(null)
  const [form,    setForm]    = useState<RecurringExpenseFormState>(EMPTY)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  // Ocurrencia del mes actual por gasto fijo (recurringExpenseId -> Expense).
  const [monthOccurrences, setMonthOccurrences] = useState<Record<string, Expense>>({})
  const [payingId, setPayingId] = useState<string | null>(null)

  const month = currentMonthRange()

  const loadMeta = useCallback(async () => {
    const [cat, pm, cur] = await Promise.all([getCategories(), getPaymentMethods(), getCurrencies()])
    setCategories(cat.data)
    setPaymentMethods(pm.data)
    setCurrencies(cur.data)
  }, [])

  const loadRecurring = useCallback(async () => {
    const { data } = await getRecurringExpenses()
    setRecurringExpenses(data)
  }, [])

  const loadOccurrences = useCallback(async () => {
    const { from, to } = currentMonthRange()
    // Sin filtro paid: necesitamos tanto las pagadas como las pendientes del mes.
    const { data } = await getExpenses({ from, to })
    const map: Record<string, Expense> = {}
    data.forEach(e => { if (e.recurringExpenseId) map[e.recurringExpenseId] = e })
    setMonthOccurrences(map)
  }, [])

  useEffect(() => {
    Promise.all([loadMeta(), loadRecurring(), loadOccurrences()]).finally(() => setLoading(false))
  }, [loadMeta, loadRecurring, loadOccurrences])

  const handleTogglePaid = async (occ: Expense) => {
    setPayingId(occ.id)
    try {
      if (occ.paid) await unmarkExpensePaid(occ.id)
      else await markExpensePaid(occ.id)
      await loadOccurrences()
    } catch (err) {
      alert(getErrorMessage(err, 'Error al actualizar el pago'))
    } finally {
      setPayingId(null)
    }
  }

  const pendingThisMonth = Object.values(monthOccurrences).filter(o => !o.paid).length

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY, currencyCode: currencies[0]?.code ?? 'ARS' })
    setError('')
    setModal(true)
  }

  const openEdit = (r: RecurringExpense) => {
    setEditing(r)
    setForm({
      amount: String(r.amount),
      type: r.type,
      description: r.description ?? '',
      categoryId: r.category?.id ?? '',
      paymentMethodId: r.paymentMethod?.id ?? '',
      currencyCode: r.currency?.code ?? 'ARS',
      dayOfMonth: String(r.dayOfMonth),
      startDate: r.startDate,
      hasInstallments: r.totalInstallments != null,
      totalInstallments: r.totalInstallments != null ? String(r.totalInstallments) : '',
    })
    setError('')
    setModal(true)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) {
        const payload: RecurringExpenseUpdateRequest = {
          amount: parseFloat(form.amount),
          type: form.type,
          description: form.description || null,
          categoryId: form.categoryId || null,
          paymentMethodId: form.paymentMethodId || null,
          currencyCode: form.currencyCode,
          dayOfMonth: parseInt(form.dayOfMonth, 10),
        }
        await updateRecurringExpense(editing.id, payload)
      } else {
        const payload: RecurringExpenseRequest = {
          amount: parseFloat(form.amount),
          type: form.type,
          description: form.description || null,
          categoryId: form.categoryId || null,
          paymentMethodId: form.paymentMethodId || null,
          currencyCode: form.currencyCode,
          dayOfMonth: parseInt(form.dayOfMonth, 10),
          startDate: form.startDate,
          totalInstallments: form.hasInstallments ? parseInt(form.totalInstallments, 10) : null,
        }
        await createRecurringExpense(payload)
      }
      setModal(false)
      loadRecurring()
      loadOccurrences()
    } catch (err) {
      setError(getErrorMessage(err, 'Error al guardar'))
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('¿Cancelar este gasto fijo? Se eliminarán las cuotas futuras ya generadas.')) return
    await cancelRecurringExpense(id)
    loadRecurring()
    loadOccurrences()
  }

  const selectedCurrency = currencies.find(c => c.code === form.currencyCode)
  const perInstallmentPreview =
    form.hasInstallments && form.amount && form.totalInstallments
      ? Number(form.amount) / parseInt(form.totalInstallments, 10)
      : null

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-semibold text-fg tracking-tight">Gastos fijos</h2>
          <p className="text-fg-muted text-sm mt-0.5">
            {recurringExpenses.length} gastos fijos
            {pendingThisMonth > 0 && (
              <span className="text-warning"> · {pendingThisMonth} sin pagar en {month.label}</span>
            )}
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus size={15} />
          Nuevo gasto fijo
        </Button>
      </div>

      {/* Table */}
      <Card className="overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr className="bg-surface-2 border-b border-line">
              <th className={thCls}>Descripción</th>
              <th className={thCls}>Categoría</th>
              <th className={thCls}>Método de pago</th>
              <th className={thCls}>Día del mes</th>
              <th className={thCls}>Cuotas</th>
              <th className={thCls}>{month.label}</th>
              <th className={thCls}>Estado</th>
              <th className={thCls + ' text-right'}>Monto</th>
              <th className="px-4 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr><td colSpan={9} className="px-6 py-10 text-center text-fg-muted text-sm">Cargando...</td></tr>
            ) : recurringExpenses.length === 0 ? (
              <tr><td colSpan={9} className="p-0">
                <EmptyState icon={Repeat} title="No hay gastos fijos" description="Creá tu primer gasto fijo (alquiler, suscripciones, cuotas)."
                  action={<Button size="sm" onClick={openNew}><Plus size={14} />Nuevo gasto fijo</Button>} />
              </td></tr>
            ) : recurringExpenses.map(r => (
              <tr key={r.id} className="hover:bg-surface-2/60 transition-colors group">
                <td className="px-6 py-3 text-fg">
                  {r.description || <span className="text-fg-muted italic">Sin descripción</span>}
                </td>
                <td className="px-6 py-3">
                  {r.category ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.category.color ?? 'var(--fg-muted)' }} />
                      <span className="text-fg-muted">{r.category.name}</span>
                    </span>
                  ) : <span className="text-fg-muted">—</span>}
                </td>
                <td className="px-6 py-3 text-fg-muted">
                  {r.paymentMethod?.name ?? <span className="text-fg-muted">—</span>}
                </td>
                <td className="px-6 py-3 text-fg-muted font-mono tabular">{r.dayOfMonth}</td>
                <td className="px-6 py-3 text-fg-muted">
                  {r.totalInstallments ? `${r.totalInstallments} cuotas` : 'Indefinido'}
                </td>
                <td className="px-6 py-3">
                  {(() => {
                    const occ = monthOccurrences[r.id]
                    if (!r.active) return <span className="text-fg-muted">—</span>
                    if (!occ) return <span className="text-fg-muted text-xs">Sin cuota</span>
                    if (occ.paid) {
                      return (
                        <span className="inline-flex items-center gap-2">
                          <Badge tone="accent">Pagado</Badge>
                          <button onClick={() => handleTogglePaid(occ)} disabled={payingId === occ.id}
                            className="text-xs text-fg-muted hover:text-fg hover:underline disabled:opacity-50">
                            Deshacer
                          </button>
                        </span>
                      )
                    }
                    return (
                      <button onClick={() => handleTogglePaid(occ)} disabled={payingId === occ.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-warning/12 text-warning hover:bg-warning/20 transition-colors disabled:opacity-50">
                        <Check size={12} /> Marcar pagado
                      </button>
                    )
                  })()}
                </td>
                <td className="px-6 py-3">
                  <Badge tone={r.active ? 'accent' : 'neutral'}>{r.active ? 'Activo' : 'Cancelado'}</Badge>
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="text-fg font-medium">
                    <Money value={Number(r.amount)} symbol={r.currency?.symbol ?? '$'} />
                    {r.totalInstallments && <span className="text-fg-muted font-normal"> total</span>}
                  </div>
                  {r.totalInstallments && (
                    <div className="text-xs text-fg-muted font-mono tabular">
                      {r.currency?.symbol}{fmtAmount(Number(r.amount) / r.totalInstallments)} c/u
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {r.active && (
                    <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(r)} className="p-1.5 text-fg-muted hover:text-fg hover:bg-surface-2 rounded transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleCancel(r.id)} className="p-1.5 text-fg-muted hover:text-negative hover:bg-negative/10 rounded transition-colors">
                        <Ban size={13} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Modal */}
      {modal && (
        <Modal title={editing ? 'Editar gasto fijo' : 'Nuevo gasto fijo'} onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label={form.hasInstallments ? 'Monto total' : 'Monto mensual'} required>
                <Input type="number" step="0.01" min="0.01" value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" required />
              </Field>
              <Field label="Moneda" required>
                <Select value={form.currencyCode} onChange={e => setForm({ ...form, currencyCode: e.target.value })}>
                  {currencies.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                </Select>
              </Field>
            </div>

            <Field label="Descripción">
              <Input type="text" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ej: Netflix" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo" required>
                <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ExpenseType })}>
                  <option value="PERSONAL">Personal</option>
                  <option value="WORK">Trabajo</option>
                </Select>
              </Field>
              <Field label="Día del mes" required>
                <Input type="number" min="1" max="31" value={form.dayOfMonth}
                  onChange={e => setForm({ ...form, dayOfMonth: e.target.value })} required />
              </Field>
            </div>

            <Field label="Fecha de inicio" required error={editing ? 'No se puede modificar' : undefined}>
              <Input type="date" value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })} disabled={!!editing} required />
            </Field>

            <Field label="Categoría">
              <Select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Sin categoría</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>

            <Field label="Método de pago">
              <Select value={form.paymentMethodId} onChange={e => setForm({ ...form, paymentMethodId: e.target.value })}>
                <option value="">Sin método de pago</option>
                {paymentMethods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>

            <div>
              <label className="flex items-center gap-2 text-sm text-fg">
                <input type="checkbox" checked={form.hasInstallments} className="accent-[var(--accent)]"
                  onChange={e => setForm({ ...form, hasInstallments: e.target.checked })} disabled={!!editing} />
                ¿Tiene una cantidad fija de cuotas?
              </label>
              {form.hasInstallments && (
                <div className="mt-2">
                  <Field label="Cantidad de cuotas" required>
                    <Input type="number" min="1" value={form.totalInstallments}
                      onChange={e => setForm({ ...form, totalInstallments: e.target.value })} placeholder="Ej: 6" disabled={!!editing} required />
                  </Field>
                  {perInstallmentPreview !== null && (
                    <p className="text-xs text-fg-muted mt-1.5 font-mono tabular">
                      ≈ {selectedCurrency?.symbol}{fmtAmount(perInstallmentPreview)} por cuota
                    </p>
                  )}
                </div>
              )}
              {editing && <p className="text-xs text-fg-muted mt-1">No se puede modificar</p>}
            </div>

            {error && <p className="text-negative text-sm">{error}</p>}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="subtle" onClick={() => setModal(false)} className="flex-1">Cancelar</Button>
              <Button type="submit" disabled={saving} className="flex-1">{saving ? 'Guardando...' : 'Guardar'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
