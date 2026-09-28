import { PASS_MARK } from '../config'
import type { Challenge, Rule, TermCheck } from '../data/types'
import { formatTime } from './time'

/*
 * Automated review of a submitted GitHub repository.
 *
 * Everything runs in the browser against public GitHub endpoints:
 *  - api.github.com for repository metadata, commit history and the file tree
 *    (3 requests per review; the unauthenticated limit is 60/hour per network)
 *  - raw.githubusercontent.com for file contents, pinned to the head commit SHA so
 *    a fresh push is never hidden behind a cached copy (not counted against the limit)
 */

export type ItemStatus = 'queued' | 'running' | 'pass' | 'partial' | 'fail'
export type StageStatus = 'queued' | 'running' | 'done'

export interface StageView {
  id: 'repo' | 'history' | 'files'
  label: string
  status: StageStatus
  detail?: string
}

export interface ItemView {
  status: ItemStatus
  earned: number
  max: number
  evidence?: string
}

/** Live state streamed to the UI while a review runs. */
export interface ReviewProgress {
  target: string
  stages: StageView[]
  items: ItemView[]
  score: number
  max: number
}

export interface ReviewItem {
  status: 'pass' | 'partial' | 'fail'
  earned: number
  max: number
  evidence: string
}

/** The stored result of a finished review. */
export interface Review {
  repoUrl: string
  fullName: string
  branch: string
  headSha: string
  language: string | null
  analysedAt: string
  fileCount: number
  commitCount: number
  items: ReviewItem[]
  score: number
  max: number
  percent: number
  approved: boolean
}

type ReviewErrorCode = 'invalid' | 'not_found' | 'empty' | 'rate_limited' | 'network'

export class ReviewError extends Error {
  code: ReviewErrorCode
  constructor(code: ReviewErrorCode, message: string) {
    super(message)
    this.name = 'ReviewError'
    this.code = code
  }
}

/* ---------- URL helpers ---------- */

