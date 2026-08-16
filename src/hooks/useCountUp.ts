import { useEffect, useRef, useState } from 'react'

/**
 * Anima un número desde 0 (o desde el valor previo) hasta `target` al montar
 * o cuando cambia el target. Usa requestAnimationFrame con easing suave.
 * Respeta prefers-reduced-motion (salta directo al valor final).
 */
export function useCountUp(target: number, durationMs = 700): number {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const from = fromRef.current
    if (prefersReduced || from === target) {
      setValue(target)
      fromRef.current = target
      return
    }

    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(from + (target - from) * eased)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      fromRef.current = target
    }
  }, [target, durationMs])

  return value
}
