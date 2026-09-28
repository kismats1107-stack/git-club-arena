import { Check } from 'lucide-react'
import type { Category, Difficulty, Phase } from '../data/types'
import { DIFFICULTY_RANK } from '../lib/challenge'
import { cn } from '../lib/cn'
import type { ChallengeProgress } from '../lib/progress'

export const CATEGORY_COLORS: Record<Category, string> = {
  Web: '#2563eb',
  Git: '#f05032',
  DSA: '#7c3aed',
  Design: '#c026d3',
  Backend: '#0f766e',
  'AI/ML': '#ca8a04',
  'Open Source': '#16a34a',
  Creative: '#e11d48',
}

export function CategoryTag({ category, className }: { category: Category; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-soft', className)}>
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[category] }} aria-hidden="true" />
      {category}
    </span>
  )
}

const DIFFICULTY_TONE: Record<Difficulty, string> = {
  Easy: 'bg-easy-soft text-easy',
  Medium: 'bg-medium-soft text-medium',
  Hard: 'bg-hard-soft text-hard',
}

/** Bars + label, so difficulty never relies on colour alone. */
export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const level = DIFFICULTY_RANK[difficulty] + 1
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', DIFFICULTY_TONE[difficulty])}>
      <span className="flex items-end gap-[2px]" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span key={i} className={cn('w-[3px] rounded-full bg-current', i > level && 'opacity-25')} style={{ height: 3 + i * 2.5 }} />
        ))}
      </span>
      {difficulty}
    </span>
  )
}

export type DisplayStatus = 'not_started' | 'in_progress' | 'submitted' | 'changes_requested' | 'completed' | 'missed'

export function displayStatus(progress: ChallengeProgress | undefined, phase: Phase): DisplayStatus {
  if (!progress) return 'not_started'
  if (progress.status !== 'completed' && phase === 'completed') return 'missed'
  return progress.status
}

const STATUS_STYLE: Record<DisplayStatus, { label: string; className: string; dot?: string }> = {
  not_started: { label: 'Not started', className: 'bg-sunken text-muted', dot: 'bg-line-strong' },
  in_progress: { label: 'In progress', className: 'bg-medium-soft text-medium', dot: 'bg-medium' },
  submitted: { label: 'Reviewing…', className: 'bg-info-soft text-info', dot: 'bg-info' },
  changes_requested: { label: 'Changes requested', className: 'bg-hard-soft text-hard', dot: 'bg-hard' },
  completed: { label: 'Completed', className: 'bg-easy-soft text-easy' },
  missed: { label: 'Deadline passed', className: 'bg-sunken text-muted', dot: 'bg-muted' },
}

export function StatusPill({ status, className }: { status: DisplayStatus; className?: string }) {
  const style = STATUS_STYLE[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', style.className, className)}>
      {status === 'completed' ? (
        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
      ) : (
        <span className={cn('h-1.5 w-1.5 rounded-full', style.dot, status === 'submitted' && 'animate-pulse')} aria-hidden="true" />
      )}
      {style.label}
    </span>
  )
}

export function PhaseChip({ phase }: { phase: Phase }) {
  if (phase === 'active') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-easy-soft px-2.5 py-1 text-xs font-semibold text-easy">
        <span className="h-2 w-2 animate-pulse-dot rounded-full bg-easy" aria-hidden="true" />
        Live now
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sunken px-2.5 py-1 text-xs font-semibold text-ink-soft">
      {phase === 'upcoming' ? 'Opening soon' : 'Ended'}
    </span>
  )
}
