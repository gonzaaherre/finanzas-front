import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface FieldProps {
  label?: string
  htmlFor?: string
  required?: boolean
  error?: string
  className?: string
  children: ReactNode
}

export const labelCls = 'block text-xs font-medium text-fg-muted mb-1.5'

export default function Field({ label, htmlFor, required, error, className, children }: FieldProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={htmlFor} className={labelCls}>
          {label} {required && <span className="text-accent">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-negative text-xs mt-1.5">{error}</p>}
    </div>
  )
}
