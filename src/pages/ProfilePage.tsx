import { BadgeCheck, Flame, GitCommitHorizontal, GitMerge, Layers, Lock, LogOut, Mountain, ShieldCheck, Timer, Trophy, Zap } from 'lucide-react'
import { Link } from 'react-router'
import { ActivityHeatmap } from '../components/ActivityHeatmap'
import { Avatar } from '../components/Avatar'
import { buttonClass } from '../components/Button'
import { NextUpCard } from '../components/NextUpCard'
import { SyncBadge } from '../components/SyncBadge'
import { CategoryTag, StatusPill, displayStatus } from '../components/Tags'
import { PASS_MARK } from '../config'
import { getChallenge } from '../data/challenges'
import { yearLabel } from '../data/participants'
import type { Challenge } from '../data/types'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useNow } from '../hooks/useNow'
import { getPhase } from '../lib/challenge'
import { cn } from '../lib/cn'
import { BADGES, type BadgeId, type ChallengeProgress } from '../lib/progress'
import { formatDate, formatDuration } from '../lib/time'
import { useArena } from '../state/arena'

const BADGE_ICONS: Record<BadgeId, typeof Zap> = {
  'first-commit': GitCommitHorizontal,
  'first-merge': GitMerge,
  'early-push': Timer,
  'green-pipeline': ShieldCheck,
  'hard-mode': Mountain,
  polyglot: Layers,
  'on-a-streak': Flame,
}

const STATUS_ORDER: Record<string, number> = { changes_requested: 0, in_progress: 1, submitted: 2, completed: 3, missed: 4 }

function JoinPrompt() {
  const { account, requireProfile, openSignIn } = useArena()
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:py-28">
      <div className="mx-auto inline-block rounded-xl border border-console-line bg-console px-4 py-3 text-left font-mono text-[12px] leading-relaxed text-white/75">
        <p>
          <span className="text-accent">$</span> git log --author=you
        </p>
        <p className="text-white/50">fatal: your current branch does not have any commits yet</p>
      </div>
      <h1 className="mt-8 font-display text-4xl font-bold tracking-[-0.03em]">{account ? 'Finish your profile' : 'Track your progress'}</h1>
      <p className="mt-3 text-ink-soft">
        {account
          ? 'Add your CHARUSAT email, year and branch to unlock XP, levels, badges and a streak.'
          : 'Sign in with Google or GitHub to get a profile with XP, levels, badges and a streak — saved to your account on every device.'}
      </p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        {account ? (
          <button type="button" onClick={() => requireProfile()} className={buttonClass('primary', 'lg')}>
            Finish setup
          </button>
        ) : (
          <>
            <button type="button" onClick={() => openSignIn('signup')} className={buttonClass('primary', 'lg')}>
              Create account
            </button>
            <button type="button" onClick={() => openSignIn('signin')} className={buttonClass('secondary', 'lg')}>
              Sign in
            </button>
          </>
        )}
        <Link to="/arena" className={buttonClass('secondary', 'lg')}>
          Browse challenges
        </Link>
      </div>
    </div>
  )
}

