import {
  ArrowLeft,
  ArrowRight,
  CalendarPlus,
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  CircleX,
  ExternalLink,
  Megaphone,
  Play,
  RotateCcw,
  ScanSearch,
  Timer,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { Avatar } from '../components/Avatar'
import { buttonClass } from '../components/Button'
import { Countdown } from '../components/Countdown'
import { ReviewPanel } from '../components/ReviewPanel'
import { CategoryTag, DifficultyBadge, PhaseChip, StatusPill, displayStatus } from '../components/Tags'
import { EARLY_PUSH_BONUS, PASS_MARK } from '../config'
import { getChallenge } from '../data/challenges'
import { getParticipant, yearLabel } from '../data/participants'
import type { Challenge } from '../data/types'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useNow } from '../hooks/useNow'
import { calendarEventFor, downloadIcs, googleCalendarUrl } from '../lib/calendar'
import { getPhase } from '../lib/challenge'
import { cn } from '../lib/cn'
import { requirementPoints, type ReviewItem } from '../lib/review'
import { DAY, formatDateTime, formatDuration } from '../lib/time'
import { useArena } from '../state/arena'
import { useToast } from '../state/toast'
import { NotFoundPage } from './NotFoundPage'

function scrollToId(id: string) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

function Section({ id, title, aside, children }: { id: string; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`}>
      <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
        <h2 id={`${id}-heading`} className="font-display text-xl font-semibold tracking-[-0.01em]">
          {title}
        </h2>
        {aside}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Meta({ icon: Icon, label, value }: { icon: typeof Zap; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-ink-soft">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div>
        <dt className="text-xs text-muted">{label}</dt>
        <dd className="text-sm font-semibold text-ink">{value}</dd>
      </div>
    </div>
  )
}

function AddToCalendar({ challenge, kind, primary }: { challenge: Challenge; kind: 'opens' | 'deadline'; primary?: boolean }) {
  const toast = useToast()
  const event = calendarEventFor(challenge, kind)

  function handleDownload(e: MouseEvent<HTMLButtonElement>) {
    downloadIcs(event, `${challenge.slug}-${kind}.ics`)
    const details = e.currentTarget.closest('details')
    if (details) details.open = false
    toast({ tone: 'success', title: 'Calendar file downloaded', description: 'Open it to add the reminder to Apple Calendar or Outlook.' })
  }

  return (
    <details className="group relative">
      <summary className={buttonClass(primary ? 'primary' : 'secondary', primary ? 'lg' : 'md', 'w-full list-none [&::-webkit-details-marker]:hidden')}>
        <CalendarPlus className="h-4 w-4" aria-hidden="true" />
        {kind === 'opens' ? 'Add opening to calendar' : 'Add deadline to calendar'}
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-line bg-surface shadow-lift">
        <a
          href={googleCalendarUrl(event)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-sunken"
        >
          Google Calendar
          <ExternalLink className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
        </a>
        <button
          type="button"
          onClick={handleDownload}
          className="flex w-full cursor-pointer items-center justify-between border-t border-line px-4 py-3 text-left text-sm font-medium hover:bg-sunken"
        >
          Apple Calendar / Outlook
          <span className="font-mono text-xs text-muted">.ics</span>
        </button>
      </div>
    </details>
  )
}

const RESULT_STYLE: Record<ReviewItem['status'], { Icon: typeof Check; row: string; icon: string; text: string }> = {
  pass: { Icon: CircleCheck, row: 'border-easy/30 bg-easy-soft/50', icon: 'text-easy', text: 'text-easy' },
  partial: { Icon: CircleAlert, row: 'border-medium/30 bg-medium-soft/50', icon: 'text-medium', text: 'text-medium' },
  fail: { Icon: CircleX, row: 'border-hard/25 bg-hard-soft/50', icon: 'text-hard', text: 'text-hard' },
}

interface RequirementRowProps {
  index: number
  text: string
  how: string
  points: number
  result?: ReviewItem
  checked: boolean
  interactive: boolean
  numbered: boolean
  onToggle: () => void
}

/** One requirement: what to do, how it's auto-checked, and — after a review — what was found. */
function RequirementRow({ index, text, how, points, result, checked, interactive, numbered, onToggle }: RequirementRowProps) {
  const style = result ? RESULT_STYLE[result.status] : null
  const body = (
    <>
      {style ? (
        <style.Icon className={cn('mt-0.5 h-5 w-5 shrink-0', style.icon)} aria-label={result?.status} />
      ) : numbered ? (
        <span className="mt-1 w-5 shrink-0 font-mono text-xs text-muted">{String(index + 1).padStart(2, '0')}</span>
      ) : (
        <>
          <input type="checkbox" checked={checked} disabled={!interactive} onChange={onToggle} className="peer sr-only" />
          <span
            className={cn(
              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent',
              checked ? 'border-easy bg-easy text-on-accent' : 'border-line-strong bg-surface',
            )}
            aria-hidden="true"
          >
            {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
          </span>
        </>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-relaxed text-ink">{text}</p>
        <p className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed text-muted">
          <ScanSearch className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            <span className="sr-only">Automated check: </span>
            {how}
          </span>
        </p>
        {result && style && <p className={cn('mt-2 break-words text-sm font-medium', style.text)}>{result.evidence}</p>}
      </div>
      <span className={cn('shrink-0 font-mono text-xs font-semibold tabular-nums', style ? style.text : 'text-ink-soft')}>
        {result ? `${result.earned}/${result.max}` : `${points} XP`}
      </span>
    </>
  )

  const className = cn(
    'flex items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors',
    style ? style.row : checked ? 'border-easy/25 bg-easy-soft/50' : 'border-line bg-surface',
    interactive && !style && 'cursor-pointer hover:border-line-strong',
  )

  return <li>{interactive && !style ? <label className={className}>{body}</label> : <div className={className}>{body}</div>}</li>
}

export function ChallengePage() {
  const { slug } = useParams()
  const challenge = getChallenge(slug)
  if (!challenge) return <NotFoundPage />
  return <ChallengeView key={challenge.slug} challenge={challenge} />
}

function ChallengeView({ challenge }: { challenge: Challenge }) {
  useDocumentTitle(challenge.title)
  const now = useNow(15_000)
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const { progressFor, requireProfile, startChallenge, toggleRequirement } = useArena()

  const progress = progressFor(challenge.slug)
  const phase = getPhase(challenge, now)
  const status = displayStatus(progress, phase)
  const review = progress?.review
  /** Requirements can be ticked by hand until the first automated review takes over. */
  const tracking = status === 'in_progress' && phase === 'active' && !review
  const canSubmit = phase === 'active' && (status === 'in_progress' || status === 'changes_requested')
  const done = progress?.done ?? []
  const total = challenge.requirements.length
  const points = requirementPoints(challenge)
  const timeLeft = challenge.closesAt.getTime() - now
  const passMark = PASS_MARK * 100

  function handleStart() {
    requireProfile(() => {
      startChallenge(challenge.slug)
      toast({
        tone: 'success',
        title: 'Challenge started',
        description: `Deadline: ${formatDateTime(challenge.closesAt)}. Tick off requirements as you build.`,
      })
      window.setTimeout(() => scrollToId('requirements'), 120)
    })
  }

  function goToSubmit() {
    scrollToId('submit')
    window.setTimeout(() => document.querySelector<HTMLInputElement>('#submit input[type="url"]')?.focus({ preventScroll: true }), 450)
  }

  const mobileAction =
    phase === 'active' && status === 'not_started'
      ? { label: 'Start challenge', onClick: handleStart }
      : canSubmit
        ? { label: status === 'changes_requested' ? 'Fix & run review' : 'Submit for review', onClick: goToSubmit }
        : null

  const peopleLabel = phase === 'upcoming' ? 'Interested' : phase === 'active' ? 'Building now' : 'Took part'

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:pb-0">
      <button
        type="button"
        onClick={() => (location.key !== 'default' ? navigate(-1) : navigate('/arena'))}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg py-1.5 pr-2 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All challenges
      </button>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <PhaseChip phase={phase} />
          <CategoryTag category={challenge.category} />
          <DifficultyBadge difficulty={challenge.difficulty} />
        </div>
        <p className="mt-5 font-mono text-xs text-muted">challenge/{challenge.slug}</p>
        <h1 className="mt-1.5 max-w-3xl font-display text-[34px] font-bold leading-[1.06] tracking-[-0.03em] sm:text-5xl">{challenge.title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{challenge.tagline}</p>
        <dl className="mt-7 grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:gap-x-8">
          <Meta icon={Zap} label="Points" value={`${challenge.points} XP`} />
          <Meta icon={Timer} label="Time needed" value={challenge.estimatedTime} />
          <Meta icon={Users} label={peopleLabel} value={`${challenge.participants} students`} />
          <Meta icon={Megaphone} label="Hosted by" value={challenge.host} />
        </dl>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
        {/* ---------- Sidebar: time + your status + the one action that matters ---------- */}
        <aside className="lg:col-start-2 lg:row-start-1">
          <div className="space-y-4 lg:sticky lg:top-24">
            <div id="status-card" className="rounded-card border border-line bg-surface p-5 shadow-card">
              {phase === 'active' && (
                <>
                  <p className="text-sm font-semibold">Submissions close in</p>
                  <div className="mt-3">
                    <Countdown target={challenge.closesAt} label="Submissions close in" urgent={timeLeft < DAY} />
                  </div>
                  <p className="mt-3 text-xs text-muted">Deadline: {formatDateTime(challenge.closesAt)}</p>
                </>
              )}
              {phase === 'upcoming' && (
                <>
                  <p className="text-sm font-semibold">Opens in</p>
                  <div className="mt-3">
                    <Countdown target={challenge.opensAt} label="Opens in" />
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted">
                    Opens {formatDateTime(challenge.opensAt)}
                    <br />
                    Closes {formatDateTime(challenge.closesAt)}
                  </p>
                </>
              )}
              {phase === 'completed' && (
                <>
                  <p className="text-sm font-semibold">This challenge has ended</p>
                  <p className="mt-1 text-sm text-muted">Submissions closed on {formatDateTime(challenge.closesAt)}.</p>
                </>
              )}

              <div className="my-5 h-px bg-line" />

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted">Your status</span>
                <StatusPill status={status} />
              </div>
              {review ? (
                <div className="mt-3">
                  <div className="relative h-2 rounded-full bg-sunken">
                    <div
                      className={cn('h-full rounded-full transition-[width] duration-500', review.approved ? 'bg-easy' : 'bg-hard')}
                      style={{ width: `${review.percent}%` }}
                    />
                    <span className="absolute -top-1 h-4 w-0.5 rounded-full bg-ink/60" style={{ left: `${passMark}%` }} aria-hidden="true" />
                  </div>
                  <p className="mt-1.5 text-xs text-muted">
                    Last review: {review.percent}% · pass mark {passMark}%
                  </p>
                </div>
              ) : (
                tracking && (
                  <div className="mt-3">
                    <div className="h-2 overflow-hidden rounded-full bg-sunken">
                      <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(done.length / total) * 100}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted">
                      {done.length} of {total} requirements ticked off
                    </p>
                  </div>
                )
              )}

              <div className="mt-5 space-y-2.5">
                {phase === 'active' && status === 'not_started' && (
                  <>
                    <button type="button" onClick={handleStart} data-magnetic className={buttonClass('primary', 'lg', 'w-full')}>
                      <Play className="h-4 w-4" fill="currentColor" aria-hidden="true" />
                      Start challenge
                    </button>
                    <p className="text-center text-xs text-muted">Starting is free. Submit any time before the deadline.</p>
                  </>
                )}
                {canSubmit && (
                  <>
                    <button type="button" onClick={goToSubmit} data-magnetic className={buttonClass('primary', 'lg', 'w-full')}>
                      {status === 'changes_requested' ? (
                        <>
                          <RotateCcw className="h-4 w-4" aria-hidden="true" />
                          Fix & run review again
                        </>
                      ) : (
                        <>
                          Submit for review
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </>
                      )}
                    </button>
                    <AddToCalendar challenge={challenge} kind="deadline" />
                  </>
                )}
                {status === 'submitted' && <p className="text-sm text-ink-soft">Your repository is being reviewed right now.</p>}
                {status === 'completed' && progress?.award && (
                  <Link to="/leaderboard" className={buttonClass('dark', 'lg', 'w-full')}>
                    <Trophy className="h-4 w-4" aria-hidden="true" />+{progress.award.total} XP earned · Leaderboard
                  </Link>
                )}
                {phase === 'upcoming' && <AddToCalendar challenge={challenge} kind="opens" primary />}
                {status === 'missed' && (
                  <p className="text-sm text-ink-soft">You started this challenge but the deadline passed before you submitted.</p>
                )}
                {phase === 'completed' && status !== 'completed' && (
                  <Link to="/arena" className={buttonClass('secondary', 'md', 'w-full')}>
                    Browse live challenges
                  </Link>
                )}
              </div>
            </div>

            <div className="rounded-card border border-line bg-surface/60 p-5">
              <h2 className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-muted">Scoring</h2>
              <ul className="mt-3 space-y-2.5 text-sm">
                <li className="flex justify-between gap-3">
                  <span className="text-ink-soft">{total} auto-checked requirements</span>
                  <span className="font-mono font-semibold">{challenge.points} XP</span>
                </li>
                <li className="flex justify-between gap-3">
                  <span className="text-ink-soft">Pass mark to get merged</span>
                  <span className="font-mono font-semibold">{passMark}%</span>
                </li>
                <li className="flex justify-between gap-3">
                  <span className="text-ink-soft">Submitting 24 h early</span>
                  <span className="font-mono font-semibold text-easy">+{EARLY_PUSH_BONUS} XP</span>
                </li>
              </ul>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Partial work earns partial credit. Below the pass mark? Fix, push and run the review again — as often as you like
                before the deadline.
              </p>
            </div>
          </div>
        </aside>

        {/* ---------- Main content ---------- */}
        <div className="min-w-0 space-y-12 lg:col-start-1 lg:row-start-1">
          {phase === 'completed' && challenge.results && (
            <section aria-labelledby="results-heading" className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
              <h2 id="results-heading" className="flex items-center gap-2 font-display text-xl font-semibold tracking-[-0.01em]">
                <Trophy className="h-5 w-5 text-accent" aria-hidden="true" />
                Results
              </h2>
              <p className="mt-1 text-sm text-muted">
                {challenge.results.submissions} submissions from {challenge.participants} participants. Standout work picked by{' '}
                {challenge.host}:
              </p>
              <ol className="mt-4 space-y-2.5">
                {challenge.results.winners.map((winner, i) => {
                  const person = getParticipant(winner.participantId)
                  if (!person) return null
                  return (
                    <li key={winner.participantId} className="flex items-start gap-3 rounded-xl bg-paper p-3.5">
                      <span className="mt-2 w-6 shrink-0 font-mono text-xs font-semibold text-muted">#{i + 1}</span>
                      <Avatar name={person.name} />
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {person.name}{' '}
                          <span className="text-sm font-normal text-muted">
                            · {yearLabel(person.year)} · {person.branch}
                          </span>
                        </p>
                        <p className="text-sm text-ink-soft">{winner.note}</p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </section>
          )}

          <Section id="problem" title="The problem">
            <div className="max-w-2xl space-y-4 text-[16px] leading-relaxed text-ink-soft">
              {challenge.problem.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
          </Section>

          <Section
            id="requirements"
            title="Requirements"
            aside={
              <span className="font-mono text-xs text-muted">
                {review ? `${review.score}/${review.max} XP` : progress ? `${done.length}/${total} ticked` : `${total} auto-checked`}
              </span>
            }
          >
            <ul className="space-y-2.5">
              {challenge.requirements.map((req, i) => (
                <RequirementRow
                  key={req.title}
                  index={i}
                  text={req.text}
                  how={req.how}
                  points={points[i]}
                  result={review?.items[i]}
                  checked={done.includes(i)}
                  interactive={tracking}
                  numbered={!progress}
                  onToggle={() => toggleRequirement(challenge.slug, i)}
                />
              ))}
            </ul>
            {!progress && phase === 'active' && (
              <p className="mt-5 rounded-xl bg-sunken px-4 py-3 text-sm text-ink-soft">
                Every requirement is checked automatically against your GitHub repository when you submit — the grey line under
                each one says exactly what the review looks for.
              </p>
            )}
          </Section>

          {progress && (canSubmit || progress.status !== 'in_progress') && (
            <ReviewPanel challenge={challenge} progress={progress} phase={phase} />
          )}

          <Section id="rules" title="Rules">
            <ul className="space-y-2.5">
              {challenge.rules.map((rule) => (
                <li key={rule} className="flex gap-3 text-[15px] leading-relaxed text-ink-soft">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-line-strong" aria-hidden="true" />
                  {rule}
                </li>
              ))}
            </ul>
          </Section>

          <Section id="skills" title="Skills you’ll practise">
            <ul className="flex flex-wrap gap-2">
              {challenge.skills.map((skill) => (
                <li key={skill} className="rounded-lg border border-line bg-surface px-3 py-1.5 font-mono text-xs text-ink-soft">
                  {skill}
                </li>
              ))}
            </ul>
          </Section>

          {challenge.resources.length > 0 && (
            <Section id="resources" title="Resources">
              <ul className="space-y-2">
                {challenge.resources.map((r) => (
                  <li key={r.url}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-draw inline-flex items-center gap-2 text-[15px] font-medium text-accent-strong"
                    >
                      {r.label}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>

      {mobileAction && (
        <MobileActionBar
          label={mobileAction.label}
          onClick={mobileAction.onClick}
          meta={`Closes in ${formatDuration(timeLeft)}`}
          urgent={timeLeft < DAY}
        />
      )}
    </div>
  )
}

/**
 * Phones: keeps the one action that matters within thumb reach. It steps aside while the
 * sidebar button or the submission form is already on screen, so it never duplicates them.
 */
function MobileActionBar({ label, onClick, meta, urgent }: { label: string; onClick: () => void; meta: string; urgent: boolean }) {
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    const targets = ['status-card', 'submit'].map((id) => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el))
    const visible = new Set<Element>()
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)))
      setHidden(visible.size > 0)
    })
    targets.forEach((t) => observer.observe(t))
    return () => observer.disconnect()
  }, [label])

  return createPortal(
    <div
      className={cn(
        'fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur-md transition-transform duration-200 lg:hidden',
        hidden ? 'pointer-events-none translate-y-[140%]' : 'translate-y-0',
      )}
      aria-hidden={hidden}
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        <span className={cn('font-mono text-xs', urgent ? 'font-semibold text-hard' : 'text-muted')}>{meta}</span>
        <button type="button" onClick={onClick} tabIndex={hidden ? -1 : 0} className={buttonClass('primary', 'md')}>
          {label}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>,
    document.body,
  )
}
