import { useState, useEffect, type FormEvent } from 'react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories'
import { getErrorMessage } from '../api/client'
import { Plus, Pencil, Trash2, Lock } from 'lucide-react'
import type { Category, CategoryRequest } from '../types'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Field from '../components/ui/Field'
import Input from '../components/ui/Input'

const EMPTY: CategoryRequest = { name: '', color: '#2fe6a8', icon: '' }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(false)
  const [editing,    setEditing]    = useState<Category | null>(null)
  const [form,       setForm]       = useState<CategoryRequest>(EMPTY)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  const load = async () => {
    setLoading(true)
    const { data } = await getCategories()
    setCategories(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY)
    setError('')
    setModal(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setForm({ name: cat.name, color: cat.color ?? '#2fe6a8', icon: cat.icon ?? '' })
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

  const defaults = categories.filter(c => c.isDefault)
  const custom   = categories.filter(c => !c.isDefault)

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-semibold text-fg tracking-tight">Categorías</h2>
          <p className="text-fg-muted text-sm mt-0.5">{categories.length} categorías</p>
        </div>
        <Button onClick={openNew}>
          <Plus size={15} />
          Nueva categoría
        </Button>
      </div>

      {loading ? (
        <p className="text-fg-muted text-sm">Cargando...</p>
      ) : (
        <>
          {/* Default categories */}
          <div className="mb-6">
            <p className="text-xs font-medium text-fg-muted uppercase tracking-wider mb-3">Predeterminadas</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {defaults.map(cat => (
                <Card key={cat.id} className="p-4 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: cat.color ?? 'var(--fg-muted)' }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg truncate">{cat.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Lock size={10} className="text-fg-muted" />
                      <p className="text-xs text-fg-muted">Predeterminada</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom categories */}
          {custom.length > 0 && (
            <div>
              <p className="text-xs font-medium text-fg-muted uppercase tracking-wider mb-3">Personalizadas</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {custom.map(cat => (
                  <Card key={cat.id} className="p-4 flex items-center justify-between group hover:border-line/80 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: cat.color ?? 'var(--fg-muted)' }} />
                      <p className="text-sm font-medium text-fg truncate">{cat.name}</p>
                    </div>
                    <div className="flex gap-0.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => openEdit(cat)} className="p-1.5 text-fg-muted hover:text-fg hover:bg-surface-2 rounded transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-fg-muted hover:text-negative hover:bg-negative/10 rounded transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {custom.length === 0 && (
            <div className="border-2 border-dashed border-line rounded-2xl p-8 text-center">
              <p className="text-fg-muted text-sm">
                No tenés categorías personalizadas.{' '}
                <button onClick={openNew} className="text-accent hover:brightness-110">Crear una</button>
              </p>
            </div>
          )}
        </>
      )}

      {modal && (
        <Modal title={editing ? 'Editar categoría' : 'Nueva categoría'} onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nombre" required>
              <Input type="text" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Mascotas" required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Color">
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color}
                    onChange={e => setForm({ ...form, color: e.target.value })}
                    className="h-9 w-12 p-1 bg-surface-2 border border-line rounded-lg cursor-pointer" />
                  <span className="text-xs text-fg-muted font-mono">{form.color}</span>
                </div>
              </Field>
              <Field label="Ícono">
                <Input type="text" value={form.icon}
                  onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="ej: home" />
              </Field>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 bg-surface-2 rounded-lg px-3 py-2.5">
              <span className="w-7 h-7 rounded-lg flex-shrink-0" style={{ background: form.color }} />
              <p className="text-sm text-fg">{form.name || 'Vista previa'}</p>
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
