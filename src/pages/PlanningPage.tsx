import { useState, useEffect, useCallback, type FormEvent } from 'react'
import {
  getPlannedExpenses, createPlannedExpense, updatePlannedExpense, deletePlannedExpense,
  markPlannedExpensePaid, unmarkPlannedExpensePaid, copyPlannedExpensesFromPrevious,
} from '../api/plannedExpenses'
import { getCategories } from '../api/categories'
import { getPaymentMethods } from '../api/paymentMethods'
import { getCurrencies } from '../api/currencies'
import { getErrorMessage } from '../api/client'
import { Plus, Pencil, Trash2, Check, Undo2, Copy, ListChecks } from 'lucide-react'
import type {
  Category, Currency, PaymentMethod, PlannedExpense,
  PlannedExpenseRequest, ExpenseType,
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
import { fieldCls } from '../components/ui/Input'

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

const thCls = 'text-left px-6 py-3 text-xs font-medium text-fg-muted uppercase tracking-wider'

function currentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-semibold text-fg tracking-tight">Planificación</h2>
          <p className="text-fg-muted text-sm mt-0.5">{plannedExpenses.length} ítems planificados</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            value={yearMonth}
            onChange={e => setYearMonth(e.target.value)}
            className={fieldCls + ' w-auto'}
          />
          <Button variant="subtle" onClick={handleCopyFromPrevious} disabled={copying}>
            <Copy size={15} />
            {copying ? 'Copiando...' : 'Copiar del mes anterior'}
          </Button>
          <Button onClick={openNew}>
            <Plus size={15} />
            Nueva planificación
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr className="bg-surface-2 border-b border-line">
              <th className={thCls}>Descripción</th>
              <th className={thCls}>Categoría</th>
              <th className={thCls}>Método de pago</th>
              <th className={thCls}>Estado</th>
              <th className={thCls + ' text-right'}>Monto</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-fg-muted text-sm">Cargando...</td></tr>
            ) : plannedExpenses.length === 0 ? (
              <tr><td colSpan={6} className="p-0">
                <EmptyState icon={ListChecks} title="Sin ítems planificados" description="Planificá tus gastos de este mes o copialos del anterior."
                  action={<Button size="sm" onClick={openNew}><Plus size={14} />Nueva planificación</Button>} />
              </td></tr>
            ) : plannedExpenses.map(p => (
              <tr key={p.id} className="hover:bg-surface-2/60 transition-colors group">
                <td className="px-6 py-3 text-fg">
                  {p.description || <span className="text-fg-muted italic">Sin descripción</span>}
                </td>
                <td className="px-6 py-3">
                  {p.category ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.category.color ?? 'var(--fg-muted)' }} />
                      <span className="text-fg-muted">{p.category.name}</span>
                    </span>
                  ) : <span className="text-fg-muted">—</span>}
                </td>
                <td className="px-6 py-3 text-fg-muted">
                  {p.paymentMethod?.name ?? <span className="text-fg-muted">—</span>}
                </td>
                <td className="px-6 py-3">
                  <Badge tone={p.status === 'PAID' ? 'accent' : 'neutral'}>
                    {p.status === 'PAID' ? 'Pagado' : 'Planeado'}
                  </Badge>
                </td>
                <td className="px-6 py-3 text-right">
                  <Money value={Number(p.amount)} symbol={p.currency?.symbol ?? '$'} className="text-fg font-medium" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {p.status === 'PLANNED' ? (
                      <>
                        <button onClick={() => openPayModal(p)}
                          className="p-1.5 text-fg-muted hover:text-positive hover:bg-positive/10 rounded transition-colors" title="Marcar pagado">
                          <Check size={13} />
                        </button>
                        <button onClick={() => openEdit(p)}
                          className="p-1.5 text-fg-muted hover:text-fg hover:bg-surface-2 rounded transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(p)}
                          className="p-1.5 text-fg-muted hover:text-negative hover:bg-negative/10 rounded transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => handleUnmark(p)}
                        className="p-1.5 text-fg-muted hover:text-fg hover:bg-surface-2 rounded transition-colors" title="Desmarcar pagado">
                        <Undo2 size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Add/Edit modal */}
      {modal && (
        <Modal title={editing ? 'Editar planificación' : 'Nueva planificación'} onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Monto" required>
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
                onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ej: Alquiler" />
            </Field>

            <Field label="Tipo" required>
              <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ExpenseType })}>
                <option value="PERSONAL">Personal</option>
                <option value="WORK">Trabajo</option>
              </Select>
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
                {paymentMethods.map(pm => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
              </Select>
            </Field>

            {error && <p className="text-negative text-sm">{error}</p>}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="subtle" onClick={() => setModal(false)} className="flex-1">Cancelar</Button>
              <Button type="submit" disabled={saving} className="flex-1">{saving ? 'Guardando...' : 'Guardar'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Mark-paid confirmation modal */}
      {payModal && (
        <Modal title="Marcar como pagado" onClose={() => setPayModal(null)}>
          <form onSubmit={handleConfirmPay} className="space-y-4">
            <p className="text-sm text-fg-muted">
              Esto va a crear un gasto real en <span className="font-medium text-fg">Gastos</span> con los datos de abajo.
            </p>
            <Field label="Fecha" required>
              <Input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} required />
            </Field>
            <Field label="Monto pagado" required>
              <Input type="number" step="0.01" min="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)} required />
            </Field>

            {payError && <p className="text-negative text-sm">{payError}</p>}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="subtle" onClick={() => setPayModal(null)} className="flex-1">Cancelar</Button>
              <Button type="submit" disabled={paying} className="flex-1">{paying ? 'Guardando...' : 'Confirmar pago'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
