export type Category = 'Web' | 'Git' | 'DSA' | 'Design' | 'Backend' | 'AI/ML' | 'Open Source' | 'Creative'
export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type Phase = 'active' | 'upcoming' | 'completed'
export type Branch = 'CE' | 'CSE' | 'IT' | 'AIML' | 'EC' | 'EE' | 'ME' | 'CL'
export type Year = 1 | 2 | 3 | 4

export interface Resource {
  label: string
  url: string
}

export interface Winner {
  participantId: string
  note: string
}

/** Something to look for in text; satisfied when it appears at least `min` times (default 1). */
export interface TermCheck {
  pattern: RegExp
  label: string
  min?: number
}

/**
 * How a requirement is verified against the submitted repository.
 * Every rule returns a score between 0 and 1, so partial work earns partial credit.
 */
export type Rule =
  /** A single file whose path matches `path` exists (and is at least `minBytes`). */
  | { kind: 'file'; path: RegExp; label: string; minBytes?: number }
  /** At least `min` files whose paths match. */
  | { kind: 'files'; path: RegExp; label: string; min: number }
  /** The README contains every term. */
  | { kind: 'readme'; checks: TermCheck[] }
  /** Files matching `path`, read together, contain every term. */
  | { kind: 'content'; path: RegExp; scope: string; checks: TermCheck[] }
  /** Every file matching `path` contains `pattern` at least `min` times. */
  | { kind: 'eachFile'; path: RegExp; scope: string; pattern: RegExp; label: string; min?: number }
  /** No file matching `path` contains `pattern`. */
  | { kind: 'noContent'; path: RegExp; pattern: RegExp; label: string }
  /** No file matching `path` exists (e.g. a committed .env). */
  | { kind: 'noFile'; path: RegExp; label: string }
  /** At least `min` commits pushed since the challenge opened. */
  | { kind: 'commits'; min: number }
  /** A merge commit (two parents) exists on the default branch. */
  | { kind: 'mergeCommit' }
  /** A merge commit explains itself beyond Git's default "Merge branch …" line. */
  | { kind: 'mergeMessage'; minLength: number }
  /** At least `share` of commit subjects match `pattern`. */
  | { kind: 'commitMessages'; pattern: RegExp; label: string; share: number }
  /** No commit subject matches `pattern`. */
  | { kind: 'avoidCommitMessages'; pattern: RegExp; label: string }
  /** No merge commits at all. */
  | { kind: 'linearHistory' }
  /** A live URL (form field, repo website or README link) responds. */
  | { kind: 'liveUrl' }

export interface Requirement {
  /** Short name used in the review console. */
  title: string
  /** What the participant has to do. */
  text: string
  /** Plain-English description of the automated check, shown before submitting. */
  how: string
  rule: Rule
  /** Relative share of the challenge's points (default 1). */
  weight?: number
}

export interface Challenge {
  slug: string
  title: string
  tagline: string
  category: Category
  difficulty: Difficulty
  points: number
  opensAt: Date
  closesAt: Date
  estimatedTime: string
  host: string
  /** Students who started (or registered interest in) the challenge. */
  participants: number
  problem: string[]
  requirements: Requirement[]
  rules: string[]
  skills: string[]
  resources: Resource[]
  results?: {
    submissions: number
    winners: Winner[]
  }
}

export interface Participant {
  id: string
  name: string
  year: Year
  branch: Branch
  xp: number
  solved: number
  streak: number
  /** A real signed-in builder (from the cloud leaderboard) rather than sample data. */
  live?: boolean
}
