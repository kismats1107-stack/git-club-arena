import { GitCommitHorizontal, GitMerge, GitPullRequest, Search } from 'lucide-react'
import { EARLY_PUSH_BONUS, PASS_MARK } from '../config'
import { cn } from '../lib/cn'

const STEPS = [
  { title: 'Pick a challenge', body: 'Filter by category and difficulty. Easy ones take under an hour.', Icon: Search },
  { title: 'Build & commit', body: 'Work in any stack on your own machine. Every requirement says how it will be checked.', Icon: GitCommitHorizontal },
  { title: 'Push & submit', body: 'Paste your public GitHub repo. Your code, commits and README are reviewed live, in seconds.', Icon: GitPullRequest },
  {
    title: 'Get merged, earn XP',
    body: `Score ${PASS_MARK * 100}% or more to get merged and climb the board. Below that, fix, push and run it again.`,
    Icon: GitMerge,
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="rounded-card border border-line bg-surface/70 p-5 sm:p-6">
      <h2 id="how-title" className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-muted">
        How it works
      </h2>
      <p className="mt-1 font-mono text-[11px] text-muted/80">
        pass mark {PASS_MARK * 100}% · +{EARLY_PUSH_BONUS} XP for a day-early push
      </p>

      <ol className="relative mt-6 space-y-5">
        <span aria-hidden="true" className="absolute bottom-3 left-[17px] top-3 w-0.5 bg-line" />
        {STEPS.map(({ title, body, Icon }, i) => {
          const last = i === STEPS.length - 1
          return (
            <li key={title} className="relative flex gap-4">
              <span
                className={cn(
                  'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2',
                  last ? 'border-accent bg-accent text-white' : 'border-line-strong bg-paper text-ink-soft',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="font-mono text-[11px] text-muted">0{i + 1}</p>
                <h3 className="font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
