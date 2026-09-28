import { EARLY_PUSH_BONUS, EARLY_PUSH_WINDOW_MS } from '../config'
import { CHALLENGES, getChallenge } from '../data/challenges'
import { PARTICIPANTS } from '../data/participants'
import type { Branch, Challenge, Participant, Year } from '../data/types'
import { DIFFICULTY_RANK, getPhase } from './challenge'
import type { Review } from './review'
import { DAY, isoDay } from './time'

/**
 * in_progress → submitted (review running) → completed (approved)
 *                                          ↘ changes_requested → submitted → …
 */
export type ChallengeStatus = 'in_progress' | 'submitted' | 'changes_requested' | 'completed'

export interface Award {
  /** Points earned from the automated review. */
  base: number
  bonus: number
  total: number
  early: boolean
  percent: number
}

export interface ChallengeProgress {
  status: ChallengeStatus
  startedAt: string
  submittedAt?: string
  completedAt?: string
  /** Indexes of requirements ticked off — by hand while building, then synced from the review. */
  done: number[]
  repoUrl?: string
  liveUrl?: string
  attempts?: number
  review?: Review
  award?: Award
}

export interface Profile {
  name: string
  /** CHARUSAT college email, e.g. 25cs099@charusat.edu.in (optional only for profiles saved before it existed). */
  email?: string
  /** College ID read from the email, e.g. 25CS099. */
  collegeId?: string
  /** True when the college email is the one the sign-in provider verified. */
  emailVerified?: boolean
  provider?: 'google' | 'github' | 'demo'
  photoURL?: string
  year: Year
  branch: Branch
  joinedAt: string
}

export interface Climb {
  xpBefore: number
  xpAfter: number
  from: number | null
  to: number
}

export interface ArenaState {
  profile: Profile | null
  progress: Record<string, ChallengeProgress>
  /** Actions per local day (YYYY-MM-DD), used for the streak and the activity grid. */
  activity: Record<string, number>
  celebratedBadges: string[]
  climb: Climb | null
}

export const INITIAL_STATE: ArenaState = {
  profile: null,
  progress: {},
  activity: {},
  celebratedBadges: [],
  climb: null,
}

/* ---------- XP & levels ---------- */

export function totalXp(progress: ArenaState['progress']): number {
  return Object.values(progress).reduce((sum, p) => sum + (p.award?.total ?? 0), 0)
}

// Git-flavoured ranks: you grow from your first commit to maintaining the codebase.
export const LEVELS = [
  { min: 0, title: 'Initial Commit' },
  { min: 150, title: 'Contributor' },
  { min: 400, title: 'Committer' },
  { min: 800, title: 'Maintainer' },
  { min: 1400, title: 'Core Maintainer' },
] as const

export function getLevel(xp: number) {
  let index = 0
  LEVELS.forEach((level, i) => {
    if (xp >= level.min) index = i
  })
  const current = LEVELS[index]
  const next = LEVELS[index + 1]
  const progress = next ? (xp - current.min) / (next.min - current.min) : 1
  return { number: index + 1, title: current.title, min: current.min, next, progress }
}

/* ---------- Scoring ---------- */

export function computeAward(challenge: Challenge, review: Review, submittedAt: Date): Award {
  const early = challenge.closesAt.getTime() - submittedAt.getTime() > EARLY_PUSH_WINDOW_MS
  const bonus = early ? EARLY_PUSH_BONUS : 0
  return { base: review.score, bonus, total: review.score + bonus, early, percent: review.percent }
}

/* ---------- Leaderboard ---------- */

export interface BoardEntry extends Participant {
  isYou: boolean
}

export const YOU_ID = 'you'

export function buildBoard(
  profile: Profile | null,
  xp: number,
  solved: number,
  streak: number,
  others: Participant[] = PARTICIPANTS,
): BoardEntry[] {
  const entries: BoardEntry[] = others.map((p) => ({ ...p, isYou: false }))
  if (profile && xp > 0) {
    entries.push({ id: YOU_ID, name: profile.name, year: profile.year, branch: profile.branch, xp, solved, streak, isYou: true })
  }
  // On equal XP, the participant who reached it most recently (you) ranks higher.
  return entries.sort((a, b) => b.xp - a.xp || Number(b.isYou) - Number(a.isYou))
}

