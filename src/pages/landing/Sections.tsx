import {
  ArrowRight,
  Check,
  GitCommitHorizontal,
  GitMerge,
  GitPullRequest,
  Percent,
  RotateCcw,
  ScanSearch,
  Search,
  Timer,
  Trophy,
  X,
} from 'lucide-react'
import { motion, useInView, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Avatar } from '../../components/Avatar'
import { ReviewConsole } from '../../components/ReviewConsole'
import { EARLY_PUSH_BONUS, PASS_MARK } from '../../config'
import { CHALLENGES, getChallenge } from '../../data/challenges'
import { PARTICIPANTS, yearLabel } from '../../data/participants'
import { getPhase } from '../../lib/challenge'
import { cn } from '../../lib/cn'
import { LEVELS } from '../../lib/progress'
import type { ReviewProgress } from '../../lib/review'
import { useArena } from '../../state/arena'

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
}

function Eyebrow({ index, children }: { index: string; children: ReactNode }) {
  return (
    <p className="l-eyebrow">
      {index} — {children}
    </p>
  )
}

function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn('mt-5 max-w-4xl text-balance font-display text-[clamp(34px,5.4vw,64px)] font-bold leading-[1.02] tracking-[-0.035em] text-white', className)}>
      {children}
    </h2>
  )
}

/* ================================ 01 · STORY ================================ */

const STORY =
  'Every week, club members build something worth seeing — and it disappears into a personal repo or a group chat. Nobody reviews it. Nobody sees it. The Arena changes that: every challenge is a branch, every submission is a pull request, and every approval is a merge into the club’s history.'
const STORY_ACCENTS = new Set(['branch,', 'pull', 'request,', 'merge'])

function Word({ children, progress, range, accent }: { children: string; progress: MotionValue<number>; range: [number, number]; accent: boolean }) {
  const opacity = useTransform(progress, range, [0.16, 1])
  return (
    <motion.span style={{ opacity }} className={accent ? 'text-[#ff8a64]' : undefined}>
      {children}{' '}
    </motion.span>
  )
}

/** Words light up as the paragraph scrolls through the viewport. */
function ScrollLitParagraph() {
  const ref = useRef<HTMLParagraphElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] })
  const words = STORY.split(' ')
  const className = 'mt-8 max-w-5xl font-display text-[clamp(26px,3.6vw,48px)] font-semibold leading-[1.16] tracking-[-0.02em] text-white'
  if (reduce) {
    return (
      <p className={className}>
        {words.map((w, i) => (
          <span key={i} className={STORY_ACCENTS.has(w) ? 'text-[#ff8a64]' : undefined}>
            {w}{' '}
          </span>
        ))}
      </p>
    )
  }
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} accent={STORY_ACCENTS.has(w)}>
          {w}
        </Word>
      ))}
    </p>
  )
}

const BEFORE_AFTER: Array<[string, string]> = [
  ['Challenge links lost in group chats', 'One home for every challenge, with live deadlines'],
  ['Projects nobody ever reviews', 'Every repo checked against clear requirements, in seconds'],
  ['Effort you can’t show anyone', 'XP, badges, streaks and a public leaderboard'],
]

