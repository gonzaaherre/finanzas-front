import { useState, useEffect, useCallback, type FormEvent, type ReactNode } from 'react'
import {
  getRecurringExpenses, createRecurringExpense, updateRecurringExpense, cancelRecurringExpense,
} from '../api/recurringExpenses'
import { getExpenses, markExpensePaid, unmarkExpensePaid } from '../api/expenses'
import { getCategories } from '../api/categories'
import { getPaymentMethods } from '../api/paymentMethods'
import { getCurrencies } from '../api/currencies'
import { getErrorMessage } from '../api/client'
import { Plus, Pencil, X, Ban, Check } from 'lucide-react'
import type {
  Category, Currency, Expense, PaymentMethod, RecurringExpense,
  RecurringExpenseRequest, RecurringExpenseUpdateRequest, ExpenseType,
} from '../types'

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

const pad2 = (n: number) => String(n).padStart(2, '0')

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

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
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

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
  const labelCls = 'block text-xs font-medium text-gray-700 mb-1.5'

  const selectedCurrency = currencies.find(c => c.code === form.currencyCode)
  const perInstallmentPreview =
    form.hasInstallments && form.amount && form.totalInstallments
      ? Number(form.amount) / parseInt(form.totalInstallments, 10)
      : null

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gastos fijos</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {recurringExpenses.length} gastos fijos
            {pendingThisMonth > 0 && (
              <span className="text-amber-600"> · {pendingThisMonth} sin pagar en {month.label}</span>
            )}
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} />
          Nuevo gasto fijo
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Método de pago</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Día del mes</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Cuotas</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{month.label}</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
              <th className="px-4 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-6 py-10 text-center text-gray-400 text-sm">Cargando...</td>
              </tr>
            ) : recurringExpenses.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-10 text-center text-gray-400 text-sm">
                  No hay gastos fijos. ¡Creá el primero!
                </td>
              </tr>
            ) : recurringExpenses.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-3 text-gray-800">
                  {r.description || <span className="text-gray-400 italic">Sin descripción</span>}
                </td>
                <td className="px-6 py-3">
                  {r.category ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: r.category.color ?? '#94a3b8' }} />
                      <span className="text-gray-600">{r.category.name}</span>
                    </span>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-6 py-3 text-gray-600">
                  {r.paymentMethod?.name ?? <span className="text-gray-400">—</span>}
                </td>
                <td className="px-6 py-3 text-gray-500 tabular-nums">{r.dayOfMonth}</td>
                <td className="px-6 py-3 text-gray-600">
                  {r.totalInstallments ? `${r.totalInstallments} cuotas` : 'Indefinido'}
                </td>
                <td className="px-6 py-3">
                  {(() => {
                    const occ = monthOccurrences[r.id]
                    if (!r.active) return <span className="text-gray-400">—</span>
                    if (!occ) return <span className="text-gray-400 text-xs">Sin cuota</span>
                    if (occ.paid) {
                      return (
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                            Pagado
                          </span>
                          <button onClick={() => handleTogglePaid(occ)} disabled={payingId === occ.id}
                            className="text-xs text-gray-400 hover:text-gray-700 hover:underline disabled:opacity-50">
                            Deshacer
                          </button>
                        </span>
                      )
                    }
                    return (
                      <button onClick={() => handleTogglePaid(occ)} disabled={payingId === occ.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50">
                        <Check size={12} /> Marcar pagado
                      </button>
                    )
                  })()}
                </td>
                <td className="px-6 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    r.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {r.active ? 'Activo' : 'Cancelado'}
                  </span>
                </td>
                <td className="px-6 py-3 text-right tabular-nums">
                  <div className="font-medium text-gray-900">
                    {r.currency?.symbol}{Number(r.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    {r.totalInstallments && <span className="text-gray-400 font-normal"> total</span>}
                  </div>
                  {r.totalInstallments && (
                    <div className="text-xs text-gray-400">
                      {r.currency?.symbol}{(Number(r.amount) / r.totalInstallments).toLocaleString('es-AR', { minimumFractionDigits: 2 })} c/u
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {r.active && (
                    <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(r)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleCancel(r.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Ban size={13} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <Modal title={editing ? 'Editar gasto fijo' : 'Nuevo gasto fijo'} onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{form.hasInstallments ? 'Monto total *' : 'Monto mensual *'}</label>
                <input type="number" step="0.01" min="0.01" value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  className={inputCls} placeholder="0.00" required />
              </div>
              <div>
                <label className={labelCls}>Moneda *</label>
                <select value={form.currencyCode}
                  onChange={e => setForm({ ...form, currencyCode: e.target.value })}
                  className={inputCls}>
                  {currencies.map(c => (
                    <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Descripción</label>
              <input type="text" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className={inputCls} placeholder="Ej: Netflix" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tipo *</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ExpenseType })}
                  className={inputCls}>
                  <option value="PERSONAL">Personal</option>
                  <option value="WORK">Trabajo</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Día del mes *</label>
                <input type="number" min="1" max="31" value={form.dayOfMonth}
                  onChange={e => setForm({ ...form, dayOfMonth: e.target.value })}
                  className={inputCls} required />
              </div>
            </div>

            <div>
              <label className={labelCls}>Fecha de inicio *</label>
              <input type="date" value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })}
                className={inputCls} disabled={!!editing} required />
              {editing && <p className="text-xs text-gray-400 mt-1">No se puede modificar</p>}
            </div>

            <div>
              <label className={labelCls}>Categoría</label>
              <select value={form.categoryId}
                onChange={e => setForm({ ...form, categoryId: e.target.value })}
                className={inputCls}>
                <option value="">Sin categoría</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className={labelCls}>Método de pago</label>
              <select value={form.paymentMethodId}
                onChange={e => setForm({ ...form, paymentMethodId: e.target.value })}
                className={inputCls}>
                <option value="">Sin método de pago</option>
                {paymentMethods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.hasInstallments}
                  onChange={e => setForm({ ...form, hasInstallments: e.target.checked })}
                  disabled={!!editing} />
                ¿Tiene una cantidad fija de cuotas?
              </label>
              {form.hasInstallments && (
                <div className="mt-2">
                  <label className={labelCls}>Cantidad de cuotas *</label>
                  <input type="number" min="1" value={form.totalInstallments}
                    onChange={e => setForm({ ...form, totalInstallments: e.target.value })}
                    className={inputCls} placeholder="Ej: 6" disabled={!!editing} required />
                  {perInstallmentPreview !== null && (
                    <p className="text-xs text-gray-400 mt-1.5">
                      ≈ {selectedCurrency?.symbol}{perInstallmentPreview.toLocaleString('es-AR', { minimumFractionDigits: 2 })} por cuota
                    </p>
                  )}
                </div>
              )}
              {editing && <p className="text-xs text-gray-400 mt-1">No se puede modificar</p>}
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
