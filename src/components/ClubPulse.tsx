import { Pause, Play } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { CHALLENGES, getChallenge } from '../data/challenges'
import { PARTICIPANTS } from '../data/participants'
import type { Challenge } from '../data/types'
import { useNow } from '../hooks/useNow'
import { getPhase } from '../lib/challenge'
import { cn } from '../lib/cn'
import { relativeAgo } from '../lib/time'
import { useArena } from '../state/arena'
import { Avatar } from './Avatar'
import { CATEGORY_COLORS } from './Tags'

type PulseKind = 'started' | 'submitted' | 'changes' | 'merged'

interface PulseEvent {
  id: string
  who: string
  you?: boolean
  kind: PulseKind
  challenge: Challenge
  at: number
  xp?: number
  sha: string
}

const VERB: Record<PulseKind, string> = {
  started: 'started',
  submitted: 'pushed a submission to',
  changes: 'got changes requested on',
  merged: 'merged',
}

const ROW = 60
const VISIBLE = 7
const LANE_X = [12, 30, 48]

/** Small deterministic PRNG so the seeded history looks the same on every visit. */
function random(seed: number) {
  let t = seed
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), t | 1)
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function makeEvent(rand: () => number, at: number, live: Challenge[], kind?: PulseKind): PulseEvent {
  const person = PARTICIPANTS[Math.floor(rand() * PARTICIPANTS.length)]
  const challenge = live[Math.floor(rand() * live.length)]
  const k = kind ?? (['merged', 'started', 'submitted', 'merged', 'changes'] as const)[Math.floor(rand() * 5)]
  const sha = Math.floor(rand() * 0xfffffff)
    .toString(16)
    .padStart(7, '0')
  return {
    id: `${sha}-${at}`,
    who: person.name,
    kind: k,
    challenge,
    at,
    sha,
    xp: k === 'merged' ? Math.round((challenge.points * (75 + Math.floor(rand() * 26))) / 100) : undefined,
  }
}

function laneOf(challenge: Challenge): number {
  return 1 + (CHALLENGES.indexOf(challenge) % 2)
}

/** One row of the `git log --graph` gutter. */
function GraphCell({ event }: { event: PulseEvent }) {
  const color = CATEGORY_COLORS[event.challenge.category]
  const branch = laneOf(event.challenge)
  const nodeLane = event.kind === 'merged' ? 0 : branch
  const x = LANE_X[nodeLane]
  const mid = ROW / 2
  return (
    <svg width="60" height={ROW} viewBox={`0 0 60 ${ROW}`} className="shrink-0" aria-hidden="true">
      <line x1={LANE_X[0]} y1="0" x2={LANE_X[0]} y2={ROW} stroke="var(--color-line-strong)" strokeWidth="2" />
      {[1, 2].map((lane) => (
        <line key={lane} x1={LANE_X[lane]} y1="0" x2={LANE_X[lane]} y2={ROW} stroke="var(--color-line)" strokeWidth="2" strokeDasharray="3 4" />
      ))}
      {event.kind === 'merged' && (
        <path
          d={`M ${LANE_X[branch]} 0 C ${LANE_X[branch]} ${mid - 10}, ${LANE_X[0]} ${mid - 16}, ${LANE_X[0]} ${mid}`}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
      )}
      {event.kind === 'merged' ? (
        <>
          <circle cx={x} cy={mid} r="7" fill="var(--color-accent)" />
          <circle cx={x} cy={mid} r="2.5" fill="var(--color-surface)" />
        </>
      ) : (
        <circle
          cx={x}
          cy={mid}
          r="5.5"
          fill={event.kind === 'submitted' ? color : 'var(--color-surface)'}
          stroke={event.kind === 'changes' ? 'var(--color-hard)' : color}
          strokeWidth="2.5"
        />
      )}
    </svg>
  )
}

/**
 * "Live from the club": recent activity drawn as a git history graph. Seeded club
 * activity streams in every few seconds; your own starts, reviews and merges appear too.
 */
