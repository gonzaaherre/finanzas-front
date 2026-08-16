import { cn } from '../../lib/cn'

/** Glyph firma: token redondeado con una chispa ascendente (crecimiento). */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn('flex-shrink-0', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#logo-grad)" />
      <path
        d="M9 20.5L14 15l3.5 3.5L23 11"
        stroke="var(--accent-fg)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="23" cy="11" r="1.9" fill="var(--accent-fg)" />
    </svg>
  )
}

/** Lockup completo: glyph + wordmark. El nombre se cambia en un solo lugar. */
export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      {!compact && (
        <span className="font-display font-semibold text-fg text-base tracking-tight leading-none">
          Mis Gastos
        </span>
      )}
    </div>
  )
}
