import { useState, useEffect, type FormEvent, type ReactNode } from 'react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories'
import { getErrorMessage } from '../api/client'
import { Plus, Pencil, Trash2, X, Lock } from 'lucide-react'
import type { Category, CategoryRequest } from '../types'

const EMPTY: CategoryRequest = { name: '', color: '#6366f1', icon: '' }

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm max-h-[90vh] flex flex-col">
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(false)
  const [editing,    setEditing]    = useState<Category | null>(null)
  const [form,       setForm]       = useState<CategoryRequest>(EMPTY)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await getCategories()
    setCategories(data)
    setLoading(false)
  }

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY)
    setError('')
    setModal(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setForm({ name: cat.name, color: cat.color ?? '#6366f1', icon: cat.icon ?? '' })
    setError('')
    setModal(true)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) await updateCategory(editing.id, form)
      else         await createCategory(form)
      setModal(false)
      load()
    } catch (err) {
      setError(getErrorMessage(err, 'Error al guardar'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría?')) return
    await deleteCategory(id)
    load()
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
  const labelCls = 'block text-xs font-medium text-gray-700 mb-1.5'

  const defaults   = categories.filter(c => c.isDefault)
  const custom     = categories.filter(c => !c.isDefault)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Categorías</h2>
          <p className="text-gray-500 text-sm mt-0.5">{categories.length} categorías</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} />
          Nueva categoría
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : (
        <>
          {/* Default categories */}
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              Predeterminadas
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {defaults.map(cat => (
                <div key={cat.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-md flex-shrink-0 flex items-center justify-center"
                    style={{ background: cat.color ?? '#94a3b8' }}>
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{cat.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Lock size={10} className="text-gray-400" />
                      <p className="text-xs text-gray-400">Predeterminada</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom categories */}
          {custom.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                Personalizadas
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {custom.map(cat => (
                  <div key={cat.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between group hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-md flex-shrink-0"
                        style={{ background: cat.color ?? '#94a3b8' }} />
                      <p className="text-sm font-medium text-gray-800 truncate">{cat.name}</p>
                    </div>
                    <div className="flex gap-0.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => openEdit(cat)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(cat.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {custom.length === 0 && (
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-400 text-sm">
                No tenés categorías personalizadas.{' '}
                <button onClick={openNew} className="text-blue-600 hover:underline">
                  Crear una
                </button>
              </p>
            </div>
          )}
        </>
      )}

      {modal && (
        <Modal title={editing ? 'Editar categoría' : 'Nueva categoría'} onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>Nombre *</label>
              <input type="text" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className={inputCls} placeholder="Ej: Mascotas" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color}
                    onChange={e => setForm({ ...form, color: e.target.value })}
                    className="h-9 w-12 px-1 py-1 border border-gray-300 rounded-md cursor-pointer" />
                  <span className="text-xs text-gray-500 font-mono">{form.color}</span>
                </div>
              </div>
              <div>
                <label className={labelCls}>Ícono</label>
                <input type="text" value={form.icon}
                  onChange={e => setForm({ ...form, icon: e.target.value })}
                  className={inputCls} placeholder="ej: home" />
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-md px-3 py-2.5">
              <span className="w-7 h-7 rounded-md flex-shrink-0"
                style={{ background: form.color }} />
              <p className="text-sm text-gray-700">{form.name || 'Vista previa'}</p>
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
