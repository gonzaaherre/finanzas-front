import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import { compact, money } from '../../lib/format'

export interface SpendDatum {
  name: string
  total: number
}

interface TooltipProps {
  active?: boolean
  payload?: { value: number; payload: SpendDatum }[]
  label?: string
}

function GlassTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-lg border border-line px-3 py-2 text-xs shadow-[var(--shadow-card)]">
      <p className="text-fg-muted mb-0.5">{label}</p>
      <p className="font-mono tabular font-medium text-fg">{money(payload[0].value)}</p>
    </div>
  )
}

interface SpendBarChartProps {
  data: SpendDatum[]
  /** Índice del mes a resaltar (0-11). El resto va atenuado. */
  highlightIndex?: number
  height?: number
}

export default function SpendBarChart({ data, highlightIndex, height = 220 }: SpendBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barSize={26} margin={{ top: 6, right: 4, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="spend-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.95} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.35} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: 'var(--fg-muted)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--fg-muted)' }}
          axisLine={false}
          tickLine={false}
          width={52}
          tickFormatter={v => `$${compact(v)}`}
        />
        <Tooltip content={<GlassTooltip />} cursor={{ fill: 'var(--surface-2)', opacity: 0.5 }} />
        <Bar dataKey="total" radius={[5, 5, 0, 0]}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill="url(#spend-grad)"
              fillOpacity={highlightIndex === undefined || highlightIndex === i ? 1 : 0.32}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
