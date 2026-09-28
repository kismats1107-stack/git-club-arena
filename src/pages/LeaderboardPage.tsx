import { ArrowDown, ArrowUp, Crown, Flame, Medal } from 'lucide-react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Avatar } from '../components/Avatar'
import { buttonClass } from '../components/Button'
import { YEARS, yearLabel } from '../data/participants'
import type { Year } from '../data/types'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useNow } from '../hooks/useNow'
import { cn } from '../lib/cn'
import { cloudEnabled } from '../lib/cloud'
import { buildBoard, nextRival, recommendChallenge, YOU_ID } from '../lib/progress'
import { climbMessage, useArena } from '../state/arena'

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-5 w-5 text-[#c68a00]" fill="#f3c74a" aria-label="Rank 1" />
  if (rank === 2) return <Medal className="h-5 w-5 text-[#8a94a3]" aria-label="Rank 2" />
  if (rank === 3) return <Medal className="h-5 w-5 text-[#b0703b]" aria-label="Rank 3" />
  return <span className="font-mono text-sm font-semibold tabular-nums text-muted">#{rank}</span>
}

function scrollToYou(smooth: boolean) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById('your-row')?.scrollIntoView({ behavior: smooth && !reduce ? 'smooth' : 'auto', block: 'center' })
}