const REPO_URL = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9._-]+?)(?:\.git)?(?:[/?#].*)?$/i

export function parseRepoUrl(input: string): { owner: string; repo: string } | null {
  const match = input.trim().match(REPO_URL)
  return match ? { owner: match[1], repo: match[2] } : null
}

export function parseWebUrl(input: string | null | undefined): URL | null {
  if (!input?.trim()) return null
  try {
    const url = new URL(input.trim())
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

/* ---------- Points ---------- */

/** Splits a challenge's points across its requirements by weight; the parts always add up exactly. */
export function requirementPoints(challenge: Challenge): number[] {
  const weights = challenge.requirements.map((r) => r.weight ?? 1)
  const total = weights.reduce((a, b) => a + b, 0)
  const shares = weights.map((w) => Math.floor((challenge.points * w) / total))
  let remainder = challenge.points - shares.reduce((a, b) => a + b, 0)
  for (let i = 0; remainder > 0; i = (i + 1) % shares.length, remainder--) shares[i] += 1
  return shares
}

/* ---------- GitHub access ---------- */

const API = 'https://api.github.com'
const RAW = 'https://raw.githubusercontent.com'
const IGNORED = /(^|\/)(node_modules|dist|build|out|coverage|vendor|\.next|\.git)\//i
const LOCKFILES = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|poetry\.lock|Cargo\.lock)$/i
const MAX_TEXT_BYTES = 300_000

interface GhRepo {
  full_name: string
  default_branch: string
  homepage: string | null
  language: string | null
}

interface GhCommit {
  sha: string
  parents: Array<{ sha: string }>
  commit: { message: string; committer: { date: string } | null; author: { date: string } | null }
}

interface GhTree {
  truncated: boolean
  tree: Array<{ path: string; type: string; size?: number }>
}

async function api<T>(path: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API}${path}`, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    throw new ReviewError('network', 'Could not reach GitHub. Check your internet connection and try again.')
  }
  if (res.ok) return (await res.json()) as T
  if (res.status === 404) {
    throw new ReviewError('not_found', 'Repository not found. Check the link and make sure the repository is public.')
  }
  if (res.status === 409) {
    throw new ReviewError('empty', 'This repository is empty. Push at least one commit, then run the review again.')
  }
  if (res.status === 403 || res.status === 429) {
    const reset = Number(res.headers.get('x-ratelimit-reset'))
    const when = reset ? ` It resets at ${formatTime(new Date(reset * 1000))}.` : ''
    throw new ReviewError(
      'rate_limited',
      `GitHub’s free API allows 60 requests an hour from one network, and that limit has been used up.${when} Each review uses 3 requests.`,
    )
  }
  throw new ReviewError('network', `GitHub returned an unexpected error (${res.status}). Please try again.`)
}

interface Snapshot {
  owner: string
  repo: string
  homepage: string | null
  headSha: string
  files: Array<{ path: string; size: number }>
  readmePath: string | null
  commits: Array<{ sha: string; message: string; date: Date; parents: number }>
}

/* ---------- Rule evaluation ---------- */

interface Outcome {
  fraction: number
  evidence: string
}

interface Context {
  snapshot: Snapshot
  challenge: Challenge
  liveUrl?: string
  read: (path: string) => Promise<string>
}

function test(pattern: RegExp, text: string): boolean {
  return new RegExp(pattern.source, pattern.flags.replace('g', '')).test(text)
}

function count(pattern: RegExp, text: string): number {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
  return text.match(new RegExp(pattern.source, flags))?.length ?? 0
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

function subject(message: string): string {
  return message.split('\n')[0].trim()
}

function clip(text: string, max = 72): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function formatBytes(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`
}

function filesMatching(snapshot: Snapshot, path: RegExp, limit: number) {
  return snapshot.files.filter((f) => test(path, f.path) && f.size <= MAX_TEXT_BYTES).slice(0, limit)
}

/** Scores a set of term checks against text; each check earns partial credit up to its minimum count. */
function scoreTerms(checks: TermCheck[], text: string, where: string): Outcome {
  const results = checks.map((c) => {
    const n = count(c.pattern, text)
    const min = c.min ?? 1
    return { ...c, n, min, fraction: Math.min(1, n / min) }
  })
  const describe = (r: (typeof results)[number]) => (r.min > 1 ? `${r.label} (${Math.min(r.n, 999)}/${r.min})` : r.label)
  const found = results.filter((r) => r.fraction >= 1)
  const missing = results.filter((r) => r.fraction < 1)
  const fraction = results.reduce((sum, r) => sum + r.fraction, 0) / results.length
  let evidence: string
  if (missing.length === 0) evidence = `Found ${found.map(describe).join(', ')} in ${where}`
  else if (found.length === 0 && results.every((r) => r.n === 0)) evidence = `Missing ${missing.map((r) => r.label).join(', ')} in ${where}`
  else evidence = `${found.length ? `Found ${found.map(describe).join(', ')} · ` : ''}missing ${missing.map(describe).join(', ')}`
  return { fraction, evidence }
}

async function readmeLinks(ctx: Context): Promise<URL[]> {
  if (!ctx.snapshot.readmePath) return []
  const text = await ctx.read(ctx.snapshot.readmePath)
  return (text.match(/https?:\/\/[^\s)"'<>\]]+/g) ?? [])
    .map((href) => parseWebUrl(href))
    .filter((url): url is URL => Boolean(url) && !/(^|\.)(github\.com|githubusercontent\.com|shields\.io)$/i.test((url as URL).host))
}

/** A no-cors request resolves for any reachable server, which is all a browser can learn cross-origin. */
async function isReachable(url: URL): Promise<boolean> {
  try {
    await fetch(url.href, { mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(8000) })
    return true
  } catch {
    return false
  }
}

async function evaluate(rule: Rule, ctx: Context): Promise<Outcome> {
  const { snapshot, challenge } = ctx
  const sinceOpen = snapshot.commits.filter((c) => c.date >= challenge.opensAt)
  const merges = snapshot.commits.filter((c) => c.parents > 1)

  switch (rule.kind) {
    case 'file': {
      const found = snapshot.files.find((f) => test(rule.path, f.path))
      if (!found) return { fraction: 0, evidence: `No ${rule.label} in the repository` }
      if (rule.minBytes && found.size < rule.minBytes) {
        return { fraction: 0.5, evidence: `${found.path} is only ${formatBytes(found.size)} — add more detail` }
      }
      return { fraction: 1, evidence: `Found ${found.path} (${formatBytes(found.size)})` }
    }

    case 'files': {
      const n = snapshot.files.filter((f) => test(rule.path, f.path)).length
      if (n === 0) return { fraction: 0, evidence: `No ${rule.label} found` }
      return { fraction: n / rule.min, evidence: `${n} ${rule.label} found${n < rule.min ? ` — need ${rule.min}` : ''}` }
    }

    case 'readme': {
      if (!snapshot.readmePath) return { fraction: 0, evidence: 'No README in the repository' }
      return scoreTerms(rule.checks, await ctx.read(snapshot.readmePath), snapshot.readmePath)
    }

    case 'content': {
      const targets = filesMatching(snapshot, rule.path, 30)
      if (targets.length === 0) return { fraction: 0, evidence: `No ${rule.scope} to check` }
      const text = (await Promise.all(targets.map((f) => ctx.read(f.path)))).join('\n')
      return scoreTerms(rule.checks, text, plural(targets.length, 'file'))
    }

    case 'eachFile': {
      const targets = filesMatching(snapshot, rule.path, 12)
      if (targets.length === 0) return { fraction: 0, evidence: `No ${rule.scope} to check` }
      const texts = await Promise.all(targets.map((f) => ctx.read(f.path)))
      const failing = targets.filter((_, i) => count(rule.pattern, texts[i]) < (rule.min ?? 1))
      const passing = targets.length - failing.length
      if (failing.length === 0) return { fraction: 1, evidence: `${rule.label} in all ${plural(targets.length, 'file')}` }
      const name = failing[0].path.split('/').pop()
      return {
        fraction: passing / targets.length,
        evidence: `${rule.label} in ${passing} of ${targets.length} files — missing in ${name}${failing.length > 1 ? ` and ${failing.length - 1} more` : ''}`,
      }
    }

    case 'noContent': {
      const targets = filesMatching(snapshot, rule.path, 40)
      if (targets.length === 0) return { fraction: 0, evidence: 'No matching files to scan' }
      const texts = await Promise.all(targets.map((f) => ctx.read(f.path)))
      const hit = texts.findIndex((t) => test(rule.pattern, t))
      if (hit === -1) return { fraction: 1, evidence: `No ${rule.label} in ${plural(targets.length, 'file')} scanned` }
      const line = texts[hit].split('\n').findIndex((l) => test(rule.pattern, l)) + 1
      return { fraction: 0, evidence: `${rule.label[0].toUpperCase()}${rule.label.slice(1)} in ${targets[hit].path}${line > 0 ? ` (line ${line})` : ''}` }
    }

    case 'noFile': {
      const found = snapshot.files.find((f) => test(rule.path, f.path))
      return found
        ? { fraction: 0, evidence: `${found.path} is committed — remove it from Git and rotate anything inside it` }
        : { fraction: 1, evidence: `No ${rule.label} in the repository` }
    }

    case 'commits': {
      const n = sinceOpen.length
      return {
        fraction: n / rule.min,
        evidence: `${plural(n, 'commit')} since the challenge opened${n < rule.min ? ` — need ${rule.min}` : ''}`,
      }
    }

    case 'mergeCommit': {
      const merge = merges[0]
      return merge
        ? { fraction: 1, evidence: `Merge commit ${merge.sha.slice(0, 7)}: “${clip(subject(merge.message), 60)}”` }
        : { fraction: 0, evidence: 'No merge commit on the default branch — use git merge, not rebase or fast-forward' }
    }

    case 'mergeMessage': {
      if (merges.length === 0) return { fraction: 0, evidence: 'No merge commit to read' }
      const explained = merges
        .map((c) => ({
          commit: c,
          text: c.message
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l && !l.startsWith('#') && !/^Merge (branch|pull request|remote-tracking branch|commit)\b/i.test(l))
            .join(' '),
        }))
        .sort((a, b) => b.text.length - a.text.length)[0]
      const len = explained.text.length
      if (len >= rule.minLength) return { fraction: 1, evidence: `“${clip(explained.text)}”` }
      if (len > 0) return { fraction: len / rule.minLength, evidence: `Only ${len} characters of explanation — say which version you kept and why` }
      return { fraction: 0, evidence: `Only Git’s default message: “${clip(subject(explained.commit.message), 60)}”` }
    }

    case 'commitMessages': {
      const pool = (sinceOpen.length ? sinceOpen : snapshot.commits).filter((c) => c.parents < 2)
      if (pool.length === 0) return { fraction: 0, evidence: 'No commits to check' }
      const ok = pool.filter((c) => test(rule.pattern, subject(c.message))).length
      return { fraction: ok / pool.length / rule.share, evidence: `${ok} of ${pool.length} commits follow ${rule.label}` }
    }

    case 'avoidCommitMessages': {
      const bad = snapshot.commits.filter((c) => test(rule.pattern, subject(c.message)))
      return bad.length
        ? { fraction: 0, evidence: `${plural(bad.length, 'commit')} still say ${rule.label}, e.g. ${bad[0].sha.slice(0, 7)}` }
        : { fraction: 1, evidence: `No ${rule.label} commits left in ${plural(snapshot.commits.length, 'commit')}` }
    }

    case 'linearHistory':
      return merges.length
        ? { fraction: 0, evidence: `${plural(merges.length, 'merge commit')} found — rebase instead of merging` }
        : { fraction: 1, evidence: `Linear history across ${plural(snapshot.commits.length, 'commit')}` }

    case 'liveUrl': {
      const candidates = [parseWebUrl(ctx.liveUrl), parseWebUrl(snapshot.homepage), ...(await readmeLinks(ctx))].filter(
        (u): u is URL => Boolean(u),
      )
      const url = candidates[0]
      if (!url) return { fraction: 0, evidence: 'No live link found — add it in the form, the repository’s website field or the README' }
      return (await isReachable(url))
        ? { fraction: 1, evidence: `${url.host} is online` }
        : { fraction: 0, evidence: `${url.host} did not respond` }
    }
  }
}

/* ---------- Orchestration ---------- */

async function atLeast<T>(promise: Promise<T>, ms: number): Promise<T> {
  const [result] = await Promise.all([promise, new Promise((resolve) => setTimeout(resolve, ms))])
  return result
}

interface RunOptions {
  challenge: Challenge
  repoUrl: string
  liveUrl?: string
  onUpdate: (progress: ReviewProgress) => void
}

export async function runReview({ challenge, repoUrl, liveUrl, onUpdate }: RunOptions): Promise<Review> {
  const ref = parseRepoUrl(repoUrl)
  if (!ref) throw new ReviewError('invalid', 'That is not a GitHub repository link.')

  const maxes = requirementPoints(challenge)
  const progress: ReviewProgress = {
    target: `${ref.owner}/${ref.repo}`,
    stages: [
      { id: 'repo', label: 'Connect to GitHub', status: 'queued' },
      { id: 'history', label: 'Read commit history', status: 'queued' },
      { id: 'files', label: 'Read the file tree', status: 'queued' },
    ],
    items: maxes.map((max) => ({ status: 'queued', earned: 0, max })),
    score: 0,
    max: challenge.points,
  }
  const emit = () => onUpdate({ ...progress, stages: progress.stages.map((s) => ({ ...s })), items: progress.items.map((i) => ({ ...i })) })
  const setStage = (index: number, patch: Partial<StageView>) => {
    progress.stages[index] = { ...progress.stages[index], ...patch }
    emit()
  }
  emit()

  setStage(0, { status: 'running' })
  const repo = await atLeast(api<GhRepo>(`/repos/${ref.owner}/${ref.repo}`), 450)
  setStage(0, { status: 'done', detail: `${repo.full_name} · public${repo.language ? ` · ${repo.language}` : ''}` })

  setStage(1, { status: 'running' })
  const rawCommits = await atLeast(
    api<GhCommit[]>(`/repos/${repo.full_name}/commits?per_page=100&sha=${encodeURIComponent(repo.default_branch)}`),
    450,
  )
  if (rawCommits.length === 0) throw new ReviewError('empty', 'This repository has no commits yet.')
  const commits = rawCommits.map((c) => ({
    sha: c.sha,
    message: c.commit.message,
    date: new Date(c.commit.committer?.date ?? c.commit.author?.date ?? 0),
    parents: c.parents.length,
  }))
  const headSha = commits[0].sha
  setStage(1, {
    status: 'done',
    detail: `${plural(commits.length, 'commit')}${commits.length === 100 ? '+' : ''} · head ${headSha.slice(0, 7)}`,
  })

  setStage(2, { status: 'running' })
  const tree = await atLeast(api<GhTree>(`/repos/${repo.full_name}/git/trees/${headSha}?recursive=1`), 450)
  const files = tree.tree
    .filter((t) => t.type === 'blob' && !IGNORED.test(t.path) && !LOCKFILES.test(t.path))
    .map((t) => ({ path: t.path, size: t.size ?? 0 }))
  const readmePath =
    files
      .filter((f) => /(^|\/)readme(\.(md|markdown|txt|rst))?$/i.test(f.path))
      .sort((a, b) => a.path.split('/').length - b.path.split('/').length)[0]?.path ?? null
  setStage(2, {
    status: 'done',
    detail: `${plural(files.length, 'file')} on ${repo.default_branch}${tree.truncated ? ' (large repo — partial tree)' : ''}`,
  })

  const [owner, name] = repo.full_name.split('/')
  const cache = new Map<string, Promise<string>>()
  const read = (path: string) => {
    let pending = cache.get(path)
    if (!pending) {
      const url = `${RAW}/${owner}/${name}/${headSha}/${path.split('/').map(encodeURIComponent).join('/')}`
      pending = fetch(url, { signal: AbortSignal.timeout(10_000) })
        .then((r) => (r.ok ? r.text() : ''))
        .catch(() => '')
      cache.set(path, pending)
    }
    return pending
  }

  const ctx: Context = {
    snapshot: { owner, repo: name, homepage: repo.homepage, headSha, files, readmePath, commits },
    challenge,
    liveUrl,
    read,
  }

  for (let i = 0; i < challenge.requirements.length; i++) {
    progress.items[i] = { ...progress.items[i], status: 'running' }
    emit()
    let outcome: Outcome
    try {
      outcome = await atLeast(evaluate(challenge.requirements[i].rule, ctx), 420)
    } catch {
      outcome = { fraction: 0, evidence: 'This check could not be completed' }
    }
    const fraction = Math.max(0, Math.min(1, outcome.fraction))
    const earned = Math.round(maxes[i] * fraction)
    progress.items[i] = {
      status: fraction >= 0.999 ? 'pass' : fraction > 0 ? 'partial' : 'fail',
      earned,
      max: maxes[i],
      evidence: outcome.evidence,
    }
    progress.score += earned
    emit()
  }

  const percent = Math.round((progress.score / challenge.points) * 100)
  return {
    repoUrl: `https://github.com/${repo.full_name}`,
    fullName: repo.full_name,
    branch: repo.default_branch,
    headSha,
    language: repo.language,
    analysedAt: new Date().toISOString(),
    fileCount: files.length,
    commitCount: commits.length,
    items: progress.items as ReviewItem[],
    score: progress.score,
    max: challenge.points,
    percent,
    approved: percent >= PASS_MARK * 100,
  }
}

/** Rebuilds the console view from a stored review (e.g. after a page reload). */
export function progressFromReview(review: Review): ReviewProgress {
  return {
    target: review.fullName,
    stages: [
      { id: 'repo', label: 'Connect to GitHub', status: 'done', detail: `${review.fullName} · public${review.language ? ` · ${review.language}` : ''}` },
      { id: 'history', label: 'Read commit history', status: 'done', detail: `${plural(review.commitCount, 'commit')} · head ${review.headSha.slice(0, 7)}` },
      { id: 'files', label: 'Read the file tree', status: 'done', detail: `${plural(review.fileCount, 'file')} on ${review.branch}` },
    ],
    items: review.items,
    score: review.score,
    max: review.max,
  }
}
