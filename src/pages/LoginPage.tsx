import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import Field from '../components/ui/Field'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function LoginPage() {
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const { login: authLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await login(form)
      authLogin(data.token, data.refreshToken, { email: data.email, name: data.name })
      navigate('/dashboard')
    } catch (err) {
      setError(getErrorMessage(err, 'Error al iniciar sesión'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Iniciar sesión"
      subtitle="Ingresá a tu cuenta"
      footer={<>¿No tenés cuenta? <Link to="/register" className="text-accent hover:brightness-110 font-medium">Registrarse</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email">
          <Input type="email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="tu@email.com" required />
        </Field>
        <Field label="Contraseña">
          <Input type="password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="••••••" required />
          <p className="text-right text-sm mt-1.5">
            <Link to="/forgot-password" className="text-accent hover:brightness-110 font-medium">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
        </Field>

        {error && <p className="text-negative text-sm">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Ingresando...' : 'Ingresar'}
        </Button>
      </form>
    </AuthLayout>
  )
}
