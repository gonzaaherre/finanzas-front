// Formateo de plata centralizado (antes repetido con toLocaleString en varias páginas).

const AR = 'es-AR'

/** "$1.234.567,89" — con símbolo, 2 decimales, agrupado. */
export function money(amount: number, symbol = '$'): string {
  return `${symbol}${amount.toLocaleString(AR, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** "1.234.567,89" sin símbolo (para componer aparte el símbolo). */
export function amount(value: number): string {
  return value.toLocaleString(AR, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Versión compacta para ejes/gráficos: 1.2M, 464K, 900. */
export function compact(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${(value / 1_000_000).toLocaleString(AR, { maximumFractionDigits: 1 })}M`
  if (abs >= 1_000)     return `${(value / 1_000).toLocaleString(AR, { maximumFractionDigits: 1 })}K`
  return value.toLocaleString(AR, { maximumFractionDigits: 0 })
}