export function LeaderboardPage() {
  useDocumentTitle('Leaderboard')
  const { profile, xp, rank, solved, streak, state, clearClimb, requireProfile, others } = useArena()
  const [yearFilter, setYearFilter] = useState<Year | null>(null)
  const now = useNow(30_000)

  // Replay a fresh climb: render your old position first, then let the row slide into the new one.
  const [climb] = useState(() => state.climb)
  const [stage, setStage] = useState<'before' | 'after'>(climb ? 'before' : 'after')
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (!climb) return
    scrollToYou(false)
    const move = window.setTimeout(() => {
      setStage('after')
      setFlash(true)
      clearClimb()
      window.setTimeout(() => scrollToYou(true), 450)
    }, 900)
    const unflash = window.setTimeout(() => setFlash(false), 3200)
    return () => {
      window.clearTimeout(move)
      window.clearTimeout(unflash)
    }
  }, [climb, clearClimb])

  const before = stage === 'before' && climb
  const board = buildBoard(profile, before ? climb.xpBefore : xp, before ? Math.max(0, solved - 1) : solved, streak, others)
  const rows = yearFilter ? board.filter((e) => e.year === yearFilter) : board
  const rival = nextRival(xp, others)
  const recommended = recommendChallenge(state.progress, now)

  return (
    <div className="mx-auto max-w-4xl px-4 pt-10 sm:px-6 sm:pt-14">
      <p className="font-mono text-xs text-muted">$ git shortlog --summary --numbered</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-[-0.03em] sm:text-5xl">Leaderboard</h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        Season standings for everyone who has earned XP in Arena challenges. It updates the moment a submission is merged.
      </p>
      {cloudEnabled && (
        <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-easy">
          <span className="h-2 w-2 animate-pulse-dot rounded-full bg-easy" aria-hidden="true" />
          Updating live · real builders are tagged LIVE
        </p>
      )}

      {/* ---------- Your standing ---------- */}
      <div className="mt-8 rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
        {!profile ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-lg font-semibold">You’re not on the board yet</p>
              <p className="text-sm text-muted">Join, then complete any challenge — even an Easy one puts you on the board.</p>
            </div>
            <button type="button" onClick={() => requireProfile()} className={buttonClass('primary')}>
              Join the Arena
            </button>
          </div>
        ) : rank === null ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-lg font-semibold">Not ranked yet, {profile.name.split(' ')[0]}</p>
              <p className="text-sm text-muted">Complete your first challenge to enter the board.</p>
            </div>
            <Link to={recommended ? `/challenges/${recommended.slug}` : '/arena'} className={buttonClass('primary')}>
              {recommended ? `Try “${recommended.title}”` : 'Browse challenges'}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <div>
                <p className="text-xs text-muted">Your rank</p>
                <p className="font-display text-5xl font-bold tabular-nums tracking-tight text-accent-strong">#{rank}</p>
              </div>
              <div className="h-12 w-px bg-line" aria-hidden="true" />
              <div className="text-sm">
                <p className="font-mono font-semibold tabular-nums">{xp} XP</p>
                <p className="text-muted">
                  {rival ? (
                    <>
                      <span className="font-semibold text-ink">{rival.xp - xp} XP</span> behind {rival.name} (#{rank - 1})
                    </>
                  ) : (
                    'You’re at the top. Defend it.'
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => scrollToYou(true)} className={buttonClass('secondary', 'sm')}>
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
                Jump to my row
              </button>
              {recommended && (
                <Link to={`/challenges/${recommended.slug}`} className={buttonClass('primary', 'sm')}>
                  Earn more XP
                </Link>
              )}
            </div>
          </div>
        )}

        <AnimatePresence>
          {climb && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="overflow-hidden"
            >
              <span className="mt-4 flex items-center gap-2 rounded-xl bg-easy-soft px-3.5 py-2.5 text-sm font-semibold text-easy">
                <ArrowUp className="h-4 w-4" aria-hidden="true" />
                {climbMessage(climb)}
              </span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ---------- Filters ---------- */}
      <div className="mt-8 flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="group" aria-label="Filter by year">
        {[null, ...YEARS].map((y) => (
          <button
            key={y ?? 'all'}
            type="button"
            aria-pressed={yearFilter === y}
            onClick={() => setYearFilter(y)}
            className={cn(
              'h-11 shrink-0 cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors active:scale-95 sm:h-9 sm:px-3.5',
              yearFilter === y ? 'border-ink bg-ink text-paper' : 'border-line bg-surface text-ink-soft hover:border-line-strong',
            )}
          >
            {y ? yearLabel(y) : 'All years'}
          </button>
        ))}
      </div>

      {/* ---------- Board ---------- */}
      <div className="mt-4 overflow-hidden rounded-card border border-line bg-surface shadow-card">
        <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_auto] gap-3 border-b border-line bg-sunken/60 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-muted sm:grid-cols-[3.5rem_minmax(0,1fr)_5rem_5rem_6.5rem]">
          <span>Rank</span>
          <span>Builder</span>
          <span className="hidden text-right sm:block">Solved</span>
          <span className="hidden text-right sm:block">Streak</span>
          <span className="text-right">XP</span>
        </div>
        <LayoutGroup>
          <ol>
            <AnimatePresence initial={false}>
              {rows.map((entry, i) => (
                <motion.li
                  key={entry.id}
                  id={entry.id === YOU_ID ? 'your-row' : undefined}
                  layout="position"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ layout: { type: 'spring', stiffness: 170, damping: 24 }, opacity: { duration: 0.25 } }}
                  className={cn(
                    'relative grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 sm:grid-cols-[3.5rem_minmax(0,1fr)_5rem_5rem_6.5rem]',
                    entry.isYou ? 'z-10 bg-accent-soft' : 'bg-surface transition-colors hover:bg-sunken/70',
                    entry.isYou && flash && 'ring-2 ring-inset ring-accent',
                  )}
                >
                  <span className="flex items-center">
                    <RankBadge rank={i + 1} />
                  </span>
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={entry.name} highlight={entry.isYou} src={entry.isYou ? profile?.photoURL : undefined} />
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-semibold">
                        <span className="truncate">{entry.name}</span>
                        {entry.live && !entry.isYou && (
                          <span className="shrink-0 rounded bg-easy-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-easy" title="A real signed-in builder">
                            Live
                          </span>
                        )}
                        {entry.isYou && (
                          <span className="shrink-0 rounded bg-accent-strong px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted">
                        {yearLabel(entry.year)} · {entry.branch}
                        <span className="sm:hidden"> · {entry.solved} solved</span>
                      </p>
                    </div>
                  </div>
                  <span className="hidden text-right font-mono text-sm tabular-nums text-ink-soft sm:block">{entry.solved}</span>
                  <span className="hidden items-center justify-end gap-1 font-mono text-sm tabular-nums sm:flex">
                    {entry.streak > 0 ? (
                      <>
                        <Flame className="h-4 w-4 text-accent" aria-hidden="true" />
                        {entry.streak}d
                      </>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </span>
                  <span className="text-right font-mono text-sm font-semibold tabular-nums">{entry.xp.toLocaleString('en-IN')} XP</span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
        </LayoutGroup>
        {rows.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted">No builders from this year on the board yet.</p>}
      </div>
      <p className="mt-3 text-xs text-muted">Ties are ordered by who reached the score most recently. Streak = consecutive days with activity.</p>
    </div>
  )
}
