import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { PASS_MARK } from '../config'
import { CHALLENGES, getChallenge } from '../data/challenges'
import type { Challenge } from '../data/types'
import { challengesInPhase, getPhase } from '../lib/challenge'
import { recommendChallenge, type ArenaState } from '../lib/progress'
import { formatDateTime, formatDuration } from '../lib/time'
import { useArena } from '../state/arena'
import { buttonClass } from './Button'
import { CategoryTag, DifficultyBadge } from './Tags'

interface NextUp {
  /** A line of `git status` output that mirrors the participant's situation. */
  git: string
  kicker: string
  challenge: Challenge
  meta: string
  cta: string
  progress?: { done: number; total: number }
}

function getNextUp(state: ArenaState, now: number): NextUp | null {
  const tracked = Object.entries(state.progress)
    .map(([slug, p]) => ({ challenge: getChallenge(slug), progress: p }))
    .filter((e): e is { challenge: Challenge; progress: ArenaState['progress'][string] } => Boolean(e.challenge))

  const byDeadline = (a: { challenge: Challenge }, b: { challenge: Challenge }) => a.challenge.closesAt.getTime() - b.challenge.closesAt.getTime()
  const live = tracked.filter((e) => getPhase(e.challenge, now) === 'active')

  const needsFixes = live.filter((e) => e.progress.status === 'changes_requested').sort(byDeadline)[0]
  if (needsFixes?.progress.review) {
    const { challenge, progress } = needsFixes
    return {
      git: `Changes requested on challenge/${challenge.slug}`,
      kicker: `Scored ${progress.review?.percent}% — fix and resubmit`,
      challenge,
      meta: `Pass mark ${PASS_MARK * 100}% · closes in ${formatDuration(challenge.closesAt.getTime() - now)}`,
      cta: 'Fix & run review again',
      progress: { done: progress.done.length, total: challenge.requirements.length },
    }
  }

  const inProgress = live.filter((e) => e.progress.status === 'in_progress').sort(byDeadline)[0]
  if (inProgress) {
    const { challenge, progress } = inProgress
    return {
      git: `On branch challenge/${challenge.slug}`,
      kicker: 'Continue where you left off',
      challenge,
      meta: `Closes in ${formatDuration(challenge.closesAt.getTime() - now)}`,
      cta: 'Continue',
      progress: { done: progress.done.length, total: challenge.requirements.length },
    }
  }

  const inReview = tracked.find((e) => e.progress.status === 'submitted')
  if (inReview) {
    return {
      git: 'Your branch is ahead of origin/main by 1 commit',
      kicker: 'Review in progress',
      challenge: inReview.challenge,
      meta: 'Your repository is being checked right now',
      cta: 'Watch the review',
    }
  }

  const recommended = recommendChallenge(state.progress, now)
  if (recommended) {
    const merged = tracked.filter((e) => e.progress.status === 'completed').length
    return {
      git: merged === 0 ? 'nothing to commit, working tree clean' : `${merged} challenge${merged === 1 ? '' : 's'} merged into main`,
      kicker: merged === 0 ? 'New here? Start with this one' : 'Up next for you',
      challenge: recommended,
      meta: `${recommended.estimatedTime} · closes in ${formatDuration(recommended.closesAt.getTime() - now)}`,
      cta: merged === 0 ? 'Start here' : 'Take it on',
    }
  }

  const upcoming = challengesInPhase('upcoming', now).sort((a, b) => a.opensAt.getTime() - b.opensAt.getTime())[0]
  if (upcoming) {
    return {
      git: 'Everything up-to-date',
      kicker: 'You’re all caught up — next one opens soon',
      challenge: upcoming,
      meta: `Opens ${formatDateTime(upcoming.opensAt)}`,
      cta: 'See details',
    }
  }

  return CHALLENGES[0]
    ? { git: 'Everything up-to-date', kicker: 'You’re all caught up', challenge: CHALLENGES[0], meta: 'New challenges are added every week', cta: 'Browse' }
    : null
}

export function NextUpCard({ now }: { now: number }) {
  const { state, profile } = useArena()
  const next = getNextUp(state, now)
  if (!next) return null
  const { challenge } = next

  return (
    <div className="spotlight overflow-hidden rounded-card border border-line bg-surface shadow-lift">
      <div className="flex items-center gap-2 border-b border-line bg-sunken/70 px-5 py-2.5 font-mono text-xs text-ink-soft">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        </span>
        <span className="ml-2">
          <span className="text-accent-strong">$</span> git status
        </span>
      </div>

      <div className="p-5 sm:p-6">
        <p className="truncate font-mono text-xs text-muted" title={next.git}>
          {next.git}
        </p>
        <p className="mt-4 text-sm font-semibold text-accent-strong">{next.kicker}</p>
        <h2 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-[-0.015em]">{challenge.title}</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <CategoryTag category={challenge.category} />
          <DifficultyBadge difficulty={challenge.difficulty} />
          <span className="font-mono text-xs font-semibold">{challenge.points} XP</span>
        </div>
        <p className="mt-3 text-sm text-muted">{next.meta}</p>

        {next.progress && (
          <div className="mt-4">
            <div className="flex justify-between text-xs font-medium text-ink-soft">
              <span>
                {next.progress.done} of {next.progress.total} requirements done
              </span>
              <span className="font-mono">{Math.round((next.progress.done / next.progress.total) * 100)}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sunken">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${(next.progress.done / next.progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        <Link to={`/challenges/${challenge.slug}`} data-magnetic className={buttonClass('primary', 'lg', 'mt-5 w-full')}>
          {next.cta}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        {!profile && <p className="mt-3 text-center text-xs text-muted">No sign-up to browse. You’ll add your name when you start.</p>}
      </div>
    </div>
  )
}
