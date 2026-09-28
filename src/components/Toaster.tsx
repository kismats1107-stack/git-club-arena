import { Award, CircleAlert, CircleCheck, Info, X, Zap } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router'
import { cn } from '../lib/cn'
import type { ToastItem, ToastTone } from '../state/toast'

const TONE: Record<ToastTone, { Icon: typeof Info; className: string }> = {
  success: { Icon: CircleCheck, className: 'bg-easy-soft text-easy' },
  xp: { Icon: Zap, className: 'bg-accent text-white' },
  badge: { Icon: Award, className: 'bg-[#fbeecd] text-[#7a4a05]' },
  info: { Icon: Info, className: 'bg-sunken text-ink-soft' },
  warn: { Icon: CircleAlert, className: 'bg-hard-soft text-hard' },
}

export function Toaster({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-4 md:bottom-6 md:right-6 md:left-auto md:items-end"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const { Icon, className } = TONE[toast.tone ?? 'info']
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-lift"
              role="status"
            >
              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', className)}>
                <Icon className="h-4 w-4" fill={toast.tone === 'xp' ? 'currentColor' : 'none'} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-semibold text-ink">{toast.title}</p>
                {toast.description && <p className="mt-0.5 text-[13px] leading-snug text-muted">{toast.description}</p>}
                {toast.action && (
                  <Link
                    to={toast.action.to}
                    onClick={() => onDismiss(toast.id)}
                    className="mt-1.5 inline-block text-[13px] font-semibold text-accent-strong hover:underline"
                  >
                    {toast.action.label} →
                  </Link>
                )}
              </div>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="-mr-1.5 -mt-1.5 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-sunken hover:text-ink"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
