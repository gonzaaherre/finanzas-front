import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../api/expenses'
import { getCategories } from '../api/categories'
import { getPaymentMethods } from '../api/paymentMethods'
import { getCurrencies } from '../api/currencies'
import { getErrorMessage } from '../api/client'
import { Plus, Pencil, Trash2, SlidersHorizontal, Repeat } from 'lucide-react'
import type { Category, Currency, Expense, ExpenseFilters, ExpenseRequest, ExpenseType, PaymentMethod } from '../types'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Field from '../components/ui/Field'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Money from '../components/ui/Money'
import EmptyState from '../components/ui/EmptyState'
import { TypeBadge } from '../components/ui/Badge'

interface ExpenseFormState {
  amount: string
  type: ExpenseType
  description: string
  date: string
  categoryId: string
  paymentMethodId: string
  currencyCode: string
}

const EMPTY: ExpenseFormState = {
  amount: '', type: 'PERSONAL', description: '',
  date: new Date().toISOString().split('T')[0],
  categoryId: '', paymentMethodId: '', currencyCode: 'ARS',
}

interface FiltersState {
  from: string
  to: string
  type: ExpenseType | ''
  categoryId: string
  paymentMethodId: string
}

const thCls = 'text-left px-6 py-3 text-xs font-medium text-fg-muted uppercase tracking-wider'

