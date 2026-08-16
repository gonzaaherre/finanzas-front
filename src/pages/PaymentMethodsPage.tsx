import { useState, useEffect, type FormEvent } from 'react'
import {
  getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod,
} from '../api/paymentMethods'
import { getErrorMessage } from '../api/client'
import { Plus, Pencil, Trash2, Lock } from 'lucide-react'
import type { PaymentMethod, PaymentMethodRequest } from '../types'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Field from '../components/ui/Field'
import Input from '../components/ui/Input'

const EMPTY: PaymentMethodRequest = { name: '' }

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState<PaymentMethod | null>(null)
  const [form,    setForm]    = useState<PaymentMethodRequest>(EMPTY)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  const load = async () => {
    setLoading(true)
    const { data } = await getPaymentMethods()
    setPaymentMethods(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY)
    setError('')
    setModal(true)
  }

  const openEdit = (pm: PaymentMethod) => {
    setEditing(pm)
    setForm({ name: pm.name })
    setError('')
    setModal(true)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) await updatePaymentMethod(editing.id, form)
      else         await createPaymentMethod(form)
      setModal(false)
      load()
    } catch (err) {
      setError(getErrorMessage(err, 'Error al guardar'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este método de pago?')) return
    await deletePaymentMethod(id)
    load()
  }

  const defaults = paymentMethods.filter(p => p.isDefault)
  const custom   = paymentMethods.filter(p => !p.isDefault)

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-semibold text-fg tracking-tight">Métodos de pago</h2>
          <p className="text-fg-muted text-sm mt-0.5">{paymentMethods.length} métodos de pago</p>
        </div>
        <Button onClick={openNew}>
          <Plus size={15} />
          Nuevo método de pago
        </Button>
      </div>

      {loading ? (
        <p className="text-fg-muted text-sm">Cargando...</p>
      ) : (
        <>
          {/* Default payment methods */}
          <div className="mb-6">
            <p className="text-xs font-medium text-fg-muted uppercase tracking-wider mb-3">Predeterminados</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {defaults.map(pm => (
                <Card key={pm.id} className="p-4">
                  <p className="text-sm font-medium text-fg truncate">{pm.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Lock size={10} className="text-fg-muted" />
                    <p className="text-xs text-fg-muted">Predeterminado</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom payment methods */}
          {custom.length > 0 && (
            <div>
              <p className="text-xs font-medium text-fg-muted uppercase tracking-wider mb-3">Personalizados</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {custom.map(pm => (
                  <Card key={pm.id} className="p-4 flex items-center justify-between group hover:border-line/80 transition-colors">
                    <p className="text-sm font-medium text-fg truncate min-w-0">{pm.name}</p>
                    <div className="flex gap-0.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => openEdit(pm)} className="p-1.5 text-fg-muted hover:text-fg hover:bg-surface-2 rounded transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(pm.id)} className="p-1.5 text-fg-muted hover:text-negative hover:bg-negative/10 rounded transition-colors">
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
                No tenés métodos de pago personalizados.{' '}
                <button onClick={openNew} className="text-accent hover:brightness-110">Crear uno</button>
              </p>
            </div>
          )}
        </>
      )}

      {modal && (
        <Modal title={editing ? 'Editar método de pago' : 'Nuevo método de pago'} onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nombre" required>
              <Input type="text" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Billetera virtual" required />
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