/** Rank among everyone on the board; null until you have earned XP. */
export function rankFor(xp: number, others: Participant[] = PARTICIPANTS): number | null {
  if (xp <= 0) return null
  return others.filter((p) => p.xp > xp).length + 1
}

/** The participant directly above you, so the UI can say how far away the next place is. */
export function nextRival(xp: number, others: Participant[] = PARTICIPANTS): Participant | undefined {
  return others.filter((p) => p.xp > xp).sort((a, b) => a.xp - b.xp)[0]
}

/* ---------- Streak ---------- */

export function currentStreak(activity: ArenaState['activity'], now = new Date()): number {
  const day = new Date(now)
  day.setHours(12, 0, 0, 0)
  // A streak survives until the end of today, so start from yesterday if nothing happened yet today.
  if (!activity[isoDay(day)]) day.setTime(day.getTime() - DAY)
  let streak = 0
  while (activity[isoDay(day)]) {
    streak += 1
    day.setTime(day.getTime() - DAY)
  }
  return streak
}

/* ---------- Badges ---------- */

export type BadgeId = 'first-commit' | 'first-merge' | 'early-push' | 'green-pipeline' | 'hard-mode' | 'polyglot' | 'on-a-streak'

export interface BadgeDef {
  id: BadgeId
  name: string
  description: string
}

export const BADGES: BadgeDef[] = [
  { id: 'first-commit', name: 'First Commit', description: 'Start your first challenge' },
  { id: 'first-merge', name: 'First Merge', description: 'Complete your first challenge' },
  { id: 'early-push', name: 'Early Push', description: 'Submit more than 24 hours before a deadline' },
  { id: 'green-pipeline', name: 'Green Pipeline', description: 'Pass every requirement with full marks' },
  { id: 'hard-mode', name: 'Hard Mode', description: 'Complete a Hard challenge' },
  { id: 'polyglot', name: 'Polyglot', description: 'Complete challenges in three different categories' },
  { id: 'on-a-streak', name: 'On a Streak', description: 'Stay active three days in a row' },
]

export function earnedBadges(state: ArenaState): BadgeId[] {
  const entries = Object.entries(state.progress)
  const completed = entries
    .filter(([, p]) => p.status === 'completed')
    .map(([slug, p]) => ({ challenge: getChallenge(slug), progress: p }))
    .filter((e): e is { challenge: Challenge; progress: ChallengeProgress } => Boolean(e.challenge))

  const earned: BadgeId[] = []
  if (entries.length > 0) earned.push('first-commit')
  if (completed.length > 0) earned.push('first-merge')
  if (completed.some((e) => e.progress.award?.early)) earned.push('early-push')
  if (completed.some((e) => e.progress.review?.percent === 100)) earned.push('green-pipeline')
  if (completed.some((e) => e.challenge.difficulty === 'Hard')) earned.push('hard-mode')
  if (new Set(completed.map((e) => e.challenge.category)).size >= 3) earned.push('polyglot')
  if (currentStreak(state.activity) >= 3) earned.push('on-a-streak')
  return earned
}

/* ---------- What should I do next? ---------- */

/**
 * Picks the best live challenge the participant hasn't touched: one step above the
 * hardest difficulty they've completed, breaking ties by the nearest deadline.
 */
export function recommendChallenge(progress: ArenaState['progress'], now: number, exclude?: string): Challenge | undefined {
  const candidates = CHALLENGES.filter((c) => getPhase(c, now) === 'active' && !progress[c.slug] && c.slug !== exclude)
  const completedRanks = Object.entries(progress)
    .filter(([, p]) => p.status === 'completed')
    .map(([slug]) => getChallenge(slug))
    .filter((c): c is Challenge => Boolean(c))
    .map((c) => DIFFICULTY_RANK[c.difficulty])
  const target = Math.min(2, (completedRanks.length ? Math.max(...completedRanks) : -1) + 1)
  return candidates.sort(
    (a, b) =>
      Math.abs(DIFFICULTY_RANK[a.difficulty] - target) - Math.abs(DIFFICULTY_RANK[b.difficulty] - target) ||
      a.closesAt.getTime() - b.closesAt.getTime(),
  )[0]
}
