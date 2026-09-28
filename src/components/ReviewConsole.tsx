import { CircleAlert, CircleCheck, CircleDashed, CircleX, LoaderCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { PASS_MARK } from '../config'
import type { Challenge } from '../data/types'
import { cn } from '../lib/cn'
import type { ItemStatus, ReviewProgress, StageStatus } from '../lib/review'

const ICON_CLASS = 'h-[18px] w-[18px] shrink-0'

export function ResultIcon({ status, className }: { status: ItemStatus | StageStatus; className?: string }) {
  switch (status) {
    case 'running':
      return <LoaderCircle className={cn(ICON_CLASS, 'animate-spin text-accent', className)} aria-label="Checking" />
    case 'pass':
    case 'done':
      return <CircleCheck className={cn(ICON_CLASS, 'text-[#3fb950]', className)} aria-label="Passed" />
    case 'partial':
      return <CircleAlert className={cn(ICON_CLASS, 'text-[#d29922]', className)} aria-label="Partly met" />
    case 'fail':
      return <CircleX className={cn(ICON_CLASS, 'text-[#f85149]', className)} aria-label="Not met" />
    default:
      return <CircleDashed className={cn(ICON_CLASS, 'text-white/25', className)} aria-label="Waiting" />
  }
}

/** Terminal-style live view of an automated review. */
export function ReviewConsole({ challenge, progress, running }: { challenge: Challenge; progress: ReviewProgress; running: boolean }) {
  const percent = Math.round((progress.score / progress.max) * 100)
  const passMark = PASS_MARK * 100
  const finished = progress.items.every((i) => i.status === 'pass' || i.status === 'partial' || i.status === 'fail')
  const approved = finished && percent >= passMark

  const verdict = !finished
    ? { text: running ? 'Analysing…' : 'Interrupted', className: 'text-white/70' }
    : approved
      ? { text: 'Approved', className: 'text-[#3fb950]' }
      : { text: 'Changes requested', className: 'text-[#f85149]' }

  return (
    <div className="overflow-hidden rounded-card border border-console-line bg-console text-[#e6e8ee]" aria-live="polite">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <span className="min-w-0 truncate font-mono text-xs text-white/80">
          <span className="text-accent">$</span> arena review {progress.target}
        </span>
        <span className={cn('shrink-0 font-mono text-xs font-medium', verdict.className)}>{verdict.text}</span>
      </div>

      <ol className="border-b border-white/10 px-4 py-2" aria-label="Reading the repository">
        {progress.stages.map((stage) => (
          <li key={stage.id} className="flex items-center gap-3 py-1.5 font-mono text-[12.5px]">
            <ResultIcon status={stage.status} className="h-4 w-4" />
            <span className={stage.status === 'queued' ? 'text-white/40' : 'text-white/80'}>{stage.label}</span>
            {stage.detail && <span className="ml-auto hidden truncate pl-3 text-right text-white/45 sm:block">{stage.detail}</span>}
          </li>
        ))}
      </ol>

      <ol aria-label="Requirement checks">
        {progress.items.map((item, i) => {
          const done = item.status === 'pass' || item.status === 'partial' || item.status === 'fail'
          return (
            <li key={challenge.requirements[i].title} className="flex items-start gap-3 border-b border-white/5 px-4 py-3 last:border-b-0">
              <span className="mt-px">
                <ResultIcon status={item.status} />
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('font-mono text-[13px]', item.status === 'queued' ? 'text-white/45' : 'text-white/90')}>
                  {challenge.requirements[i].title}
                </p>
                {item.evidence && <p className="mt-0.5 break-words text-xs leading-relaxed text-white/55">{item.evidence}</p>}
              </div>
              <span className={cn('shrink-0 font-mono text-xs tabular-nums', done ? 'text-white/85' : 'text-white/35')}>
                {done ? item.earned : '–'}/{item.max}
              </span>
            </li>
          )
        })}
      </ol>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-baseline justify-between gap-3 font-mono text-xs">
          <span className="text-white/60">Score</span>
          <span className="tabular-nums text-white/90">
            <motion.span key={progress.score} initial={{ opacity: 0.2, y: -4 }} animate={{ opacity: 1, y: 0 }} className="inline-block text-sm font-semibold">
              {progress.score}
            </motion.span>
            /{progress.max} · {percent}%
          </span>
        </div>
        <div className="relative mt-2.5 h-2 rounded-full bg-white/10">
          <motion.div
            className={cn('h-full rounded-full', !finished ? 'bg-accent' : approved ? 'bg-[#3fb950]' : 'bg-[#f85149]')}
            initial={false}
            animate={{ width: `${percent}%` }}
            transition={{ type: 'spring', stiffness: 140, damping: 22 }}
          />
          <span className="absolute -top-1 h-4 w-0.5 rounded-full bg-white/70" style={{ left: `${passMark}%` }} aria-hidden="true" />
        </div>
        <p className="mt-2 font-mono text-[11px] text-white/45">Pass mark {passMark}% (white line). Partial credit counts.</p>
      </div>
    </div>
  )
}
