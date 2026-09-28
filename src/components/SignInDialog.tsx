import { FlaskConical, LoaderCircle, LockKeyhole, ShieldCheck, X } from 'lucide-react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '../lib/cn'
import { SignInCancelled, useAuth } from '../state/auth'
import { GithubIcon, GoogleIcon } from './Brand'

type Mode = 'signin' | 'signup'
type Provider = 'google' | 'github'

interface Props {
  open: boolean
  mode: Mode
  onModeChange: (mode: Mode) => void
  onClose: () => void
}

const COPY: Record<Mode, { title: string; body: string }> = {
  signin: {
    title: 'Welcome back',
    body: 'Pick up where you left off — your XP, badges and streak live in your account.',
  },
  signup: {
    title: 'Create your account',
    body: 'One click with Google or GitHub, then add your CHARUSAT email. That’s the whole sign-up.',
  },
}

const PROVIDER_NAME: Record<Provider, string> = { google: 'Google', github: 'GitHub' }

/** Terminal that narrates the sign-in: which provider is highlighted, waiting, authenticated. */
function AuthConsole({ hovered, busy, signedInAs }: { hovered: Provider; busy: Provider | null; signedInAs: string | null }) {
  const caret = <span className="ml-0.5 inline-block h-[1.05em] w-[0.5em] translate-y-[0.18em] animate-caret bg-white/80" aria-hidden="true" />
  return (
    <aside className="relative h-full overflow-hidden bg-console p-5 font-mono text-[12px] leading-relaxed text-white/75 sm:p-6" aria-hidden="true">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(240,80,50,.32),transparent_65%)]" />
      <div className="relative space-y-1.5">
        <p>
          <span className="text-[#ff7a58]">$</span> arena auth login
        </p>
        <p className="text-white/55">? How would you like to authenticate?</p>
        {(['google', 'github'] as Provider[]).map((p) => {
          const active = (busy ?? hovered) === p
          return (
            <p key={p} className={cn('flex items-center gap-2 transition-colors', active ? 'text-[#a5d6ff]' : 'text-white/40')}>
              <span className="w-3">{active ? '❯' : ''}</span>
              {PROVIDER_NAME[p]}
              {active && !busy && !signedInAs && caret}
            </p>
          )
        })}
        <AnimatePresence mode="popLayout">
          {busy && !signedInAs && (
            <motion.p key="busy" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 pt-2 text-white/70">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin text-[#ff7a58]" />
              Waiting for {PROVIDER_NAME[busy]} in the popup…
            </motion.p>
          )}
          {signedInAs && (
            <motion.div key="done" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-1 pt-2">
              <p className="text-[#3fb950]">✓ Authenticated as {signedInAs}</p>
              <p className="flex items-center gap-2 text-white/60">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                Loading your branch…
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative mt-8 hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 font-sans sm:block">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <ShieldCheck className="h-4 w-4 text-[#3fb950]" />
          How your account is protected
        </div>
        <ul className="mt-3 space-y-2 text-[12.5px] leading-snug text-white/60">
          <li>• Sign-in happens on Google’s or GitHub’s own page</li>
          <li>• The Arena never sees or stores a password</li>
          <li>• Your progress is readable only by your account</li>
        </ul>
      </div>
    </aside>
  )
}

export function SignInDialog({ open, mode, onModeChange, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  const { configured, status, user, signIn, signInDemo } = useAuth()
  const [busy, setBusy] = useState<Provider | null>(null)
  const [hovered, setHovered] = useState<Provider>('google')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      setBusy(null)
      setError(null)
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  const signedInAs = open && status === 'signed-in' && user ? (user.name ?? user.email ?? 'demo user') : null

  async function handle(provider: Provider) {
    setError(null)
    setBusy(provider)
    try {
      await signIn(provider)
    } catch (err) {
      if (!(err instanceof SignInCancelled)) setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.')
      setBusy(null)
    }
  }

  const copy = COPY[mode]
  const disabled = Boolean(busy) || Boolean(signedInAs)

  return (
    <dialog
      ref={ref}
      onClose={() => open && onClose()}
      aria-labelledby={`${id}-title`}
      className="join-dialog m-auto max-h-[calc(100dvh-24px)] w-[min(820px,calc(100vw-24px))] overflow-y-auto rounded-3xl border border-line bg-surface p-0 text-ink shadow-2xl"
    >
      <div className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_310px]">
        <div className="order-2 min-w-0 p-6 sm:p-8 md:order-1">
          <div className="flex items-start justify-between gap-4">
            <p className="font-mono text-xs text-accent-strong">$ arena auth login</p>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted transition hover:rotate-90 hover:bg-sunken hover:text-ink"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Sign in / Create account */}
          <LayoutGroup id={`${id}-tabs`}>
            <div role="tablist" aria-label="Account" className="mt-3 grid grid-cols-2 gap-1 rounded-xl border border-line bg-paper p-1">
              {(['signin', 'signup'] as Mode[]).map((m) => {
                const selected = m === mode
                return (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => onModeChange(m)}
                    className={cn('relative h-10 cursor-pointer rounded-lg text-sm font-semibold transition-colors', selected ? 'text-ink' : 'text-muted hover:text-ink')}
                  >
                    {selected && (
                      <motion.span
                        layoutId="auth-tab"
                        className="absolute inset-0 rounded-lg bg-surface shadow-card ring-1 ring-line-strong"
                        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                      />
                    )}
                    <span className="relative">{m === 'signin' ? 'Sign in' : 'Create account'}</span>
                  </button>
                )
              })}
            </div>
          </LayoutGroup>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={mode} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
              <h2 id={`${id}-title`} className="mt-6 font-display text-[28px] font-bold leading-tight tracking-[-0.02em]">
                {copy.title}
              </h2>
              <p className="mt-1.5 text-sm text-muted">{copy.body}</p>
            </motion.div>
          </AnimatePresence>

          <motion.div className="mt-6 space-y-3" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}>
            {(['google', 'github'] as Provider[]).map((p) => (
              <motion.button
                key={p}
                type="button"
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: configured ? 1 : 0.45, y: 0 } }}
                onClick={() => handle(p)}
                onMouseEnter={() => setHovered(p)}
                onFocus={() => setHovered(p)}
                disabled={!configured || disabled}
                data-magnetic
                className={cn(
                  'group relative flex h-14 w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-2xl text-[15px] font-semibold transition-[box-shadow,background-color,transform] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55',
                  p === 'google'
                    ? 'border border-line-strong bg-surface text-ink shadow-card hover:shadow-lift'
                    : 'bg-ink text-paper shadow-card hover:shadow-lift',
                )}
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                {busy === p ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : p === 'google' ? (
                  <GoogleIcon className="h-5 w-5" />
                ) : (
                  <GithubIcon className="h-5 w-5" />
                )}
                {busy === p ? `Waiting for ${PROVIDER_NAME[p]}…` : `Continue with ${PROVIDER_NAME[p]}`}
              </motion.button>
            ))}
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.p
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden rounded-xl border border-hard/25 bg-hard-soft px-4 py-3 text-sm font-medium text-hard"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {signedInAs && (
            <p role="status" className="mt-4 flex items-center gap-2 text-sm font-medium text-easy">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Signed in — loading your profile…
            </p>
          )}

          {!configured && (
            <div className="mt-5 rounded-2xl border border-medium/30 bg-medium-soft p-4 text-sm text-ink-soft">
              <p className="font-semibold text-medium">Google and GitHub sign-in aren’t connected on this build yet.</p>
              <p className="mt-1">Add the Firebase keys to switch them on. Until then you can try everything in a demo session saved only in this browser.</p>
              <button
                type="button"
                onClick={signInDemo}
                className="mt-3 inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-ink px-3.5 text-sm font-semibold text-paper transition hover:bg-ink-soft active:scale-[0.97]"
              >
                <FlaskConical className="h-4 w-4" aria-hidden="true" />
                Continue in demo mode
              </button>
            </div>
          )}

          <p className="mt-6 text-xs leading-relaxed text-muted">
            {mode === 'signup' ? (
              <>
                Tip: use your <span className="font-mono">@charusat.edu.in</span> Google account and your college email is verified automatically.
              </>
            ) : (
              'New here? Choose Create account — it uses the same buttons.'
            )}
          </p>
          <p className="mt-4 flex items-center gap-1.5 border-t border-line pt-4 text-xs text-muted">
            <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
            Secured by Firebase Authentication. The Arena never sees your password.
          </p>
        </div>

        <div className="order-1 min-w-0 md:order-2">
          <AuthConsole hovered={hovered} busy={busy} signedInAs={signedInAs} />
        </div>
      </div>
    </dialog>
  )
}
