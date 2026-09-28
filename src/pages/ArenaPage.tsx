import { Check, Search, SearchX, X } from 'lucide-react'
import { useEffect, useMemo, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useSearchParams } from 'react-router'
import { buttonClass } from '../components/Button'
import { ChallengeCard } from '../components/ChallengeCard'
import { ClubPulse } from '../components/ClubPulse'
import { HowItWorks } from '../components/HowItWorks'
import { NextUpCard } from '../components/NextUpCard'
import { CATEGORY_COLORS } from '../components/Tags'
import { CATEGORIES, CHALLENGES, DIFFICULTIES } from '../data/challenges'
import type { Category, Difficulty, Phase } from '../data/types'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useNow } from '../hooks/useNow'
import { getPhase, matchesQuery, sortChallenges, type SortKey } from '../lib/challenge'
import { cn } from '../lib/cn'

const TABS: Array<{ id: Phase; label: string }> = [
  { id: 'active', label: 'Active' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
]

const SORTS: Array<{ id: SortKey; label: string }> = [
  { id: 'deadline', label: 'Deadline' },
  { id: 'points', label: 'Most XP' },
  { id: 'difficulty', label: 'Easiest first' },
]

const EMPTY_TAB_TEXT: Record<Phase, string> = {
  active: 'active',
  upcoming: 'upcoming',
  completed: 'completed',
}

function pick<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : null
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors active:scale-95 sm:h-9 sm:px-3.5',
        active ? 'border-ink bg-ink text-paper' : 'border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

export function ArenaPage() {
  useDocumentTitle()
  const now = useNow(30_000)
  const [params, setParams] = useSearchParams()
  const searchRef = useRef<HTMLInputElement>(null)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const tab = pick(params.get('tab'), TABS.map((t) => t.id)) ?? 'active'
  const category = pick<Category>(params.get('cat'), CATEGORIES)
  const difficulty = pick<Difficulty>(params.get('level'), DIFFICULTIES)
  const sort = pick<SortKey>(params.get('sort'), SORTS.map((s) => s.id)) ?? 'deadline'
  const query = params.get('q') ?? ''

  function setParam(key: string, value: string | null) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  }

  function clearFilters() {
    setParams(tab === 'active' ? {} : { tab }, { replace: true })
  }

  // Press "/" anywhere to jump to search.
  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return
      event.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const filtered = useMemo(
    () =>
      CHALLENGES.filter(
        (c) => (!category || c.category === category) && (!difficulty || c.difficulty === difficulty) && matchesQuery(c, query),
      ),
    [category, difficulty, query],
  )

  const counts: Record<Phase, number> = { active: 0, upcoming: 0, completed: 0 }
  filtered.forEach((c) => (counts[getPhase(c, now)] += 1))
  const list = sortChallenges(
    filtered.filter((c) => getPhase(c, now) === tab),
    sort,
    tab,
  )
  const hasFilters = Boolean(category || difficulty || query)

  const live = CHALLENGES.filter((c) => getPhase(c, now) === 'active')
  const openingSoon = CHALLENGES.filter((c) => getPhase(c, now) === 'upcoming').length
  const xpOnOffer = live.reduce((sum, c) => sum + c.points, 0)

  function onTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    const index = TABS.findIndex((t) => t.id === tab)
    const nextIndex = (index + (event.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length
    setParam('tab', TABS[nextIndex].id === 'active' ? null : TABS[nextIndex].id)
    tabRefs.current[nextIndex]?.focus()
  }

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="paper-grid pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black_30%,transparent)]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-10 sm:px-6 md:pt-16 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:gap-14">
          <div>
            <p className="font-mono text-xs text-muted">
              <span className="font-semibold text-accent-strong">git club</span> · charusat / arena
            </p>
            <h1 className="mt-4 font-display text-[44px] font-bold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-[68px]">
              Learn by building
              <span className="text-accent">.</span>
              <span className="ml-1 hidden h-[0.8em] w-[0.42em] translate-y-[0.08em] animate-caret bg-ink/80 align-baseline sm:inline-block" aria-hidden="true" />
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              Git Club CHARUSAT runs short coding, design and web challenges every week. Pick one that fits your level, build
              it, push it to GitHub — and earn XP when it’s reviewed.
            </p>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-ink-soft">
              {['Free for every student', 'All branches & years', 'Beginner-friendly tracks'].map((text) => (
                <li key={text} className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-easy" strokeWidth={3} aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
            <dl className="mt-9 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6">
              {[
                { value: live.length, label: 'live now' },
                { value: openingSoon, label: 'opening soon' },
                { value: xpOnOffer.toLocaleString('en-IN'), label: 'XP up for grabs' },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block font-display text-3xl font-semibold tabular-nums tracking-tight">{stat.value}</span>
                    <span className="text-sm text-muted">{stat.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <NextUpCard now={now} />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <HowItWorks />
          <ClubPulse />
        </div>

        {/* ---------- Challenge browser ---------- */}
        <section id="challenges" aria-labelledby="challenges-title" className="mt-14">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 id="challenges-title" className="font-display text-3xl font-semibold tracking-[-0.02em]">
                Challenges
              </h2>
              <p className="mt-1 text-sm text-muted">New ones open every week. Each takes between an hour and a weekend.</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setParam('q', e.target.value || null)}
                placeholder="Search by title, skill or topic"
                aria-label="Search challenges"
                className="h-11 w-full rounded-xl border border-line-strong bg-surface pl-10 pr-10 text-sm text-ink placeholder:text-muted transition focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15 [&::-webkit-search-cancel-button]:hidden"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setParam('q', null)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1.5 text-muted hover:bg-sunken hover:text-ink"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-line-strong bg-paper px-1.5 font-mono text-[11px] text-muted md:block">
                  /
                </kbd>
              )}
            </div>
          </div>

          <div role="tablist" aria-label="Challenge status" onKeyDown={onTabKeyDown} className="mt-6 flex gap-1 overflow-x-auto border-b border-line no-scrollbar">
            {TABS.map((t, i) => {
              const selected = tab === t.id
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[i] = el
                  }}
                  type="button"
                  role="tab"
                  id={`tab-${t.id}`}
                  aria-selected={selected}
                  aria-controls="challenge-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setParam('tab', t.id === 'active' ? null : t.id)}
                  className={cn(
                    'relative flex min-h-11 shrink-0 cursor-pointer items-center gap-2 px-3 pb-3 pt-2 text-sm font-semibold transition-colors',
                    selected ? 'text-ink' : 'text-muted hover:text-ink',
                  )}
                >
                  {selected && (
                    <motion.span
                      layoutId="tab-underline"
                      className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-accent"
                      transition={{ type: 'spring', stiffness: 480, damping: 38 }}
                    />
                  )}
                  {t.label}
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 font-mono text-[11px] tabular-nums',
                      selected ? 'bg-accent-soft text-accent-strong' : 'bg-sunken text-muted',
                    )}
                  >
                    {counts[t.id]}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-5 space-y-4">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0" role="group" aria-label="Filter by category">
              <Chip active={!category} onClick={() => setParam('cat', null)}>
                All
              </Chip>
              {CATEGORIES.map((c) => (
                <Chip key={c} active={category === c} onClick={() => setParam('cat', category === c ? null : c)}>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c] }} aria-hidden="true" />
                  {c}
                </Chip>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p aria-live="polite" className="text-sm text-muted">
                {list.length} {EMPTY_TAB_TEXT[tab]} challenge{list.length === 1 ? '' : 's'}
                {hasFilters && (list.length === 1 ? ' matches your filters' : ' match your filters')}
                {hasFilters && (
                  <>
                    {' · '}
                    <button type="button" onClick={clearFilters} className="cursor-pointer font-medium text-accent-strong hover:underline">
                      Clear filters
                    </button>
                  </>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-xl border border-line bg-surface p-1" role="group" aria-label="Filter by difficulty">
                {[null, ...DIFFICULTIES].map((d) => (
                  <button
                    key={d ?? 'any'}
                    type="button"
                    aria-pressed={difficulty === d}
                    onClick={() => setParam('level', d)}
                    className={cn(
                      'h-10 cursor-pointer rounded-lg px-3 text-[13px] font-medium transition-colors sm:h-8',
                      difficulty === d ? 'bg-sunken text-ink' : 'text-muted hover:text-ink',
                    )}
                  >
                    {d ?? 'Any level'}
                  </button>
                ))}
              </div>
              <label className="inline-flex items-center gap-2 text-[13px] text-muted">
                Sort
                <select
                  value={sort}
                  onChange={(e) => setParam('sort', e.target.value === 'deadline' ? null : e.target.value)}
                  className="h-11 cursor-pointer rounded-xl border border-line bg-surface px-3 text-[13px] font-medium text-ink focus:border-accent focus:outline-none sm:h-10"
                >
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              </div>
            </div>
          </div>

          <div id="challenge-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-6">
            {list.length > 0 ? (
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {list.map((challenge, i) => (
                    <motion.li
                      key={`${tab}-${challenge.slug}`}
                      layout
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.04, type: 'spring', stiffness: 320, damping: 30 } }}
                      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12 } }}
                    >
                      <ChallengeCard challenge={challenge} now={now} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            ) : (
              <div className="flex flex-col items-center rounded-card border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center">
                <SearchX className="h-8 w-8 text-muted" aria-hidden="true" />
                <p className="mt-4 font-display text-lg font-semibold">
                  {query ? `No ${EMPTY_TAB_TEXT[tab]} challenges match “${query}”` : `No ${EMPTY_TAB_TEXT[tab]} challenges match these filters`}
                </p>
                <p className="mt-1 max-w-sm text-sm text-muted">
                  {(['active', 'upcoming', 'completed'] as Phase[])
                    .filter((p) => p !== tab && counts[p] > 0)
                    .map((p) => `${counts[p]} ${p}`)
                    .join(' and ') || 'Try a different category, level or search term.'}
                  {TABS.some((t) => t.id !== tab && counts[t.id] > 0) && ' challenges match in other tabs.'}
                </p>
                <button type="button" onClick={clearFilters} className={buttonClass('secondary', 'md', 'mt-5')}>
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
