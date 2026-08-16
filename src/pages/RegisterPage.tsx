import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import Field from '../components/ui/Field'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function RegisterPage() {
  const [form, setForm]       = useState({ name: '', email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { login: authLogin }  = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await register(form)
      authLogin(data.token, data.refreshToken, { email: data.email, name: data.name })
      navigate('/dashboard')
    } catch (err) {
      setError(getErrorMessage(err, 'Error al registrarse'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Registrate para empezar"
      footer={<>¿Ya tenés cuenta? <Link to="/login" className="text-accent hover:brightness-110 font-medium">Iniciar sesión</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nombre">
          <Input type="text" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Tu nombre" required />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="tu@email.com" required />
        </Field>
        <Field label="Contraseña">
          <Input type="password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="Mínimo 6 caracteres" required />
        </Field>

        {error && <p className="text-negative text-sm">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Registrando...' : 'Crear cuenta'}
        </Button>
      </form>
    </AuthLayout>
  )
}
