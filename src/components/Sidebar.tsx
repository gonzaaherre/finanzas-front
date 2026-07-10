import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Receipt, Repeat, Tag, CreditCard, LogOut, type LucideIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface NavItem {
  to: string
  icon: LucideIcon
  label: string
}

const nav: NavItem[] = [
  { to: '/dashboard',           icon: LayoutDashboard, label: 'Dashboard'        },
  { to: '/expenses',            icon: Receipt,         label: 'Gastos'           },
  { to: '/recurring-expenses',  icon: Repeat,          label: 'Gastos fijos'     },
  { to: '/categories',          icon: Tag,             label: 'Categorías'       },
  { to: '/payment-methods',     icon: CreditCard,      label: 'Métodos de pago'  },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-slate-900 flex flex-col flex-shrink-0 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-6 py-6 border-b border-slate-800">
          <h1 className="text-white font-semibold text-base tracking-tight">Mis Gastos</h1>
          <p className="text-slate-400 text-xs mt-1 truncate">{user?.name}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
