import type { SelectHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { fieldCls } from './Input'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode
}

export default function Select({ className, children, ...props }: SelectProps) {
  return (
    <select className={cn(fieldCls, 'appearance-none cursor-pointer pr-9', className)} {...props}>
      {children}
    </select>
  )
}
