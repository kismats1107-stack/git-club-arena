import { ArrowRight, GitMerge, GitPullRequest, LoaderCircle, RotateCcw, Send, Trophy } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { GITHUB_REPO_URL, PASS_MARK } from '../config'
import { needsLiveUrl } from '../data/challenges'
import type { Challenge, Phase } from '../data/types'
import { useNow } from '../hooks/useNow'
import { cn } from '../lib/cn'
import { recommendChallenge, type ChallengeProgress } from '../lib/progress'
import { parseRepoUrl, parseWebUrl, progressFromReview, runReview, type ReviewProgress } from '../lib/review'
import { relativeAgo } from '../lib/time'
import { useArena } from '../state/arena'
import { GithubIcon } from './Brand'
import { buttonClass } from './Button'
import { ReviewConsole } from './ReviewConsole'

const inputClass =
  'h-11 w-full rounded-xl border border-line-strong bg-paper pr-3 font-mono text-[13px] text-ink placeholder:text-muted/70 transition focus:border-accent focus:bg-surface focus:outline-none focus:ring-4 focus:ring-accent/15 aria-[invalid=true]:border-hard'

type FieldError = { field: 'repo' | 'live' | 'confirm' | 'review'; message: string }

function Row({ label, value, hint, strong }: { label: string; value: string; hint?: string; strong?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between gap-4 px-4 py-3', strong && 'bg-sunken/60')}>
      <div>
        <dt className={cn('text-sm', strong ? 'font-semibold text-ink' : 'text-ink-soft')}>{label}</dt>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      <dd className={cn('font-mono text-sm tabular-nums', strong ? 'font-semibold text-ink' : 'text-ink-soft')}>{value}</dd>
    </div>
  )
}

/**
 * Submission and automated review for one challenge: the form, the live console
 * while GitHub is being read, and the verdict (approved or changes requested).
 */
