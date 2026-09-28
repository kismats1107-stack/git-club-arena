import { LayoutGrid, Moon, Search, Sun, Trophy, User } from 'lucide-react'
import { motion } from 'motion/react'
import { Link, NavLink, useLocation } from 'react-router'
import { cn } from '../lib/cn'
import { shortcutLabel } from '../lib/links'
import { toggleTheme, useTheme } from '../lib/theme'
import { AccountArea } from './AccountMenu'
import { LogoMark } from './Brand'
import { useCommandPalette } from './CommandPalette'

export const NAV_ITEMS = [
  { to: '/arena', label: 'Challenges', Icon: LayoutGrid, match: (path: string) => path.startsWith('/arena') || path.startsWith('/challenges') },
  { to: '/leaderboard', label: 'Leaderboard', Icon: Trophy, match: (path: string) => path.startsWith('/leaderboard') },
  { to: '/me', label: 'My progress', Icon: User, match: (path: string) => path.startsWith('/me') },
]

const iconButton =
  'flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-sunken hover:text-ink active:scale-95'

export function Header() {
  const { pathname } = useLocation()
  const openPalette = useCommandPalette()
  const theme = useTheme()

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-3 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Git Club Arena — home" data-cursor="Home">

          <LogoMark className="h-8 w-8" />
          <span className="font-display text-[17px] font-bold tracking-[-0.02em]">git club</span>
          <span className="hidden rounded-md border border-line-strong px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted sm:inline">
            Arena
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map(({ to, label, match }) => {
            const active = match(pathname)
            return (
              <NavLink
                key={to}
                to={to}
                aria-current={active ? 'page' : undefined}
                className={cn('relative rounded-lg px-3 py-2 text-sm font-medium transition-colors', active ? 'text-ink' : 'text-muted hover:text-ink')}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-lg bg-sunken"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                {label}
              </NavLink>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={openPalette}
            className="hidden h-9 cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface pl-3 pr-1.5 text-sm text-muted transition-colors hover:border-line-strong hover:text-ink lg:flex"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="pr-6">Jump to…</span>
            <kbd className="rounded-md border border-line-strong bg-paper px-1.5 py-0.5 font-mono text-[11px]">{shortcutLabel('K')}</kbd>
          </button>
          <button type="button" onClick={openPalette} className={cn(iconButton, 'lg:hidden')} aria-label="Open command palette">
            <Search className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className={iconButton}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
          >
            <motion.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.25 }}>
              {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" aria-hidden="true" /> : <Moon className="h-[18px] w-[18px]" aria-hidden="true" />}
            </motion.span>
          </button>

          <AccountArea />
        </div>
      </div>
    </header>
  )
}

export function MobileTabBar() {
  const { pathname } = useLocation()
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-3">
        {NAV_ITEMS.map(({ to, label, Icon, match }) => {
          const active = match(pathname)
          return (
            <li key={to}>
              <NavLink
                to={to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors active:scale-95',
                  active ? 'text-accent-strong' : 'text-muted',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="tab-dot"
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-accent"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