export function Story() {
  return (
    <section id="story" className="l-section" aria-labelledby="story-title">
      <div className="l-container">
        <Eyebrow index="01">The story</Eyebrow>
        <h2 id="story-title" className="sr-only">
          Why the Arena exists
        </h2>
        <ScrollLitParagraph />

        <ul className="mt-16 grid gap-4 md:grid-cols-3">
          {BEFORE_AFTER.map(([before, after], i) => (
            <motion.li key={before} {...reveal} transition={{ ...reveal.transition, delay: i * 0.08 }} className="l-glass spotlight p-6">
              <p className="flex items-start gap-2.5 text-[15px] text-[#8f887c]">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-[#ff8b7e]" aria-hidden="true" />
                <span className="line-through decoration-white/20">{before}</span>
              </p>
              <div className="my-4 h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" aria-hidden="true" />
              <p className="flex items-start gap-2.5 text-[16px] font-medium text-white">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#6fd39a]" strokeWidth={3} aria-hidden="true" />
                {after}
              </p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ============================ 02 · HOW IT WORKS ============================ */

const STEPS = [
  {
    title: 'Pick a challenge',
    body: 'Eight tracks, three levels. Every requirement says exactly how it will be checked — no guessing.',
    Icon: Search,
    visual: (
      <div className="flex flex-wrap gap-1.5">
        {[
          ['Web', '#2563eb'],
          ['Git', '#f05032'],
          ['DSA', '#7c3aed'],
          ['Design', '#c026d3'],
        ].map(([name, color]) => (
          <span key={name} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/80">
            <i className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
            {name}
          </span>
        ))}
      </div>
    ),
  },
  {
    title: 'Build & commit',
    body: 'Work in any stack on your own machine. Commit as you go — your history is part of the grade.',
    Icon: GitCommitHorizontal,
    visual: (
      <div className="space-y-1 font-mono text-[11.5px] text-white/70">
        <p>
          <span className="text-[#ff8a64]">$</span> git commit -m "feat: filters"
        </p>
        <p>
          <span className="text-[#ff8a64]">$</span> git commit -m "feat: cards"
        </p>
      </div>
    ),
  },
  {
    title: 'Push & submit',
    body: 'Paste your public repo. The review reads your commits, files and README live, requirement by requirement.',
    Icon: GitPullRequest,
    visual: (
      <div className="space-y-1 font-mono text-[11.5px]">
        <p className="text-white/80">
          <span className="text-[#3fb950]">✓</span> merge commit on main
        </p>
        <p className="text-white/80">
          <span className="text-[#3fb950]">✓</span> no conflict markers
        </p>
        <p className="text-white/80">
          <span className="text-[#d29922]">◐</span> merge message explains
        </p>
      </div>
    ),
  },
  {
    title: 'Get merged',
    body: `Score ${PASS_MARK * 100}% or more and you’re merged — XP, badges and a new rank. Below that, fix and re-run.`,
    Icon: GitMerge,
    visual: (
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-[#f05032] px-3 py-1 font-mono text-xs font-semibold text-white">+120 XP</span>
        <span className="rounded-full bg-[#15291d] px-3 py-1 font-mono text-xs font-semibold text-[#6fd39a]">▲ 3 places</span>
      </div>
    ),
  },
]

export function HowItWorksStory() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.6'] })
  const draw = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <section id="how" className="l-section" aria-labelledby="how-title">
      <div className="l-container">
        <Eyebrow index="02">How the Arena works</Eyebrow>
        <SectionTitle>
          <span id="how-title">Four commits from idea to merge.</span>
        </SectionTitle>

        <div ref={ref} className="relative mt-16">
          {/* The branch line draws itself as you scroll. */}
          <svg className="absolute left-0 right-0 top-[22px] hidden h-[2px] w-full md:block" preserveAspectRatio="none" viewBox="0 0 100 2" aria-hidden="true">
            <line x1="0" y1="1" x2="100" y2="1" stroke="rgba(255,255,255,.08)" strokeWidth="2" />
            <motion.line x1="0" y1="1" x2="100" y2="1" stroke="url(#ember-line)" strokeWidth="2" style={{ pathLength: draw }} />
            <defs>
              <linearGradient id="ember-line" x1="0" x2="1">
                <stop offset="0" stopColor="#ff8a64" />
                <stop offset="1" stopColor="#f05032" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute bottom-6 left-[21px] top-6 w-0.5 bg-white/10 md:hidden" aria-hidden="true" />

          <ol className="grid gap-6 md:grid-cols-4 md:gap-5">
            {STEPS.map(({ title, body, Icon, visual }, i) => (
              <motion.li key={title} {...reveal} transition={{ ...reveal.transition, delay: i * 0.1 }} className="relative flex gap-5 md:flex-col md:gap-0">
                <span
                  className={cn(
                    'relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border',
                    i === STEPS.length - 1
                      ? 'border-[#f05032] bg-[#f05032] text-white shadow-[0_0_30px_rgba(240,80,50,.45)]'
                      : 'border-white/15 bg-[#0d0c0b] text-white/80',
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="l-glass spotlight flex flex-1 flex-col p-5 md:mt-6">
                  <p className="font-mono text-xs text-white/40">commit 0{i + 1}</p>
                  <h3 className="mt-1.5 font-display text-xl font-semibold text-white">{title}</h3>
                  <p className="mb-5 mt-2 text-[15px] leading-relaxed text-white/60">{body}</p>
                  <div className="mt-auto border-t border-white/5 pt-4">{visual}</div>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

/* ============================ 03 · THE COMPETITION ============================ */

const RULES = [
  {
    Icon: ScanSearch,
    title: 'Every requirement has an automated check',
    body: 'Merge commits, file contents, README, commit history — even whether your live site responds.',
  },
  { Icon: Percent, title: 'Partial work earns partial credit', body: 'Three of four commits? You still get 15 of 20 points.' },
  {
    Icon: GitMerge,
    title: `${PASS_MARK * 100}% gets you merged`,
    body: 'Below that you get “Changes requested” with the exact reason. Fix, push, run it again.',
  },
  { Icon: Timer, title: `+${EARLY_PUSH_BONUS} XP for pushing a day early`, body: 'Finishing early is rewarded, not just finishing.' },
  { Icon: Trophy, title: 'Every merge moves the leaderboard', body: 'Levels from Initial Commit to Core Maintainer, plus seven badges to collect.' },
]

const DEMO_ITEMS: ReviewProgress['items'] = [
  { status: 'pass', earned: 20, max: 20, evidence: 'Merge commit 9f1e2d3: “Merge branch ’feature/cards’”' },
  { status: 'pass', earned: 20, max: 20, evidence: 'No conflict markers in 6 files scanned' },
  { status: 'partial', earned: 10, max: 20, evidence: 'Only 15 characters of explanation — say which version you kept and why' },
  { status: 'pass', earned: 20, max: 20, evidence: 'Found CONFLICTS.md (412 B)' },
  { status: 'partial', earned: 15, max: 20, evidence: '3 commits since the challenge opened — need 4' },
]

/** Plays a scripted review through the real console component when scrolled into view. */
function DemoReview() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-120px' })
  const reduce = useReducedMotion()
  const challenge = getChallenge('resolve-the-merge-conflict')
  const [step, setStep] = useState(reduce ? 99 : -1)
  const [run, setRun] = useState(0)

  useEffect(() => {
    if (!inView || reduce) return
    setStep(-1)
    const timers = Array.from({ length: 10 }, (_, i) => window.setTimeout(() => setStep(i), 350 + i * 520))
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [inView, run, reduce])

  if (!challenge) return null
  const stagesDone = Math.min(3, Math.max(0, step + 1))
  const itemsDone = Math.max(0, step - 2)
  const progress: ReviewProgress = {
    target: 'kismat/merge-demo',
    stages: [
      { id: 'repo', label: 'Connect to GitHub', status: stagesDone > 0 ? 'done' : step === -1 ? 'running' : 'queued', detail: stagesDone > 0 ? 'kismat/merge-demo · public · HTML' : undefined },
      { id: 'history', label: 'Read commit history', status: stagesDone > 1 ? 'done' : stagesDone === 1 ? 'running' : 'queued', detail: stagesDone > 1 ? '5 commits · head 9f1e2d3' : undefined },
      { id: 'files', label: 'Read the file tree', status: stagesDone > 2 ? 'done' : stagesDone === 2 ? 'running' : 'queued', detail: stagesDone > 2 ? '6 files on main' : undefined },
    ],
    items: DEMO_ITEMS.map((item, i) =>
      i < itemsDone ? item : { status: i === itemsDone && stagesDone === 3 ? 'running' : 'queued', earned: 0, max: item.max },
    ),
    score: DEMO_ITEMS.slice(0, itemsDone).reduce((s, i) => s + i.earned, 0),
    max: 100,
  }
  const finished = itemsDone >= DEMO_ITEMS.length

  return (
    <div ref={ref}>
      <ReviewConsole challenge={challenge} progress={progress} running={!finished} />
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="font-mono text-xs text-white/45">Demo run · the same console students see</p>
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          disabled={!finished || !!reduce}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Replay
        </button>
      </div>
    </div>
  )
}

export function Scoring() {
  const podium = [PARTICIPANTS[1], PARTICIPANTS[0], PARTICIPANTS[2]]
  return (
    <section id="scoring" className="l-section" aria-labelledby="scoring-title">
      <div className="l-container">
        <Eyebrow index="03">The competition</Eyebrow>
        <SectionTitle>
          <span id="scoring-title">
            Graded by your repo, <span className="text-white/40">not by opinion.</span>
          </span>
        </SectionTitle>

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <ul className="space-y-6">
            {RULES.map(({ Icon, title, body }, i) => (
              <motion.li key={title} {...reveal} transition={{ ...reveal.transition, delay: i * 0.06 }} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[#ff8a64]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-semibold text-white">{title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-white/55">{body}</p>
                </div>
              </motion.li>
            ))}
          </ul>
          <motion.div {...reveal}>
            <DemoReview />
          </motion.div>
        </div>

        {/* Levels + podium */}
        <div className="mt-20 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <motion.div {...reveal} className="l-glass spotlight p-6 sm:p-8">
            <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-white/45">Levels · git tags for your growth</h3>
            <ol className="relative mt-8 grid grid-cols-1 gap-4 sm:grid-cols-5 sm:gap-2">
              <span className="absolute left-4 right-4 top-[15px] hidden h-0.5 bg-gradient-to-r from-white/15 via-[#f05032]/60 to-[#f05032] sm:block" aria-hidden="true" />
              {LEVELS.map((level, i) => (
                <li key={level.title} className="relative flex items-center gap-3 sm:block sm:text-center">
                  <span
                    className={cn(
                      'relative z-10 mx-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-semibold',
                      i === LEVELS.length - 1 ? 'border-[#f05032] bg-[#f05032] text-white' : 'border-white/15 bg-[#0d0c0b] text-white/70',
                    )}
                  >
                    v{i + 1}
                  </span>
                  <div className="sm:mt-3">
                    <p className="text-sm font-semibold text-white">{level.title}</p>
                    <p className="font-mono text-xs text-white/45">{level.min.toLocaleString('en-IN')} XP</p>
                  </div>
                </li>
              ))}
            </ol>
          </motion.div>

          <motion.div {...reveal} className="l-glass spotlight flex flex-col p-6 sm:p-8">
            <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-white/45">Top of the board</h3>
            <ol className="mt-6 grid flex-1 grid-cols-3 items-end gap-3">
              {podium.map((p, i) => {
                const rank = i === 1 ? 1 : i === 0 ? 2 : 3
                return (
                  <li key={p.id} className="flex flex-col items-center text-center">
                    <Avatar name={p.name} />
                    <p className="mt-2 w-full truncate text-xs font-semibold text-white">{p.name.split(' ')[0]}</p>
                    <p className="font-mono text-[11px] text-white/45">{p.xp.toLocaleString('en-IN')}</p>
                    <div
                      className={cn(
                        'mt-2 flex w-full items-start justify-center rounded-t-lg pt-2 font-display text-lg font-bold',
                        rank === 1 ? 'h-24 bg-gradient-to-b from-[#f05032] to-[#f05032]/20 text-white' : 'h-16 bg-white/[0.06] text-white/70',
                        rank === 3 && 'h-12',
                      )}
                      aria-label={`Rank ${rank}, ${yearLabel(p.year)} ${p.branch}`}
                    >
                      {rank}
                    </div>
                  </li>
                )
              })}
            </ol>
            <Link to="/leaderboard" className="link-draw mt-5 inline-flex items-center gap-1.5 self-start text-sm font-medium text-[#ff8a64]">
              See the full leaderboard <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </motion.div>
        </div>

        {/* Tracks marquee */}
        <div className="l-marquee-wrap relative mt-20 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]" aria-label="Challenge tracks">
          <div className="l-marquee">
            {[0, 1].map((copy) => (
              <ul key={copy} className="flex shrink-0 gap-3 pr-3" aria-hidden={copy === 1 ? 'true' : undefined}>
                {[
                  ['Web', '#2563eb'],
                  ['Git', '#f05032'],
                  ['DSA', '#7c3aed'],
                  ['Design', '#c026d3'],
                  ['Backend', '#0f766e'],
                  ['AI/ML', '#ca8a04'],
                  ['Open Source', '#16a34a'],
                  ['Creative', '#e11d48'],
                ].map(([name, color]) => (
                  <li key={name} className="flex items-center gap-3 rounded-full border border-white/10 px-6 py-3 font-display text-2xl font-semibold text-white/85">
                    <i className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                    {name}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ================================ 04 · ENTER ================================ */

const COMMAND = 'git checkout -b my-first-merge'

function TypedCommand() {
  const ref = useRef<HTMLParagraphElement>(null)
  const inView = useInView(ref, { once: true })
  const reduce = useReducedMotion()
  const [count, setCount] = useState(reduce ? COMMAND.length : 0)

  useEffect(() => {
    if (!inView || reduce) return
    const id = window.setInterval(() => setCount((c) => (c >= COMMAND.length ? c : c + 1)), 45)
    return () => window.clearInterval(id)
  }, [inView, reduce])

  return (
    <p ref={ref} className="font-mono text-sm text-white/60 sm:text-base" aria-label={`$ ${COMMAND}`}>
      <span className="text-[#ff8a64]">$</span> <span aria-hidden="true">{COMMAND.slice(0, count)}</span>
      <span className="ml-0.5 inline-block h-[1.1em] w-[0.55em] translate-y-[0.18em] animate-caret bg-white/70" aria-hidden="true" />
    </p>
  )
}

export function Enter() {
  const { profile } = useArena()
  const now = Date.now()
  const live = CHALLENGES.filter((c) => getPhase(c, now) === 'active')
  const stats = [
    [String(live.length), 'challenges live now'],
    [live.reduce((s, c) => s + c.points, 0).toLocaleString('en-IN'), 'XP up for grabs'],
    [String(PARTICIPANTS.length), 'builders ranked'],
    ['8', 'tracks'],
  ]
  return (
    <section id="enter" className="l-section relative overflow-hidden" aria-labelledby="enter-title">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{ background: 'radial-gradient(70% 60% at 50% 110%, rgba(240,80,50,.28), rgba(240,80,50,.06) 50%, transparent 75%)' }}
      />
      <div className="l-container relative text-center">
        <Eyebrow index="04">Enter the Arena</Eyebrow>
        <div className="mt-8 flex justify-center">
          <TypedCommand />
        </div>
        <motion.h2
          {...reveal}
          id="enter-title"
          className="mx-auto mt-6 max-w-4xl text-balance font-display text-[clamp(40px,7vw,92px)] font-extrabold uppercase leading-[0.95] tracking-[-0.04em] text-white"
        >
          Your first merge is <span className="l-ember-text">one challenge away.</span>
        </motion.h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-white/60">
          Free for every CHARUSAT student, every branch and every year. No sign-up to browse — add your name when you start.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/arena" className="l-btn h-14 rounded-[14px] px-8 text-[17px]" data-magnetic>
            <span>
              {profile ? `Continue, ${profile.name.split(' ')[0]}` : 'Enter the Arena'}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </span>
          </Link>
          <Link to="/leaderboard" className="l-ghost h-14 px-7 text-[16px]" data-magnetic>
            View the leaderboard
          </Link>
        </div>
        <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-6 border-t border-white/10 pt-8 sm:grid-cols-4">
          {stats.map(([value, label]) => (
            <div key={label}>
              <dt className="sr-only">{label}</dt>
              <dd>
                <span className="block font-display text-4xl font-semibold tabular-nums tracking-tight text-white">{value}</span>
                <span className="text-sm text-white/50">{label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
