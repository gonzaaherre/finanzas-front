import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export const fieldCls =
  'w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-line text-sm text-fg ' +
  'placeholder:text-fg-muted/60 transition-colors ' +
  'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/40'

export default function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldCls, className)} {...props} />
}
