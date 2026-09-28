import { ArrowRight, CalendarClock, Clock, Flag, Timer, Users, Zap } from 'lucide-react'
import { Link } from 'react-router'
import type { Challenge, Phase } from '../data/types'
import { getPhase } from '../lib/challenge'
import { cn } from '../lib/cn'
import { DAY, formatDate, formatDuration } from '../lib/time'
import { useArena } from '../state/arena'
import { CategoryTag, DifficultyBadge, StatusPill, displayStatus, type DisplayStatus } from './Tags'

export function deadlineInfo(challenge: Challenge, phase: Phase, now: number) {
  if (phase === 'active') {
    const left = challenge.closesAt.getTime() - now
    return { text: `Closes in ${formatDuration(left)}`, urgent: left < DAY, Icon: Clock }
  }
  if (phase === 'upcoming') return { text: `Opens ${formatDate(challenge.opensAt)}`, urgent: false, Icon: CalendarClock }
  return { text: `Ended ${formatDate(challenge.closesAt)}`, urgent: false, Icon: Flag }
}

function actionLabel(status: DisplayStatus, phase: Phase): string {
  if (phase === 'upcoming') return 'See details'
  if (phase === 'completed') return status === 'completed' ? 'Your result' : 'View results'
  const labels: Record<DisplayStatus, string> = {
    not_started: 'Start challenge',
    in_progress: 'Continue',
    submitted: 'View review',
    changes_requested: 'Fix & resubmit',
    completed: 'Your result',
    missed: 'View results',
  }
  return labels[status]
}

const PEOPLE_LABEL: Record<Phase, string> = { active: 'building', upcoming: 'interested', completed: 'took part' }

export function ChallengeCard({ challenge, now }: { challenge: Challenge; now: number }) {
  const { progressFor } = useArena()
  const progress = progressFor(challenge.slug)
  const phase = getPhase(challenge, now)
  const status = displayStatus(progress, phase)
  const deadline = deadlineInfo(challenge, phase, now)
  const done = progress?.done.length ?? 0
  const total = challenge.requirements.length

  return (
    <Link
      to={`/challenges/${challenge.slug}`}
      data-tilt
      data-cursor={phase === 'active' && status === 'not_started' ? 'Open challenge' : phase === 'completed' ? 'See results' : 'Open'}
      className="spotlight group flex h-full flex-col rounded-card border border-line bg-surface p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift active:scale-[0.985]"
    >
      <div className="flex items-center justify-between gap-3">
        <CategoryTag category={challenge.category} />
        <DifficultyBadge difficulty={challenge.difficulty} />
      </div>

      <h3 className="mt-4 font-display text-[19px] font-semibold leading-snug tracking-[-0.01em] text-ink transition-colors group-hover:text-accent-strong">
        {challenge.title}
      </h3>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{challenge.tagline}</p>

      {(status === 'in_progress' || status === 'changes_requested') && (
        <div className="mt-4">
          <div className="flex justify-between text-xs font-medium text-ink-soft">
            <span>{progress?.review ? `Last review ${progress.review.percent}%` : 'Your checklist'}</span>
            <span className="font-mono">
              {done}/{total}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sunken">
            <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(done / total) * 100}%` }} />
          </div>
        </div>
      )}

      <div className="mt-auto pt-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-ink-soft">
          <span className={cn('inline-flex items-center gap-1.5', deadline.urgent && 'font-semibold text-hard')}>
            <deadline.Icon className="h-4 w-4" aria-hidden="true" />
            {deadline.text}
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-ink">
            <Zap className="h-3.5 w-3.5 text-accent" fill="currentColor" aria-hidden="true" />
            {challenge.points} XP
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4" aria-hidden="true" />
            {challenge.participants} {PEOPLE_LABEL[phase]}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
          {status === 'not_started' ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <Timer className="h-3.5 w-3.5" aria-hidden="true" />
              {challenge.estimatedTime}
            </span>
          ) : (
            <StatusPill status={status} />
          )}
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent-strong">
            {actionLabel(status, phase)}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  )
}