export function ProfilePage() {
  useDocumentTitle('My progress')
  const now = useNow(60_000)
  const { profile, account, syncStatus, xp, level, rank, streak, solved, badges, state, ready, signOut } = useArena()
  if (account && !ready) return <div className="mx-auto max-w-6xl px-4 py-24 text-center text-muted" role="status">Loading your profile…</div>
  if (!profile) return <JoinPrompt />

  const mine = Object.entries(state.progress)
    .map(([slug, progress]) => ({ challenge: getChallenge(slug), progress }))
    .filter((e): e is { challenge: Challenge; progress: ChallengeProgress } => Boolean(e.challenge))
    .map((e) => ({ ...e, status: displayStatus(e.progress, getPhase(e.challenge, now)) }))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])

  const stats = [
    { label: 'Total XP', value: String(xp), Icon: Zap },
    { label: 'Leaderboard rank', value: rank ? `#${rank}` : '—', Icon: Trophy },
    { label: 'Completed', value: String(solved), Icon: GitMerge },
    { label: 'Current streak', value: `${streak} day${streak === 1 ? '' : 's'}`, Icon: Flame },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
      {/* ---------- Identity + level ---------- */}
      <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-7">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={profile.name} size="lg" highlight src={profile.photoURL} />
            <div>
              <h1 className="font-display text-3xl font-bold tracking-[-0.025em]">{profile.name}</h1>
              <p className="mt-0.5 text-sm text-muted">
                {profile.collegeId && <span className="font-mono">{profile.collegeId} · </span>}
                {yearLabel(profile.year)} · {profile.branch} · joined {formatDate(new Date(profile.joinedAt))}
              </p>
            </div>
          </div>
          <div className="w-full md:max-w-sm">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold">
                Level {level.number} · <span className="text-accent-strong">{level.title}</span>
              </p>
              <p className="font-mono text-xs text-muted">{xp} XP</p>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-sunken">
              <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${Math.max(3, level.progress * 100)}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-muted">
              {level.next ? `${level.next.min - xp} XP to reach ${level.next.title}` : 'Maximum level reached'}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-5 text-xs">
          {profile.email && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 font-mono text-ink-soft">
              {profile.email}
              {profile.emailVerified ? (
                <span className="inline-flex items-center gap-1 font-sans font-semibold text-easy">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Verified
                </span>
              ) : (
                <span className="font-sans text-muted">· not verified</span>
              )}
            </span>
          )}
          <SyncBadge status={syncStatus} />
          <button
            type="button"
            onClick={() => void signOut()}
            className="ml-auto inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:bg-hard-soft hover:text-hard"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log out
          </button>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-6 md:grid-cols-4">
          {stats.map(({ label, value, Icon }) => (
            <div key={label} className="rounded-xl bg-paper p-4">
              <dt className="flex items-center gap-1.5 text-xs text-muted">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </dt>
              <dd className="mt-1 font-display text-2xl font-semibold tabular-nums tracking-tight">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-8">
          {/* ---------- Activity ---------- */}
          <section aria-labelledby="activity-heading" className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
            <h2 id="activity-heading" className="font-display text-xl font-semibold tracking-[-0.01em]">
              Your activity
            </h2>
            <p className="mb-5 mt-1 text-sm text-muted">Starting, ticking off requirements and submitting all count. Show up daily to grow your streak.</p>
            <ActivityHeatmap activity={state.activity} />
          </section>

          {/* ---------- My challenges ---------- */}
          <section aria-labelledby="mine-heading" className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
            <h2 id="mine-heading" className="font-display text-xl font-semibold tracking-[-0.01em]">
              My challenges
            </h2>
            {mine.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-line-strong px-5 py-8 text-center">
                <p className="text-sm text-muted">You haven’t started a challenge yet.</p>
                <Link to="/arena" className={buttonClass('primary', 'sm', 'mt-4')}>
                  Find your first challenge
                </Link>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {mine.map(({ challenge, progress, status }) => (
                  <li key={challenge.slug}>
                    <Link to={`/challenges/${challenge.slug}`} className="group flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <CategoryTag category={challenge.category} />
                        <p className="mt-1 truncate font-semibold group-hover:text-accent-strong">{challenge.title}</p>
                        <p className="text-xs text-muted">
                          {status === 'completed' && progress.award
                            ? `+${progress.award.total} XP earned · scored ${progress.award.percent}%`
                            : status === 'changes_requested' && progress.review
                              ? `Scored ${progress.review.percent}% — needs ${PASS_MARK * 100}% · closes in ${formatDuration(challenge.closesAt.getTime() - now)}`
                              : status === 'in_progress'
                                ? `${progress.done.length} of ${challenge.requirements.length} requirements ticked · closes in ${formatDuration(challenge.closesAt.getTime() - now)}`
                                : status === 'submitted'
                                  ? 'Review running'
                                  : `Closed ${formatDate(challenge.closesAt)}`}
                        </p>
                      </div>
                      <StatusPill status={status} className="self-start sm:self-center" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-8">
          <NextUpCard now={now} />

          {/* ---------- Badges ---------- */}
          <section aria-labelledby="badges-heading" className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
            <div className="flex items-baseline justify-between">
              <h2 id="badges-heading" className="font-display text-xl font-semibold tracking-[-0.01em]">
                Badges
              </h2>
              <span className="font-mono text-xs text-muted">
                {badges.length}/{BADGES.length}
              </span>
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-3">
              {BADGES.map((badge) => {
                const earned = badges.includes(badge.id)
                const Icon = BADGE_ICONS[badge.id]
                return (
                  <li
                    key={badge.id}
                    className={cn('rounded-xl border p-3.5', earned ? 'border-accent/30 bg-accent-soft/60' : 'border-line bg-paper')}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full',
                        earned ? 'bg-accent text-white' : 'bg-sunken text-muted',
                      )}
                    >
                      {earned ? <Icon className="h-4 w-4" aria-hidden="true" /> : <Lock className="h-4 w-4" aria-hidden="true" />}
                    </span>
                    <p className={cn('mt-2.5 text-sm font-semibold', !earned && 'text-ink-soft')}>{badge.name}</p>
                    <p className="mt-0.5 text-xs leading-snug text-muted">{badge.description}</p>
                    <span className="sr-only">{earned ? 'Unlocked' : 'Locked'}</span>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
