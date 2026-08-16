import type { ComponentType } from 'react'
import { cn } from '../../lib/cn'
import { useCountUp } from '../../hooks/useCountUp'
import { amount as fmtAmount } from '../../lib/format'
import Card from './Card'

type Accent = 'default' | 'positive' | 'negative' | 'warning' | 'accent'

const accentText: Record<Accent, string> = {
  default: 'text-fg',
  positive: 'text-positive',
  negative: 'text-negative',
  warning: 'text-warning',
  accent: 'text-accent',
}

interface StatCardProps {
  label: string
  /** Valor numérico (se anima con count-up y se formatea como plata). */
  value?: number
  /** Texto directo si no es un número (ej. categoría). */
  text?: string
  symbol?: string
  icon: ComponentType<{ size?: number; className?: string }>
  accent?: Accent
  /** Delay de entrada en ms para stagger. */
  delay?: number
}

export default function StatCard({
  label, value, text, symbol = '$', icon: Icon, accent = 'default', delay = 0,
}: StatCardProps) {
  const animated = useCountUp(value ?? 0)
  const display = text ?? (
    <span className="font-mono tabular">
      <span className="opacity-50">{symbol}</span>{fmtAmount(animated)}
    </span>
  )

  return (
    <Card
      className="p-5 animate-fade-up hover:border-line/80 transition-colors"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-fg-muted uppercase tracking-wider">{label}</p>
        <Icon size={15} className="text-fg-muted/70" />
      </div>
      <p className={cn('text-2xl font-semibold font-display', accentText[accent])}>{display}</p>
    </Card>
  )
}
