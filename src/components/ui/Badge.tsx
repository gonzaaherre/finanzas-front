import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import type { ExpenseType } from '../../types'

type Tone = 'accent' | 'violet' | 'warning' | 'negative' | 'neutral'

const tones: Record<Tone, string> = {
  accent: 'bg-accent/12 text-accent',
  violet: 'bg-accent-2/15 text-accent-2',
  warning: 'bg-warning/12 text-warning',
  negative: 'bg-negative/12 text-negative',
  neutral: 'bg-surface-2 text-fg-muted',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', tones[tone])}>
      {children}
    </span>
  )
}

/** Badge específico para el tipo de gasto (Personal / Trabajo). */
export function TypeBadge({ type }: { type: ExpenseType }) {
  return type === 'PERSONAL'
    ? <Badge tone="violet">Personal</Badge>
    : <Badge tone="warning">Trabajo</Badge>
}