export function ReviewPanel({ challenge, progress, phase }: { challenge: Challenge; progress: ChallengeProgress; phase: Phase }) {
  const { beginReview, finishReview, cancelReview, rank, state } = useArena()
  const now = useNow(30_000)
  const id = useId()
  const [repoUrl, setRepoUrl] = useState(progress.repoUrl ?? '')
  const [liveUrl, setLiveUrl] = useState(progress.liveUrl ?? '')
  const [confirmed, setConfirmed] = useState(Boolean(progress.attempts))
  const [error, setError] = useState<FieldError | null>(null)
  const [live, setLive] = useState<ReviewProgress | null>(null)
  const [running, setRunning] = useState(false)

  const { status, review, award } = progress
  const passMark = PASS_MARK * 100
  const canSubmit = phase === 'active' && (status === 'in_progress' || status === 'changes_requested') && !running
  const shown = live ?? (review ? progressFromReview(review) : null)
  const askLiveUrl = needsLiveUrl(challenge)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!parseRepoUrl(repoUrl)) {
      setError({ field: 'repo', message: 'Enter a GitHub repository link, like https://github.com/your-username/your-repo' })
      return
    }
    if (liveUrl.trim() && !parseWebUrl(liveUrl)) {
      setError({ field: 'live', message: 'The live demo link should be a full URL starting with https://' })
      return
    }
    if (!confirmed) {
      setError({ field: 'confirm', message: 'Please confirm that this is your own work.' })
      return
    }

    setError(null)
    setLive(null)
    setRunning(true)
    beginReview(challenge.slug, { repoUrl: repoUrl.trim(), liveUrl: liveUrl.trim() || undefined })
    try {
      const result = await runReview({ challenge, repoUrl, liveUrl, onUpdate: setLive })
      finishReview(challenge.slug, result)
    } catch (err) {
      cancelReview(challenge.slug)
      setLive(null)
      setError({ field: 'review', message: err instanceof Error ? err.message : 'Something went wrong. Please try again.' })
    } finally {
      setRunning(false)
    }
  }

  const heading =
    status === 'completed'
      ? 'Approved & merged'
      : status === 'submitted' || running
        ? 'Reviewing your repository…'
        : status === 'changes_requested'
          ? 'Changes requested'
          : 'Submit for review'

  const next = status === 'completed' ? recommendChallenge(state.progress, now, challenge.slug) : undefined

  return (
    <section id="submit" aria-labelledby={`${id}-title`} className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            status === 'completed' ? 'bg-easy-soft text-easy' : status === 'changes_requested' && !running ? 'bg-hard-soft text-hard' : 'bg-sunken text-ink-soft',
          )}
        >
          {status === 'completed' ? (
            <GitMerge className="h-5 w-5" aria-hidden="true" />
          ) : running || status === 'submitted' ? (
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <GitPullRequest className="h-5 w-5" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="font-display text-xl font-semibold tracking-[-0.01em]">
            {heading}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {status === 'completed' && review
              ? `Scored ${review.percent}% on ${review.fullName} @ ${review.headSha.slice(0, 7)}, reviewed ${relativeAgo(new Date(review.analysedAt), now)}.`
              : status === 'changes_requested' && review && !running
                ? `Attempt ${progress.attempts ?? 1} scored ${review.percent}% — you need ${passMark}%. Fix what’s marked below, push to GitHub, then run the review again.`
                : `Paste a public GitHub repository. Every requirement above is checked against your actual code, commits and README. Score ${passMark}% or more to get merged.`}
          </p>
        </div>
      </div>

      {status === 'completed' && award && (
        <dl className="mt-5 divide-y divide-line overflow-hidden rounded-xl border border-line">
          <Row label="Requirements score" value={`${award.base} XP`} hint={`${award.percent}% of ${challenge.points} XP`} />
          <Row
            label="Early push bonus"
            value={award.bonus ? `+${award.bonus} XP` : '—'}
            hint={award.early ? 'Submitted more than 24 hours before the deadline' : 'Submit a day early next time for a bonus'}
          />
          <Row label="Total earned" value={`${award.total} XP`} strong />
        </dl>
      )}

      {status === 'completed' && (
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/leaderboard" className={buttonClass('dark')}>
            <Trophy className="h-4 w-4" aria-hidden="true" />
            {rank ? `You’re #${rank} — see leaderboard` : 'See leaderboard'}
          </Link>
          {next && (
            <Link to={`/challenges/${next.slug}`} className={buttonClass('secondary', 'md', 'max-w-full')}>
              <span className="truncate">Next: {next.title}</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          )}
        </div>
      )}

      {canSubmit && (
        <form noValidate onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <label htmlFor={`${id}-repo`} className="text-sm font-semibold">
                GitHub repository
              </label>
              {GITHUB_REPO_URL && (
                <button
                  type="button"
                  onClick={() => {
                    setRepoUrl(GITHUB_REPO_URL)
                    setError(null)
                  }}
                  className="cursor-pointer text-xs font-medium text-accent-strong underline-offset-2 hover:underline"
                >
                  Demo: try this site’s own repo
                </button>
              )}
            </div>
            <div className="relative mt-1.5">
              <GithubIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id={`${id}-repo`}
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                placeholder="https://github.com/your-username/your-repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                aria-invalid={error?.field === 'repo'}
                aria-describedby={error && error.field !== 'review' ? `${id}-error` : undefined}
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          {askLiveUrl && (
            <div>
              <label htmlFor={`${id}-live`} className="text-sm font-semibold">
                Live demo link <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id={`${id}-live`}
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                placeholder="https://your-project.vercel.app"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                aria-invalid={error?.field === 'live'}
                className={`${inputClass} mt-1.5 pl-3.5`}
              />
              <p className="mt-1 text-xs text-muted">Leave empty if the repository’s website field or README already links to it.</p>
            </div>
          )}

          {!progress.attempts && (
            <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#c93e1b]"
              />
              I confirm this is my own work and it follows the challenge rules.
            </label>
          )}

          {error && error.field !== 'review' && (
            <p id={`${id}-error`} role="alert" className="text-sm font-medium text-hard">
              {error.message}
            </p>
          )}

          <button type="submit" className={buttonClass('primary', 'lg', 'w-full sm:w-auto')}>
            {status === 'changes_requested' ? (
              <>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Run the review again
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden="true" />
                Submit & run review
              </>
            )}
          </button>
          <p className="text-xs text-muted">
            The review reads your latest push. Each run uses 3 GitHub API requests (60 per hour per network).
          </p>
        </form>
      )}

      {error?.field === 'review' && (
        <p role="alert" className="mt-5 rounded-xl border border-hard/20 bg-hard-soft px-4 py-3 text-sm font-medium text-hard">
          {error.message}
        </p>
      )}

      {status === 'submitted' && !running && !live && (
        <p className="mt-5 text-sm text-muted">A review is running for this challenge — it will finish in a few seconds.</p>
      )}

      {shown && (
        <div className="mt-6">
          <ReviewConsole challenge={challenge} progress={shown} running={running} />
        </div>
      )}
    </section>
  )
}
