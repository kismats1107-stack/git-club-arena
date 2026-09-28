import { Link } from 'react-router'
import { GITHUB_REPO_URL } from '../config'
import { proposeChallengeUrl } from '../lib/links'
import { useArena } from '../state/arena'
import { GithubIcon, LogoMark } from './Brand'

export function Footer() {
  const { resetDemo } = useArena()

  function handleReset() {
    if (window.confirm('Reset your progress? This clears your profile, XP and badges for this account.')) resetDemo()
  }

  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-7" />
            <span className="font-display text-base font-bold tracking-[-0.02em]">Git Club Arena</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted">
            A Git Club CHARUSAT initiative. Short, practical challenges for every branch and every year.
          </p>
          <p className="mt-4 font-mono text-xs text-ink-soft">Build. Collaborate. Ship.</p>
        </div>

        <div>
          <h2 className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-muted">Arena</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/" className="link-draw text-ink-soft hover:text-ink">
                About the Arena
              </Link>
            </li>
            <li>
              <Link to="/arena" className="link-draw text-ink-soft hover:text-ink">
                Challenges
              </Link>
            </li>
            <li>
              <Link to="/leaderboard" className="link-draw text-ink-soft hover:text-ink">
                Leaderboard
              </Link>
            </li>
            <li>
              <Link to="/me" className="link-draw text-ink-soft hover:text-ink">
                My progress
              </Link>
            </li>
            <li>
              <Link to="/arena#how-it-works" className="link-draw text-ink-soft hover:text-ink">
                How scoring works
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-muted">Contribute</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {GITHUB_REPO_URL && (
              <>
                <li>
                  <a href={proposeChallengeUrl()} target="_blank" rel="noopener noreferrer" className="link-draw text-ink-soft hover:text-ink">
                    Propose a challenge ↗
                  </a>
                </li>
                <li>
                  <a
                    href={GITHUB_REPO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-draw inline-flex items-center gap-1.5 text-ink-soft hover:text-ink"
                  >
                    <GithubIcon className="h-3.5 w-3.5" />
                    Source code ↗
                  </a>
                </li>
              </>
            )}
            <li>
              <button type="button" onClick={handleReset} className="link-draw cursor-pointer text-ink-soft hover:text-ink">
                Reset my progress
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted sm:px-6">
          Demo build for the Git Club CHARUSAT website challenge. Challenges and standings are sample data; your progress is
          stored only in this browser.
        </p>
      </div>
    </footer>
  )
}
