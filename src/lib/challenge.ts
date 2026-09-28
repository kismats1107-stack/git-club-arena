import { CHALLENGES } from '../data/challenges'
import type { Challenge, Difficulty, Phase } from '../data/types'

export const DIFFICULTY_RANK: Record<Difficulty, number> = { Easy: 0, Medium: 1, Hard: 2 }

export function getPhase(challenge: Challenge, now: number): Phase {
  if (now < challenge.opensAt.getTime()) return 'upcoming'
  if (now > challenge.closesAt.getTime()) return 'completed'
  return 'active'
}

export function challengesInPhase(phase: Phase, now: number): Challenge[] {
  return CHALLENGES.filter((c) => getPhase(c, now) === phase)
}

export type SortKey = 'deadline' | 'points' | 'difficulty'

export function sortChallenges(list: Challenge[], sort: SortKey, phase: Phase): Challenge[] {
  const sorted = [...list]
  if (sort === 'points') return sorted.sort((a, b) => b.points - a.points)
  if (sort === 'difficulty') {
    return sorted.sort((a, b) => DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty] || b.points - a.points)
  }
  // "deadline" means the next relevant moment for each tab.
  if (phase === 'upcoming') return sorted.sort((a, b) => a.opensAt.getTime() - b.opensAt.getTime())
  if (phase === 'completed') return sorted.sort((a, b) => b.closesAt.getTime() - a.closesAt.getTime())
  return sorted.sort((a, b) => a.closesAt.getTime() - b.closesAt.getTime())
}

export function matchesQuery(challenge: Challenge, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [challenge.title, challenge.tagline, challenge.category, challenge.difficulty, ...challenge.skills]
    .join(' ')
    .toLowerCase()
    .includes(q)
}
