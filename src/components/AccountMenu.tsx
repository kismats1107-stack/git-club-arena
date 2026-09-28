import { BadgeCheck, ChevronDown, FlaskConical, LogOut, Trophy, User, Zap } from 'lucide-react'
import { AnimatePresence, animate, motion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { cn } from '../lib/cn'
import { useArena } from '../state/arena'
import { Avatar } from './Avatar'
import { GithubIcon, GoogleIcon } from './Brand'
import { buttonClass } from './Button'
import { SyncBadge } from './SyncBadge'

/** Counts up to the new value so earning XP is felt, not just shown. */
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value)
  const previous = useRef(value)
  useEffect(() => {
    const from = previous.current
    previous.current = value
    if (from === value) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      return
    }
    const controls = animate(from, value, { duration: 1.2, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setDisplay(Math.round(v)) })
    return () => controls.stop()
  }, [value])
  return <>{display}</>
}

function ProviderChip({ provider }: { provider?: 'google' | 'github' | 'demo' }) {
  if (!provider) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-2 py-0.5 text-[11px] font-medium text-ink-soft">
      {provider === 'google' ? <GoogleIcon className="h-3 w-3" /> : provider === 'github' ? <GithubIcon className="h-3 w-3" /> : <FlaskConical className="h-3 w-3" />}
      {provider === 'google' ? 'Google' : provider === 'github' ? 'GitHub' : 'Demo'}
    </span>
  )
}

/** Always-visible log out: icon on small screens, icon + label on large ones. */
function LogoutButton({ onLogout }: { onLogout: () => void }) {
  return (
    <button
      type="button"
      onClick={onLogout}
      title="Log out"
      aria-label="Log out"
      className="flex h-10 w-10 cursor-pointer items-center justify-center gap-2 rounded-lg text-ink-soft transition-colors hover:bg-hard-soft hover:text-hard active:scale-95 lg:w-auto lg:px-3"
    >
      <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
      <span className="hidden text-sm font-medium lg:inline">Log out</span>
    </button>
  )
}

/** Header account area: sign-in buttons, "finish setup", or the signed-in account menu. */
export function AccountArea() {
  const { account, profile, ready, xp, level, syncStatus, requireProfile, openSignIn, signOut } = useArena()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()
  const { pathname } = useLocation()

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!account) {
    return (
      <>
        {/* A wrapper owns the breakpoint so the button's own display class can't override it. */}
        <span className="hidden sm:contents">
          <button type="button" onClick={() => openSignIn('signin')} className={buttonClass('ghost', 'sm')}>
            Sign in
          </button>
        </span>
        <button type="button" onClick={() => openSignIn('signup')} className={buttonClass('dark', 'sm')}>
          <span className="sm:hidden">Sign in</span>
          <span className="hidden sm:inline">Create account</span>
        </button>
      </>
    )
  }

  if (!ready) return <span className="h-10 w-28 animate-pulse rounded-full bg-sunken" role="status" aria-label="Loading your account" />

  if (!profile) {
    return (
      <>
        <button type="button" onClick={() => requireProfile()} className={buttonClass('dark', 'sm')}>
          Finish setup
        </button>
        <LogoutButton onLogout={() => void signOut()} />
      </>
    )
  }

  const itemClass = 'flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-medium text-ink-soft transition-colors hover:bg-sunken hover:text-ink'

  return (
    <>
      <div ref={wrapRef} className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={`Account: ${profile.name}, ${xp} XP`}
          className="flex h-10 items-center gap-2 rounded-full border border-line bg-surface pl-1 pr-1 shadow-card transition hover:border-line-strong active:scale-[0.97] sm:pl-3"
        >
          <motion.span
            key={xp}
            initial={{ scale: xp > 0 ? 1.18 : 1 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 12 }}
            className="hidden items-center gap-1 font-mono text-xs font-semibold tabular-nums sm:flex"
          >
            <Zap className="h-3.5 w-3.5 text-accent" fill="currentColor" aria-hidden="true" />
            <AnimatedNumber value={xp} /> XP
          </motion.span>
          <Avatar name={profile.name} size="sm" highlight src={profile.photoURL} />
          <ChevronDown className={cn('-ml-1 mr-1 hidden h-3.5 w-3.5 text-muted transition-transform sm:block', open && 'rotate-180')} aria-hidden="true" />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              id={menuId}
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="absolute right-0 top-12 z-50 w-[min(310px,calc(100vw-24px))] origin-top-right overflow-hidden rounded-2xl border border-line bg-surface shadow-lift"
            >
              <div className="flex items-center gap-3 border-b border-line p-4">
                <Avatar name={profile.name} size="lg" highlight src={profile.photoURL} />
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-semibold leading-tight">{profile.name}</p>
                  <p className="truncate font-mono text-xs text-muted">{profile.email ?? account.email ?? 'Demo session'}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <ProviderChip provider={profile.provider ?? account.provider} />
                    {profile.emailVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-easy-soft px-2 py-0.5 text-[11px] font-semibold text-easy">
                        <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                        Verified CHARUSAT
                      </span>
                    )}
                  </div>
                  <SyncBadge status={syncStatus} className="mt-2 border-0 bg-transparent px-0 py-0" />
                </div>
              </div>
              <div className="p-2">
                <Link to="/me" className={itemClass}>
                  <User className="h-4 w-4" aria-hidden="true" />
                  My progress
                  <span className="ml-auto font-mono text-xs text-muted" title={level.title}>
                    Lv {level.number}
                  </span>
                </Link>
                <Link to="/leaderboard" className={itemClass}>
                  <Trophy className="h-4 w-4" aria-hidden="true" />
                  Leaderboard
                </Link>
              </div>
              <div className="border-t border-line p-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    void signOut()
                  }}
                  className={cn(itemClass, 'text-hard hover:bg-hard-soft hover:text-hard')}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Log out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <LogoutButton onLogout={() => void signOut()} />
    </>
  )
}
