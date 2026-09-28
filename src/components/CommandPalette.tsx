import { CornerDownLeft, FilePlus2, LayoutGrid, LogIn, LogOut, Moon, RotateCcw, Sparkles, Sun, Trophy, User, UserPlus } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { GITHUB_REPO_URL } from '../config'
import { CHALLENGES } from '../data/challenges'
import { getPhase } from '../lib/challenge'
import { cn } from '../lib/cn'
import { proposeChallengeUrl } from '../lib/links'
import { toggleTheme, useTheme } from '../lib/theme'
import { useArena } from '../state/arena'
import { CATEGORY_COLORS } from './Tags'

interface Command {
  id: string
  group: 'Go to' | 'Challenges' | 'Actions'
  label: string
  hint?: string
  keywords: string
  Icon?: typeof Trophy
  dot?: string
  run: () => void
}

const PHASE_LABEL = { active: 'Live', upcoming: 'Opening soon', completed: 'Ended' } as const
const PHASE_ORDER = { active: 0, upcoming: 1, completed: 2 } as const

const OpenPaletteContext = createContext<() => void>(() => {})

export function useCommandPalette() {
  return useContext(OpenPaletteContext)
}

/** Ctrl/⌘ + K anywhere opens a git-flavoured command palette. */
export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const show = useCallback(() => setOpen(true), [])

  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <OpenPaletteContext.Provider value={show}>
      {children}
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </OpenPaletteContext.Provider>
  )
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const id = useId()
  const navigate = useNavigate()
  const theme = useTheme()
  const { account, profile, requireProfile, openSignIn, signOut, resetDemo } = useArena()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      setQuery('')
      setActive(0)
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  const commands = useMemo<Command[]>(() => {
    const now = Date.now()
    const go = (to: string) => () => navigate(to)
    const list: Command[] = [
      { id: 'go-arena', group: 'Go to', label: 'Challenges', keywords: 'arena browse list', Icon: LayoutGrid, run: go('/arena') },
      { id: 'go-home', group: 'Go to', label: 'About the Arena', keywords: 'home landing intro story', Icon: Sparkles, run: go('/') },
      { id: 'go-board', group: 'Go to', label: 'Leaderboard', keywords: 'rank standings xp', Icon: Trophy, run: go('/leaderboard') },
      { id: 'go-me', group: 'Go to', label: 'My progress', keywords: 'profile badges streak', Icon: User, run: go('/me') },
      { id: 'go-how', group: 'Go to', label: 'How scoring works', keywords: 'points pass mark rules', Icon: Sparkles, run: go('/arena#how-it-works') },
      ...[...CHALLENGES]
        .sort((a, b) => PHASE_ORDER[getPhase(a, now)] - PHASE_ORDER[getPhase(b, now)])
        .map<Command>((c) => ({
          id: `ch-${c.slug}`,
          group: 'Challenges',
          label: c.title,
          hint: `${PHASE_LABEL[getPhase(c, now)]} · ${c.points} XP`,
          keywords: `${c.category} ${c.difficulty} ${c.skills.join(' ')} ${c.slug}`,
          dot: CATEGORY_COLORS[c.category],
          run: go(`/challenges/${c.slug}`),
        })),
      {
        id: 'act-theme',
        group: 'Actions',
        label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        keywords: 'theme dark light mode appearance',
        Icon: theme === 'dark' ? Sun : Moon,
        run: toggleTheme,
      },
      ...(!account
        ? [
            { id: 'act-signin', group: 'Actions', label: 'Sign in', keywords: 'login google github account', Icon: LogIn, run: () => openSignIn('signin') } as Command,
            { id: 'act-signup', group: 'Actions', label: 'Create account', keywords: 'register sign up join', Icon: UserPlus, run: () => openSignIn('signup') } as Command,
          ]
        : !profile
          ? [{ id: 'act-setup', group: 'Actions', label: 'Finish your profile', keywords: 'setup profile email', Icon: UserPlus, run: () => requireProfile() } as Command]
          : [{ id: 'act-signout', group: 'Actions', label: 'Log out', keywords: 'logout sign out account', Icon: LogOut, run: () => void signOut() } as Command]),
      ...(GITHUB_REPO_URL
        ? [
            {
              id: 'act-propose',
              group: 'Actions',
              label: 'Propose a challenge',
              hint: 'Opens a GitHub issue',
              keywords: 'idea suggest new issue',
              Icon: FilePlus2,
              run: () => window.open(proposeChallengeUrl(), '_blank', 'noopener'),
            } as Command,
          ]
        : []),
      {
        id: 'act-reset',
        group: 'Actions',
        label: 'Reset my progress',
        keywords: 'clear restart',
        Icon: RotateCcw,
        run: () => {
          if (window.confirm('Reset your progress? This clears your profile, XP and badges for this account.')) resetDemo()
        },
      },
    ]
    return list
  }, [navigate, theme, account, profile, requireProfile, openSignIn, signOut, resetDemo])

  const results = useMemo(() => {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
    if (terms.length === 0) return commands
    return commands.filter((c) => {
      const haystack = `${c.label} ${c.keywords} ${c.group}`.toLowerCase()
      return terms.every((t) => haystack.includes(t))
    })
  }, [commands, query])

  const current = results[Math.min(active, results.length - 1)]

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active, results])

  function execute(command: Command | undefined) {
    if (!command) return
    onClose()
    command.run()
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => (i + 1) % Math.max(1, results.length))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => (i - 1 + results.length) % Math.max(1, results.length))
    } else if (event.key === 'Home') {
      setActive(0)
    } else if (event.key === 'End') {
      setActive(results.length - 1)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      execute(current)
    }
  }

  let lastGroup = ''

  return (
    <dialog
      ref={ref}
      onClose={() => open && onClose()}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label="Command palette"
      className="mx-auto mb-auto mt-[10vh] w-[min(640px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl"
    >
      <div className="flex items-center gap-2 border-b border-line px-4">
        <span className="font-mono text-sm font-semibold text-accent-strong" aria-hidden="true">
          $
        </span>
        <span className="hidden font-mono text-sm text-muted sm:inline" aria-hidden="true">
          git checkout
        </span>
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded="true"
          aria-controls={`${id}-list`}
          aria-activedescendant={current ? `${id}-${current.id}` : undefined}
          aria-autocomplete="list"
          aria-label="Search challenges, pages and actions"
          placeholder="a challenge, page or action…"
          spellCheck={false}
          className="h-14 min-w-0 flex-1 bg-transparent font-mono text-sm text-ink outline-none placeholder:text-muted/80"
        />
        <kbd className="rounded-md border border-line-strong px-1.5 py-0.5 font-mono text-[11px] text-muted">esc</kbd>
      </div>

      <ul ref={listRef} id={`${id}-list`} role="listbox" aria-label="Results" className="max-h-[min(52vh,440px)] overflow-y-auto p-2">
        {results.length === 0 && (
          <li role="presentation" className="px-3 py-10 text-center font-mono text-sm text-muted">
            error: pathspec &apos;{query}&apos; did not match anything
          </li>
        )}
        {results.map((command, i) => {
          const header = command.group !== lastGroup ? command.group : null
          lastGroup = command.group
          const selected = command === current
          return (
            <li key={command.id} role="presentation">
              {header && (
                <p className="px-3 pb-1.5 pt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted" aria-hidden="true">
                  {header}
                </p>
              )}
              <div
                id={`${id}-${command.id}`}
                role="option"
                aria-selected={selected}
                onMouseMove={() => setActive(i)}
                onClick={() => execute(command)}
                className={cn(
                  'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm',
                  selected ? 'bg-sunken text-ink' : 'text-ink-soft',
                )}
              >
                {command.dot ? (
                  <span className="flex h-5 w-5 items-center justify-center" aria-hidden="true">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: command.dot }} />
                  </span>
                ) : (
                  command.Icon && <command.Icon className="h-[18px] w-[18px] shrink-0 text-muted" aria-hidden="true" />
                )}
                <span className="min-w-0 flex-1 truncate font-medium">{command.label}</span>
                {command.hint && <span className="hidden shrink-0 font-mono text-xs text-muted sm:inline">{command.hint}</span>}
                {selected && <CornerDownLeft className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />}
              </div>
            </li>
          )
        })}
      </ul>

      <div className="flex items-center justify-between gap-3 border-t border-line bg-sunken/50 px-4 py-2.5 font-mono text-[11px] text-muted">
        <span>↑↓ navigate · ↵ open · esc close</span>
        <span className="hidden sm:inline">
          {results.length} result{results.length === 1 ? '' : 's'}
        </span>
      </div>
    </dialog>
  )
}
