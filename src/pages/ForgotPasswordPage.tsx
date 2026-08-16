import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'
import { getErrorMessage } from '../api/client'
import AuthLayout from '../components/AuthLayout'
import Field from '../components/ui/Field'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [error, setError]     = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await forgotPassword({ email })
      setMessage(data.message)
    } catch (err) {
      setError(getErrorMessage(err, 'Error al solicitar el restablecimiento'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Te enviamos un enlace para restablecerla"
      footer={<Link to="/login" className="text-accent hover:brightness-110 font-medium">Volver a iniciar sesión</Link>}
    >
      {message ? (
        <p className="text-sm text-fg">{message}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Email">
            <Input type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" required />
          </Field>

          {error && <p className="text-negative text-sm">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
