import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'

const INTERACTIVE = 'a[href], button, input, select, textarea, summary, label, [role="button"], [role="option"], [role="tab"]'
const MAX_TILT = 6 // degrees
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/**
 * Pointer-driven polish for mouse and trackpad users (touch screens are left alone):
 *  - a "command chip" that follows the cursor and says what a click will do, but only
 *    on elements that opt in with data-cursor (plus external links)
 *  - spotlight glow on .spotlight cards, tilt on [data-tilt], pull on [data-magnetic]
 * Everything is written straight to the DOM, so pointer moves never re-render React.
 */
export function CursorFX() {
  const chipRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const hideRef = useRef<() => void>(() => {})
  const { pathname } = useLocation()

  useEffect(() => {
    const chip = chipRef.current
    const text = textRef.current
    if (!chip || !text || !window.matchMedia('(pointer: fine)').matches) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let x = -200
    let y = -200
    let cx = -200
    let cy = -200
    let raf = 0
    let label: string | null = null
    let tiltEl: HTMLElement | null = null
    let magnetEl: HTMLElement | null = null

    // The chip trails slightly behind the (native, instant) cursor for a soft feel.
    const loop = () => {
      const ease = reduce ? 1 : 0.26
      cx += (x - cx) * ease
      cy += (y - cy) * ease
      chip.style.transform = `translate3d(${cx + 18}px, ${cy + 22}px, 0)`
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.2 ? requestAnimationFrame(loop) : 0
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop)
    }

    const setLabel = (next: string | null) => {
      if (next === label) return
      if (next && !label) {
        cx = x
        cy = y
      }
      label = next
      if (next) {
        text.textContent = next
        chip.dataset.show = ''
      } else {
        delete chip.dataset.show
      }
    }

    const resetTilt = () => {
      if (!tiltEl) return
      tiltEl.style.removeProperty('--rx')
      tiltEl.style.removeProperty('--ry')
      tiltEl = null
    }
    const resetMagnet = () => {
      if (!magnetEl) return
      magnetEl.style.translate = ''
      magnetEl = null
    }
    hideRef.current = () => {
      setLabel(null)
      resetTilt()
      resetMagnet()
    }

    const labelFor = (target: Element): string | null => {
      const labelled = target.closest<HTMLElement>('[data-cursor]')
      const interactive = target.closest<HTMLElement>(INTERACTIVE)
      // A button inside a labelled area speaks for itself.
      if (interactive && labelled && interactive !== labelled && labelled.contains(interactive)) return null
      if (labelled) return labelled.dataset.cursor ?? null
      if (interactive?.matches('a[target="_blank"]')) return 'Opens in a new tab ↗'
      return null
    }

    const update = (target: Element) => {
      setLabel(labelFor(target))

      const spot = target.closest<HTMLElement>('.spotlight')
      if (spot) {
        const r = spot.getBoundingClientRect()
        spot.style.setProperty('--mx', `${x - r.left}px`)
        spot.style.setProperty('--my', `${y - r.top}px`)
      }
      if (reduce) return

      const tilt = target.closest<HTMLElement>('[data-tilt]')
      if (tilt !== tiltEl) resetTilt()
      if (tilt) {
        tiltEl = tilt
        const r = tilt.getBoundingClientRect()
        const px = (x - r.left) / r.width - 0.5
        const py = (y - r.top) / r.height - 0.5
        tilt.style.setProperty('--ry', `${(px * MAX_TILT).toFixed(2)}deg`)
        tilt.style.setProperty('--rx', `${(-py * MAX_TILT).toFixed(2)}deg`)
      }

      const magnet = target.closest<HTMLElement>('[data-magnetic]')
      if (magnet !== magnetEl) resetMagnet()
      if (magnet) {
        magnetEl = magnet
        const r = magnet.getBoundingClientRect()
        const dx = clamp((x - (r.left + r.width / 2)) * 0.2, -9, 9)
        const dy = clamp((y - (r.top + r.height / 2)) * 0.3, -6, 6)
        magnet.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`
      }
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      x = e.clientX
      y = e.clientY
      update(e.target as Element)
      kick()
    }
    // Scrolling moves content under a still pointer, so re-resolve what's beneath it.
    let scrollQueued = false
    const onScroll = () => {
      if (scrollQueued || x < 0) return
      scrollQueued = true
      requestAnimationFrame(() => {
        scrollQueued = false
        const el = document.elementFromPoint(x, y)
        if (el) update(el)
      })
    }
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) hideRef.current()
    }
    const onDown = () => {
      chip.dataset.pressed = ''
    }
    const onUp = () => {
      delete chip.dataset.pressed
    }

    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerout', onOut)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('pointerup', onUp)
    window.addEventListener('scroll', onScroll, { passive: true, capture: true })
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerout', onOut)
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointerup', onUp)
      window.removeEventListener('scroll', onScroll, { capture: true })
    }
  }, [])

  // A new page means new things under the pointer.
  useEffect(() => {
    hideRef.current()
  }, [pathname])

  return (
    <div ref={chipRef} aria-hidden="true" className="group pointer-events-none fixed left-0 top-0 z-[9999]" style={{ transform: 'translate3d(-200px,-200px,0)' }}>
      <span className="inline-flex origin-top-left scale-75 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#17150f]/90 px-2.5 py-1.5 font-mono text-[11px] font-medium text-white opacity-0 shadow-[0_10px_24px_-10px_rgba(0,0,0,.55)] ring-1 ring-white/15 backdrop-blur-md transition-[opacity,scale] duration-200 group-data-[pressed]:scale-90 group-data-[show]:scale-100 group-data-[show]:opacity-100">
        <span className="text-[#ff7a58]">›</span>
        <span ref={textRef} />
      </span>
    </div>
  )
}
