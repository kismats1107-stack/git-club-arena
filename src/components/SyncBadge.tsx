import { Cloud, CloudOff, HardDrive, LoaderCircle } from 'lucide-react'
import { cn } from '../lib/cn'
import type { SyncStatus } from '../state/arena'

const STYLES: Record<SyncStatus, { label: string; className: string }> = {
  synced: { label: 'Synced to your account', className: 'text-easy' },
  saving: { label: 'Saving…', className: 'text-ink-soft' },
  error: { label: 'Not synced — retrying', className: 'text-medium' },
  idle: { label: 'Saved in this browser', className: 'text-ink-soft' },
}

/** Honest cloud-sync state, so a failed save is never silent. */
export function SyncBadge({ status, className }: { status: SyncStatus; className?: string }) {
  const { label, className: tone } = STYLES[status]
  const Icon = status === 'synced' ? Cloud : status === 'saving' ? LoaderCircle : status === 'error' ? CloudOff : HardDrive
  return (
    <span
      role="status"
      title={status === 'error' ? 'The cloud database is unreachable. Your progress is safe in this browser and uploads automatically when it’s back.' : undefined}
      className={cn('inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 text-xs', tone, className)}
    >
      <Icon className={cn('h-3.5 w-3.5', status === 'saving' && 'animate-spin')} aria-hidden="true" />
      {label}
    </span>
  )
}
