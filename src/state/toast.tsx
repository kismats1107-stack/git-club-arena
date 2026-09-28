import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { Toaster } from '../components/Toaster'

export type ToastTone = 'success' | 'xp' | 'badge' | 'info' | 'warn'

export interface ToastInput {
  title: string
  description?: string
  tone?: ToastTone
  action?: { label: string; to: string }
}

export interface ToastItem extends ToastInput {
  id: number
}

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (input: ToastInput) => {
      const id = nextId.current++
      setToasts((list) => [...list.slice(-2), { ...input, id }])
      window.setTimeout(() => dismiss(id), 5500)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const toast = useContext(ToastContext)
  if (!toast) throw new Error('useToast must be used inside <ToastProvider>')
  return toast
}
