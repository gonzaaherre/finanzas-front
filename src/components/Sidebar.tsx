import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Receipt, Repeat, ListChecks, Tag, CreditCard, LogOut, type LucideIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Logo from './ui/Logo'
import ThemeToggle from './ui/ThemeToggle'
import { cn } from '../lib/cn'

interface NavItem {
  to: string
  icon: LucideIcon
  label: string
}

const nav: NavItem[] = [
  { to: '/dashboard',           icon: LayoutDashboard, label: 'Dashboard'        },
  { to: '/expenses',            icon: Receipt,         label: 'Gastos'           },
  { to: '/recurring-expenses',  icon: Repeat,          label: 'Gastos fijos'     },
  { to: '/planning',            icon: ListChecks,      label: 'Planificación'    },
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

  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? '?'

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-overlay-in" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-line flex flex-col flex-shrink-0',
          'transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="px-5 py-5 flex items-center justify-between border-b border-line">
          <Logo />
          <ThemeToggle />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                  isActive
                    ? 'bg-accent/10 text-fg font-medium'
                    : 'text-fg-muted hover:text-fg hover:bg-surface-2',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-accent shadow-[0_0_12px_var(--accent)]" />
                  )}
                  <Icon size={17} className={isActive ? 'text-accent' : ''} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-line space-y-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center text-sm font-semibold font-display flex-shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-fg truncate leading-tight">{user?.name}</p>
              <p className="text-xs text-fg-muted truncate leading-tight">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-fg-muted hover:text-negative hover:bg-negative/10 transition-colors"
          >
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