export default function ExpensesPage() {
  const [expenses,       setExpenses]       = useState<Expense[]>([])
  const [categories,     setCategories]     = useState<Category[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [currencies,     setCurrencies]     = useState<Currency[]>([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(false)
  const [editing,    setEditing]    = useState<Expense | null>(null)
  const [form,       setForm]       = useState<ExpenseFormState>(EMPTY)
  const [filters,    setFilters]    = useState<FiltersState>({ from: '', to: '', type: '', categoryId: '', paymentMethodId: '' })
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const loadMeta = useCallback(async () => {
    const [cat, pm, cur] = await Promise.all([getCategories(), getPaymentMethods(), getCurrencies()])
    setCategories(cat.data)
    setPaymentMethods(pm.data)
    setCurrencies(cur.data)
  }, [])

  const loadExpenses = useCallback(async (params: ExpenseFilters = {}) => {
    // Solo gastos ya pagados: las ocurrencias pendientes de gastos fijos no cuentan
    // como gasto hasta marcarlas pagadas desde la vista de Gastos fijos.
    const { data } = await getExpenses({ ...params, paid: true })
    setExpenses(data)
  }, [])

  useEffect(() => {
    Promise.all([loadMeta(), loadExpenses()]).finally(() => setLoading(false))
  }, [loadMeta, loadExpenses])

  const applyFilters = () => {
    const params: ExpenseFilters = {}
    if (filters.from)       params.from       = filters.from
    if (filters.to)         params.to         = filters.to
    if (filters.type)       params.type       = filters.type
    if (filters.categoryId)      params.categoryId      = filters.categoryId
    if (filters.paymentMethodId) params.paymentMethodId = filters.paymentMethodId
    loadExpenses(params)
  }

  const clearFilters = () => {
    setFilters({ from: '', to: '', type: '', categoryId: '', paymentMethodId: '' })
    loadExpenses()
  }

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY, currencyCode: currencies[0]?.code ?? 'ARS' })
    setError('')
    setModal(true)
  }

  const openEdit = (exp: Expense) => {
    setEditing(exp)
    setForm({
      amount:       String(exp.amount),
      type:         exp.type,
      description:  exp.description ?? '',
      date:         exp.date,
      categoryId:      exp.category?.id ?? '',
      paymentMethodId: exp.paymentMethod?.id ?? '',
      currencyCode:    exp.currency?.code ?? 'ARS',
    })
    setError('')
    setModal(true)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload: ExpenseRequest = {
        ...form,
        amount: parseFloat(form.amount),
        categoryId: form.categoryId || null,
        paymentMethodId: form.paymentMethodId || null,
      }
      if (editing) await updateExpense(editing.id, payload)
      else         await createExpense(payload)
      setModal(false)
      loadExpenses()
    } catch (err) {
      setError(getErrorMessage(err, 'Error al guardar'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return
    await deleteExpense(id)
    loadExpenses()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-semibold text-fg tracking-tight">Gastos</h2>
          <p className="text-fg-muted text-sm mt-0.5">{expenses.length} registros</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={showFilters ? 'subtle' : 'ghost'} onClick={() => setShowFilters(v => !v)}>
            <SlidersHorizontal size={14} />
            Filtros
          </Button>
          <Button onClick={openNew}>
            <Plus size={15} />
            Nuevo gasto
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="px-5 py-4 mb-5 animate-fade-up">
          <div className="flex flex-wrap gap-3 items-end">
            <Field label="Desde" className="w-40"><Input type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} /></Field>
            <Field label="Hasta" className="w-40"><Input type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} /></Field>
            <Field label="Tipo" className="w-40">
              <Select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value as ExpenseType | '' })}>
                <option value="">Todos</option>
                <option value="PERSONAL">Personal</option>
                <option value="WORK">Trabajo</option>
              </Select>
            </Field>
            <Field label="Categoría" className="w-44">
              <Select value={filters.categoryId} onChange={e => setFilters({ ...filters, categoryId: e.target.value })}>
                <option value="">Todas</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Método de pago" className="w-44">
              <Select value={filters.paymentMethodId} onChange={e => setFilters({ ...filters, paymentMethodId: e.target.value })}>
                <option value="">Todos</option>
                {paymentMethods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>
            <div className="flex gap-2">
              <Button variant="subtle" onClick={applyFilters}>Aplicar</Button>
              <Button variant="ghost" onClick={clearFilters}>Limpiar</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="bg-surface-2 border-b border-line">
              <th className={thCls}>Descripción</th>
              <th className={thCls}>Categoría</th>
              <th className={thCls}>Método de pago</th>
              <th className={thCls}>Tipo</th>
              <th className={thCls}>Fecha</th>
              <th className={thCls + ' text-right'}>Monto</th>
              <th className="px-4 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-fg-muted text-sm">Cargando...</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={7} className="p-0">
                <EmptyState icon={Repeat} title="No hay gastos" description="Creá tu primer gasto para verlo acá."
                  action={<Button size="sm" onClick={openNew}><Plus size={14} />Nuevo gasto</Button>} />
              </td></tr>
            ) : expenses.map(e => (
              <tr key={e.id} className="hover:bg-surface-2/60 transition-colors group">
                <td className="px-6 py-3 text-fg">
                  <span className="inline-flex items-center gap-1.5">
                    {e.description || <span className="text-fg-muted italic">Sin descripción</span>}
                    {e.recurringExpenseId && (
                      <span title={e.totalInstallments ? `Cuota ${e.installmentNumber} de ${e.totalInstallments}` : 'Gasto fijo'}>
                        <Repeat size={12} className="text-fg-muted flex-shrink-0" />
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-6 py-3">
                  {e.category ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.category.color ?? 'var(--fg-muted)' }} />
                      <span className="text-fg-muted">{e.category.name}</span>
                    </span>
                  ) : <span className="text-fg-muted">—</span>}
                </td>
                <td className="px-6 py-3 text-fg-muted">
                  {e.paymentMethod?.name ?? <span className="text-fg-muted">—</span>}
                </td>
                <td className="px-6 py-3"><TypeBadge type={e.type} /></td>
                <td className="px-6 py-3 text-fg-muted font-mono tabular">{e.date}</td>
                <td className="px-6 py-3 text-right">
                  <Money value={Number(e.amount)} symbol={e.currency?.symbol ?? '$'} className="text-fg font-medium" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(e)} className="p-1.5 text-fg-muted hover:text-fg hover:bg-surface-2 rounded transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(e.id)} className="p-1.5 text-fg-muted hover:text-negative hover:bg-negative/10 rounded transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Modal */}
      {modal && (
        <Modal title={editing ? 'Editar gasto' : 'Nuevo gasto'} onClose={() => setModal(false)}>
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
                onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ej: Almuerzo de trabajo" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo" required>
                <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ExpenseType })}>
                  <option value="PERSONAL">Personal</option>
                  <option value="WORK">Trabajo</option>
                </Select>
              </Field>
              <Field label="Fecha" required>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              </Field>
            </div>

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
