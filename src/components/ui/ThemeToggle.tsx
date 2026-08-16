import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../theme/ThemeContext'
import { cn } from '../../lib/cn'

export default function ThemeToggle({ className }: { className?: string }) {
  const { resolved, toggle } = useTheme()
  const isDark = resolved === 'dark'

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
      className={cn(
        'inline-flex items-center justify-center w-9 h-9 rounded-lg border border-line',
        'text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors',
        className,
      )}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
