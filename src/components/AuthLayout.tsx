import type { ReactNode } from 'react'
import Logo from './ui/Logo'
import ThemeToggle from './ui/ThemeToggle'

interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-bg text-fg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow ambiental de acento (firma). */}
      <div className="absolute top-[-12%] left-1/2 -translate-x-1/2 w-[540px] h-[540px] rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <div className="absolute top-4 right-4"><ThemeToggle /></div>

      <div className="relative w-full max-w-sm animate-fade-up">
        <div className="flex justify-center mb-6"><Logo /></div>
        <div className="glass rounded-2xl border border-line shadow-[var(--shadow-card)] p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-display font-semibold text-fg tracking-tight">{title}</h2>
            {subtitle && <p className="text-fg-muted text-sm mt-1">{subtitle}</p>}
          </div>
          {children}
        </div>
        {footer && <p className="text-center text-sm text-fg-muted mt-6">{footer}</p>}
      </div>
    </div>
  )
}
