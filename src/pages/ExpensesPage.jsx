import { useState, useEffect, useCallback } from 'react'
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../api/expenses'
import { getCategories } from '../api/categories'
import { getCurrencies } from '../api/currencies'
import { Plus, Pencil, Trash2, X, SlidersHorizontal } from 'lucide-react'

const EMPTY = {
  amount: '', type: 'PERSONAL', description: '',
  date: new Date().toISOString().split('T')[0],
  categoryId: '', currencyCode: 'ARS',
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function Badge({ type }) {
  const isPersonal = type === 'PERSONAL'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
      isPersonal ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
    }`}>
      {isPersonal ? 'Personal' : 'Trabajo'}
    </span>
  )
}

export default function ExpensesPage() {
  const [expenses,   setExpenses]   = useState([])
  const [categories, setCategories] = useState([])
  const [currencies, setCurrencies] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [form,       setForm]       = useState(EMPTY)
  const [filters,    setFilters]    = useState({ from: '', to: '', type: '', categoryId: '' })
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const loadMeta = useCallback(async () => {
    const [cat, cur] = await Promise.all([getCategories(), getCurrencies()])
    setCategories(cat.data)
    setCurrencies(cur.data)
  }, [])

  const loadExpenses = useCallback(async (params = {}) => {
    const { data } = await getExpenses(params)
    setExpenses(data)
  }, [])

  useEffect(() => {
    Promise.all([loadMeta(), loadExpenses()]).finally(() => setLoading(false))
  }, [loadMeta, loadExpenses])

  const applyFilters = () => {
    const params = {}
    if (filters.from)       params.from       = filters.from
    if (filters.to)         params.to         = filters.to
    if (filters.type)       params.type       = filters.type
    if (filters.categoryId) params.categoryId = filters.categoryId
    loadExpenses(params)
  }

  const clearFilters = () => {
    setFilters({ from: '', to: '', type: '', categoryId: '' })
    loadExpenses()
  }

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY, currencyCode: currencies[0]?.code ?? 'ARS' })
    setError('')
    setModal(true)
  }

  const openEdit = (exp) => {
    setEditing(exp)
    setForm({
      amount:       exp.amount,
      type:         exp.type,
      description:  exp.description ?? '',
      date:         exp.date,
      categoryId:   exp.category?.id ?? '',
      currencyCode: exp.currency?.code ?? 'ARS',
    })
    setError('')
    setModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, amount: parseFloat(form.amount), categoryId: form.categoryId || null }
      if (editing) await updateExpense(editing.id, payload)
      else         await createExpense(payload)
      setModal(false)
      loadExpenses()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este gasto?')) return
    await deleteExpense(id)
    loadExpenses()
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
  const labelCls = 'block text-xs font-medium text-gray-700 mb-1.5'

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gastos</h2>
          <p className="text-gray-500 text-sm mt-0.5">{expenses.length} registros</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm transition-colors ${
              showFilters ? 'bg-gray-100 border-gray-300 text-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal size={14} />
            Filtros
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={15} />
            Nuevo gasto
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 mb-5">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className={labelCls}>Desde</label>
              <input type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className={labelCls}>Hasta</label>
              <input type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className={labelCls}>Tipo</label>
              <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todos</option>
                <option value="PERSONAL">Personal</option>
                <option value="WORK">Trabajo</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Categoría</label>
              <select value={filters.categoryId} onChange={e => setFilters({ ...filters, categoryId: e.target.value })}
                className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todas</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={applyFilters}
                className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-800 transition-colors">
                Aplicar
              </button>
              <button onClick={clearFilters}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-md text-sm hover:bg-gray-50 transition-colors">
                Limpiar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
              <th className="px-4 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">Cargando...</td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">
                  No hay gastos. ¡Creá el primero!
                </td>
              </tr>
            ) : expenses.map(e => (
              <tr key={e.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-3 text-gray-800">
                  {e.description || <span className="text-gray-400 italic">Sin descripción</span>}
                </td>
                <td className="px-6 py-3">
                  {e.category ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: e.category.color ?? '#94a3b8' }} />
                      <span className="text-gray-600">{e.category.name}</span>
                    </span>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-6 py-3"><Badge type={e.type} /></td>
                <td className="px-6 py-3 text-gray-500 tabular-nums">{e.date}</td>
                <td className="px-6 py-3 text-right font-medium text-gray-900 tabular-nums">
                  {e.currency?.symbol}{Number(e.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(e)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(e.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <Modal title={editing ? 'Editar gasto' : 'Nuevo gasto'} onClose={() => setModal(false)}>
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
                className={inputCls} placeholder="Ej: Almuerzo de trabajo" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tipo *</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  className={inputCls}>
                  <option value="PERSONAL">Personal</option>
                  <option value="WORK">Trabajo</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Fecha *</label>
                <input type="date" value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className={inputCls} required />
              </div>
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