export function ClubPulse() {
  const now = useNow(15_000)
  const { state } = useArena()
  const [paused, setPaused] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [reduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  const [feed, setFeed] = useState<PulseEvent[]>(() => {
    const start = Date.now()
    const live = CHALLENGES.filter((c) => getPhase(c, start) === 'active')
    const rand = random(2026)
    const kinds: PulseKind[] = ['merged', 'started', 'submitted', 'merged', 'changes', 'started', 'merged']
    return [3, 9, 17, 29, 46, 64, 88].map((minutes, i) => makeEvent(rand, start - minutes * 60_000, live, kinds[i]))
  })

  const streaming = !paused && !hovering && !reduceMotion

  useEffect(() => {
    if (!streaming) return
    const rand = random(Date.now() % 100_000)
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      const live = CHALLENGES.filter((c) => getPhase(c, Date.now()) === 'active')
      setFeed((list) => [makeEvent(rand, Date.now(), live), ...list].slice(0, 12))
    }, 7000)
    return () => window.clearInterval(id)
  }, [streaming])

  const mine = useMemo<PulseEvent[]>(() => {
    const events: PulseEvent[] = []
    for (const [slug, p] of Object.entries(state.progress)) {
      const challenge = getChallenge(slug)
      if (!challenge) continue
      const base = { who: 'You', you: true, challenge }
      events.push({ ...base, id: `you-start-${slug}`, kind: 'started', at: Date.parse(p.startedAt), sha: 'HEAD' })
      if (p.review && p.submittedAt && p.status !== 'completed') {
        events.push({ ...base, id: `you-rev-${slug}`, kind: 'changes', at: Date.parse(p.submittedAt), sha: p.review.headSha.slice(0, 7) })
      }
      if (p.status === 'completed' && p.completedAt) {
        events.push({
          ...base,
          id: `you-merge-${slug}`,
          kind: 'merged',
          at: Date.parse(p.completedAt),
          xp: p.award?.total,
          sha: p.review?.headSha.slice(0, 7) ?? 'HEAD',
        })
      }
    }
    return events
  }, [state.progress])

  const rows = [...mine, ...feed].sort((a, b) => b.at - a.at).slice(0, VISIBLE)

  return (
    <section
      aria-labelledby="pulse-title"
      className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setHovering(false)}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="pulse-title" className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Live from the club
          </h2>
          <p className="mt-1 font-mono text-[11px] text-muted/80">$ git log --graph --all</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold', streaming ? 'text-easy' : 'text-muted')}>
            <span className={cn('h-2 w-2 rounded-full', streaming ? 'animate-pulse-dot bg-easy' : 'bg-line-strong')} aria-hidden="true" />
            {streaming ? 'Live' : 'Paused'}
          </span>
          {!reduceMotion && (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-pressed={paused}
              aria-label={paused ? 'Resume live feed' : 'Pause live feed'}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-sunken hover:text-ink active:scale-95"
            >
              {paused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
            </button>
          )}
        </div>
      </div>

      <ol className="relative mt-3 overflow-hidden" style={{ height: ROW * VISIBLE }} aria-label="Recent club activity">
        <AnimatePresence initial={false} mode="popLayout">
          {rows.map((event) => (
            <motion.li
              key={event.id}
              layout="position"
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className="flex items-center"
              style={{ height: ROW }}
            >
              <GraphCell event={event} />
              <Avatar name={event.who === 'You' ? (state.profile?.name ?? 'You') : event.who} size="sm" highlight={event.you} />
              <div className="ml-3 min-w-0 flex-1">
                <p className="truncate text-sm text-ink-soft">
                  <span className={cn('font-semibold', event.you ? 'text-accent-strong' : 'text-ink')}>{event.who}</span> {VERB[event.kind]}{' '}
                  <Link to={`/challenges/${event.challenge.slug}`} className="font-medium text-ink hover:text-accent-strong hover:underline">
                    {event.challenge.title}
                  </Link>
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-muted">
                  {event.sha} · {relativeAgo(new Date(event.at), now)}
                </p>
              </div>
              {event.xp !== undefined && (
                <span className="ml-3 shrink-0 rounded-full bg-accent-soft px-2 py-0.5 font-mono text-[11px] font-semibold text-accent-strong">
                  +{event.xp} XP
                </span>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </section>
  )
}
