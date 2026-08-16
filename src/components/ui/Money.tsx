import { amount as fmtAmount } from '../../lib/format'
import { cn } from '../../lib/cn'

interface MoneyProps {
  value: number
  symbol?: string
  className?: string
}

/** Monto en tipografía mono/tabular para que la plata quede alineada. */
export default function Money({ value, symbol = '$', className }: MoneyProps) {
  return (
    <span className={cn('font-mono tabular', className)}>
      <span className="opacity-60">{symbol}</span>
      {fmtAmount(value)}
    </span>
  )
}
