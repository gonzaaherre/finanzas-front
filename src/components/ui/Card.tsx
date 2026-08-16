import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Glow tenue de acento alrededor (para la card hero). */
  glow?: boolean
  /** Superficie translúcida con blur. */
  glass?: boolean
  children: ReactNode
}

export default function Card({ glow, glass, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-line',
        glass ? 'glass' : 'bg-surface',
        'shadow-[var(--shadow-card)]',
        glow && 'shadow-[var(--glow)]',
        className,
      )}
      style={glow ? { boxShadow: 'var(--shadow-card), var(--glow)' } : undefined}
      {...props}
    >
      {children}
    </div>
  )
}
