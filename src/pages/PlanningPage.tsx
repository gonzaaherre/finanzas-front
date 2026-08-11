import { useState, useEffect, useCallback, type FormEvent, type ReactNode } from 'react'
import {
  getPlannedExpenses, createPlannedExpense, updatePlannedExpense, deletePlannedExpense,
  markPlannedExpensePaid, unmarkPlannedExpensePaid, copyPlannedExpensesFromPrevious,
} from '../api/plannedExpenses'
import { getCategories } from '../api/categories'
import { getPaymentMethods } from '../api/paymentMethods'
import { getCurrencies } from '../api/currencies'
import { getErrorMessage } from '../api/client'
import { Plus, Pencil, Trash2, Check, Undo2, Copy, X } from 'lucide-react'
import type {
  Category, Currency, PaymentMethod, PlannedExpense,
  PlannedExpenseRequest, ExpenseType,
} from '../types'

interface PlannedExpenseFormState {
  amount: string
  type: ExpenseType
  description: string
  categoryId: string
  paymentMethodId: string
  currencyCode: string
}

const EMPTY: PlannedExpenseFormState = {
  amount: '', type: 'PERSONAL', description: '',
  categoryId: '', paymentMethodId: '', currencyCode: 'ARS',
}

function currentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
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

export default function PlanningPage() {
  const [yearMonth, setYearMonth] = useState(currentYearMonth())
  const [plannedExpenses, setPlannedExpenses] = useState<PlannedExpense[]>([])
  const [categories,     setCategories]     = useState<Category[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [currencies,     setCurrencies]     = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState<PlannedExpense | null>(null)
  const [form,    setForm]    = useState<PlannedExpenseFormState>(EMPTY)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [copying, setCopying] = useState(false)

  const [payModal, setPayModal] = useState<PlannedExpense | null>(null)
  const [payDate,   setPayDate]   = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [payError,  setPayError]  = useState('')
  const [paying,    setPaying]    = useState(false)

  const [year, month] = yearMonth.split('-').map(Number)

  const loadMeta = useCallback(async () => {
    const [cat, pm, cur] = await Promise.all([getCategories(), getPaymentMethods(), getCurrencies()])
    setCategories(cat.data)
    setPaymentMethods(pm.data)
    setCurrencies(cur.data)
  }, [])

  const loadPlanned = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getPlannedExpenses(year, month)
      setPlannedExpenses(data)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { loadMeta() }, [loadMeta])
  useEffect(() => { loadPlanned() }, [loadPlanned])

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY, currencyCode: currencies[0]?.code ?? 'ARS' })
    setError('')
    setModal(true)
  }

  const openEdit = (p: PlannedExpense) => {
    setEditing(p)
    setForm({
      amount: String(p.amount),
      type: p.type,
      description: p.description ?? '',
      categoryId: p.category?.id ?? '',
      paymentMethodId: p.paymentMethod?.id ?? '',
      currencyCode: p.currency?.code ?? 'ARS',
    })
    setError('')
    setModal(true)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload: PlannedExpenseRequest = {
        amount: parseFloat(form.amount),
        type: form.type,
        description: form.description || null,
        year, month,
        categoryId: form.categoryId || null,
        paymentMethodId: form.paymentMethodId || null,
        currencyCode: form.currencyCode,
      }
      if (editing) {
        await updatePlannedExpense(editing.id, payload)
      } else {
        await createPlannedExpense(payload)
      }
      setModal(false)
      loadPlanned()
    } catch (err) {
      setError(getErrorMessage(err, 'Error al guardar'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p: PlannedExpense) => {
    if (!confirm('¿Eliminar esta planificación?')) return
    try {
      await deletePlannedExpense(p.id)
      loadPlanned()
    } catch (err) {
      alert(getErrorMessage(err, 'Error al eliminar'))
    }
  }

  const openPayModal = (p: PlannedExpense) => {
    setPayModal(p)
    setPayDate(new Date().toISOString().split('T')[0])
    setPayAmount(String(p.amount))
    setPayError('')
  }

  const handleConfirmPay = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!payModal) return
    setPaying(true)
    setPayError('')
    try {
      await markPlannedExpensePaid(payModal.id, { date: payDate, amount: parseFloat(payAmount) })
      setPayModal(null)
      loadPlanned()
    } catch (err) {
      setPayError(getErrorMessage(err, 'Error al marcar como pagado'))
    } finally {
      setPaying(false)
    }
  }

  const handleUnmark = async (p: PlannedExpense) => {
    if (!confirm('¿Desmarcar como pagado? Se eliminará el gasto real generado.')) return
    try {
      await unmarkPlannedExpensePaid(p.id)
      loadPlanned()
    } catch (err) {
      alert(getErrorMessage(err, 'Error al desmarcar'))
    }
  }

  const handleCopyFromPrevious = async () => {
    setCopying(true)
    try {
      const { data } = await copyPlannedExpensesFromPrevious(year, month)
      if (data.length === 0) {
        alert('No hay ítems del mes anterior para copiar.')
      }
      loadPlanned()
    } catch (err) {
      alert(getErrorMessage(err, 'Error al copiar el mes anterior'))
    } finally {
      setCopying(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
  const labelCls = 'block text-xs font-medium text-gray-700 mb-1.5'

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Planificación</h2>
          <p className="text-gray-500 text-sm mt-0.5">{plannedExpenses.length} ítems planificados</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={yearMonth}
            onChange={e => setYearMonth(e.target.value)}
            className={inputCls + ' w-auto'}
          />
          <button
            onClick={handleCopyFromPrevious}
            disabled={copying}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Copy size={15} />
            {copying ? 'Copiando...' : 'Copiar del mes anterior'}
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={15} />
            Nueva planificación
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Método de pago</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">Cargando...</td>
              </tr>
            ) : plannedExpenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">
                  No hay ítems planificados para este mes. ¡Creá el primero!
                </td>
              </tr>
            ) : plannedExpenses.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-3 text-gray-800">
                  {p.description || <span className="text-gray-400 italic">Sin descripción</span>}
                </td>
                <td className="px-6 py-3">
                  {p.category ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: p.category.color ?? '#94a3b8' }} />
                      <span className="text-gray-600">{p.category.name}</span>
                    </span>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-6 py-3 text-gray-600">
                  {p.paymentMethod?.name ?? <span className="text-gray-400">—</span>}
                </td>
                <td className="px-6 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    p.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {p.status === 'PAID' ? 'Pagado' : 'Planeado'}
                  </span>
                </td>
                <td className="px-6 py-3 text-right tabular-nums">
                  <div className="font-medium text-gray-900">
                    {p.currency?.symbol}{Number(p.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {p.status === 'PLANNED' ? (
                      <>
                        <button onClick={() => openPayModal(p)}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          title="Marcar pagado">
                          <Check size={13} />
                        </button>
                        <button onClick={() => openEdit(p)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(p)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => handleUnmark(p)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        title="Desmarcar pagado">
                        <Undo2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit modal */}
      {modal && (
        <Modal title={editing ? 'Editar planificación' : 'Nueva planificación'} onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Monto *</label>
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
                className={inputCls} placeholder="Ej: Alquiler" />
            </div>

            <div>
              <label className={labelCls}>Tipo *</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ExpenseType })}
                className={inputCls}>
                <option value="PERSONAL">Personal</option>
                <option value="WORK">Trabajo</option>
              </select>
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
                {paymentMethods.map(pm => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
              </select>
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

      {/* Mark-paid confirmation modal */}
      {payModal && (
        <Modal title="Marcar como pagado" onClose={() => setPayModal(null)}>
          <form onSubmit={handleConfirmPay} className="space-y-4">
            <p className="text-sm text-gray-600">
              Esto va a crear un gasto real en <span className="font-medium">Gastos</span> con los datos de abajo.
            </p>
            <div>
              <label className={labelCls}>Fecha *</label>
              <input type="date" value={payDate}
                onChange={e => setPayDate(e.target.value)}
                className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Monto pagado *</label>
              <input type="number" step="0.01" min="0.01" value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                className={inputCls} required />
            </div>

            {payError && <p className="text-red-600 text-sm">{payError}</p>}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setPayModal(null)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={paying}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
                {paying ? 'Guardando...' : 'Confirmar pago'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
