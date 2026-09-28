import { Link, useLocation } from 'react-router'
import { buttonClass } from '../components/Button'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function NotFoundPage() {
  const { pathname } = useLocation()
  useDocumentTitle('Page not found')
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="overflow-x-auto rounded-card border border-console-line bg-console p-5 font-mono text-[13px] leading-relaxed text-white/80 shadow-lift">
        <p>
          <span className="text-accent">$</span> git checkout {pathname}
        </p>
        <p className="mt-1 text-[#f85149]">error: pathspec '{pathname}' did not match any file(s) known to git</p>
      </div>
      <h1 className="mt-10 font-display text-4xl font-bold tracking-[-0.03em]">This page doesn’t exist</h1>
      <p className="mt-3 text-ink-soft">The link may be out of date, or the challenge may have been renamed.</p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link to="/arena" className={buttonClass('primary', 'lg')}>
          Back to challenges
        </Link>
        <Link to="/leaderboard" className={buttonClass('secondary', 'lg')}>
          View the leaderboard
        </Link>
      </div>
    </div>
  )
}
