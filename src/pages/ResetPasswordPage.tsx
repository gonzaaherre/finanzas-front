import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api/auth'
import { getErrorMessage } from '../api/client'
import AuthLayout from '../components/AuthLayout'
import Field from '../components/ui/Field'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [form, setForm]       = useState({ password: '', confirmPassword: '' })
  const [error, setError]     = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      const { data } = await resetPassword({ token, newPassword: form.password })
      setMessage(data.message)
    } catch (err) {
      setError(getErrorMessage(err, 'Error al restablecer la contraseña'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Restablecer contraseña"
      subtitle="Elegí tu nueva contraseña"
      footer={<Link to="/login" className="text-accent hover:brightness-110 font-medium">Volver a iniciar sesión</Link>}
    >
      {!token ? (
        <p className="text-negative text-sm">
          El enlace no es válido. Solicitá uno nuevo desde{' '}
          <Link to="/forgot-password" className="text-accent hover:brightness-110 font-medium">
            recuperar contraseña
          </Link>
          .
        </p>
      ) : message ? (
        <p className="text-sm text-fg">{message}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nueva contraseña">
            <Input type="password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo 6 caracteres" required />
          </Field>
          <Field label="Confirmar contraseña">
            <Input type="password" value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Repetí la contraseña" required />
          </Field>

          {error && <p className="text-negative text-sm">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
