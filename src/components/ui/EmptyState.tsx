import type { ComponentType, ReactNode } from 'react'

interface EmptyStateProps {
  icon: ComponentType<{ size?: number; className?: string }>
  title: string
  description?: string
  action?: ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-14 animate-fade-in">
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-full bg-accent/20 blur-xl" />
        <div className="relative w-12 h-12 rounded-xl bg-surface-2 border border-line flex items-center justify-center text-accent">
          <Icon size={22} />
        </div>
      </div>
      <p className="text-fg font-medium text-sm">{title}</p>
      {description && <p className="text-fg-muted text-sm mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
