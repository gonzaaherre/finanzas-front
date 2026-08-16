import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import { LogoMark } from './ui/Logo'
import ThemeToggle from './ui/ThemeToggle'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-bg text-fg">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-surface border-b border-line flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-fg-muted hover:text-fg transition-colors"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <LogoMark size={22} />
            <h1 className="text-sm font-display font-semibold text-fg">Mis Gastos</h1>
          </div>
          <ThemeToggle className="ml-auto" />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
