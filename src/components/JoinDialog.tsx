import { AtSign, BadgeCheck, Check, GitBranch, LoaderCircle, Lock, Sparkles, User, X } from 'lucide-react'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react'
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { BRANCHES, YEARS, yearLabel } from '../data/participants'
import type { Branch, Year } from '../data/types'
import { cn } from '../lib/cn'
import { isCollegeEmail, parseCollegeId } from '../lib/college'
import type { Profile } from '../lib/progress'
import type { AuthUser } from '../state/auth'
import { initials } from './Avatar'
import { GithubIcon, GoogleIcon } from './Brand'
import { buttonClass } from './Button'

interface Props {
  open: boolean
  /** The signed-in account; its name and (college) email pre-fill the form. */
  account: AuthUser | null
  onCancel: () => void
  onJoin: (profile: Omit<Profile, 'joinedAt'>) => void
}

type Field = 'email' | 'name' | null

const inputClass =
  'h-12 w-full rounded-xl border border-line-strong bg-paper pl-11 pr-11 text-[15px] text-ink placeholder:text-muted/70 transition focus:border-accent focus:bg-surface focus:outline-none focus:ring-4 focus:ring-accent/15 aria-[invalid=true]:border-hard aria-[invalid=true]:ring-hard/15'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
}
const rise = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 380, damping: 30 } },
}

/** Radio chips with a highlight that slides between options. */
function ChipGroup<T extends string | number>({
  legend,
  name,
  options,
  value,
  onChange,
  render,
  columns,
}: {
  legend: string
  name: string
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  render: (v: T) => ReactNode
  columns: string
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{legend}</legend>
      <LayoutGroup id={name}>
        <div className={cn('mt-2 grid gap-1 rounded-xl border border-line bg-paper p-1', columns)}>
          {options.map((option) => {
            const checked = option === value
            return (
              <label key={String(option)} className="relative">
                <input type="radio" name={name} checked={checked} onChange={() => onChange(option)} className="peer sr-only" />
                {checked && (
                  <motion.span
                    layoutId={`${name}-pill`}
                    className="absolute inset-0 rounded-lg bg-surface shadow-card ring-1 ring-line-strong"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <span
                  className={cn(
                    'relative flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-accent',
                    checked ? 'text-ink' : 'text-muted hover:text-ink',
                  )}
                >
                  {render(option)}
                </span>
              </label>
            )
          })}
        </div>
      </LayoutGroup>
    </fieldset>
  )
}

/** Terminal + player card that build themselves as the form is filled. */
function LivePreview({ name, email, collegeId, year, branch, focus }: { name: string; email: string; collegeId?: string; year: Year; branch: Branch; focus: Field }) {
  const valid = isCollegeEmail(email)
  const branchName = `arena/${(collegeId ?? 'you').toLowerCase()}`
  const caret = <span className="ml-px inline-block h-[1.05em] w-[0.5em] translate-y-[0.18em] animate-caret bg-white/80" aria-hidden="true" />
  const shown = name.trim()

  return (
    <aside className="relative h-full overflow-hidden bg-console p-5 text-white sm:p-6" aria-hidden="true">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(240,80,50,.35),transparent_65%)]" />
      <div className="relative space-y-1.5 font-mono text-[11.5px] leading-relaxed">
        <p className="truncate text-white/60">
          <span className="text-[#ff7a58]">$</span> git config user.name <span className={shown ? 'text-[#a5d6ff]' : 'text-white/30'}>"{shown || 'your name'}"</span>
          {focus === 'name' && caret}
        </p>
        <p className="truncate text-white/60">
          <span className="text-[#ff7a58]">$</span> git config user.email{' '}
          <span className={email ? (valid ? 'text-[#a5d6ff]' : 'text-[#ff8b7e]') : 'text-white/30'}>"{email.trim() || 'id@charusat.edu.in'}"</span>
          {focus === 'email' && caret}
        </p>
        <AnimatePresence>
          {valid && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <p className="truncate text-white/60">
                <span className="text-[#ff7a58]">$</span> git checkout -b {branchName}
              </p>
              <p className="truncate text-[#3fb950]">Switched to a new branch '{branchName}'</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Player card */}
      <div className="relative mt-6 hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:block">
        <div className="flex items-center gap-3">
          <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(160deg,#ff9a72,#f05032_55%,#9a2f16)] shadow-[0_0_0_4px_rgba(240,80,50,.15)]">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={shown ? initials(shown) : '?'}
                initial={{ y: 18, opacity: 0, rotate: -10 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: -18, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                className="font-display text-lg font-bold"
              >
                {shown ? initials(shown) : '?'}
              </motion.span>
            </AnimatePresence>
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold">{shown || 'Your name'}</p>
            <p className="font-mono text-[11px] text-white/50">{collegeId ?? 'your college ID'}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[yearLabel(year), branch].map((chip) => (
            <motion.span
              key={chip}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold"
            >
              {chip}
            </motion.span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-[11px] text-white/55">
          <span>Level 1 · Initial Commit</span>
          <span className="font-mono">0 / 150 XP</span>
        </div>
        <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="absolute inset-y-0 w-1/3 animate-[shimmer_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/45">
          <Sparkles className="h-3 w-3 text-[#ff9a72]" />
          Your first merge puts you on the leaderboard
        </p>
      </div>
      <p className="relative mt-4 text-[11px] leading-relaxed text-white/40">Saved only in this browser. No password needed.</p>
    </aside>
  )
}

/** Asked for only when someone starts their first challenge — browsing never needs it. */
export function JoinDialog({ open, account, onCancel, onJoin }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  const reduce = useReducedMotion()
  const [session, setSession] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [year, setYear] = useState<Year>(1)
  const [branch, setBranch] = useState<Branch>('CE')
  const [touched, setTouched] = useState({ year: false, branch: false })
  const [focus, setFocus] = useState<Field>(null)
  const [errors, setErrors] = useState<{ email?: string; name?: string }>({})
  const [shake, setShake] = useState(0)
  const [phase, setPhase] = useState<'form' | 'creating' | 'done'>('form')
  const timers = useRef<number[]>([])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      setSession((s) => s + 1)
      const providerEmail = account?.email && isCollegeEmail(account.email) ? account.email.toLowerCase() : ''
      const parsed = parseCollegeId(providerEmail)
      setName(account?.name ?? '')
      setEmail(providerEmail)
      setYear(parsed?.year ?? 1)
      setBranch(parsed?.branch ?? 'CE')
      setTouched({ year: false, branch: false })
      setErrors({})
      setPhase('form')
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
    // Closing mid-animation must never sign anyone in.
    if (!open) {
      timers.current.forEach((t) => window.clearTimeout(t))
      timers.current = []
    }
  }, [open, account])

  const verifiedEmail = account?.email && isCollegeEmail(account.email) ? account.email.toLowerCase() : null
  const emailLocked = Boolean(verifiedEmail) && email === verifiedEmail
  const detected = parseCollegeId(email)
  const emailValid = isCollegeEmail(email)

  function changeEmail(value: string) {
    setEmail(value)
    if (errors.email) setErrors((er) => ({ ...er, email: undefined }))
    // Fill year and branch from the college ID unless the student already picked them.
    const parsed = parseCollegeId(value)
    if (parsed?.year && !touched.year) setYear(parsed.year)
    if (parsed?.branch && !touched.branch) setBranch(parsed.branch)
  }

  function validate() {
    const next: typeof errors = {}
    const trimmed = email.trim()
    if (!trimmed) next.email = 'Enter your CHARUSAT email.'
    else if (!isCollegeEmail(trimmed)) next.email = 'Use your college email ending in charusat.edu.in — e.g. 25cs099@charusat.edu.in'
    if (name.trim().replace(/\s+/g, ' ').length < 2) next.name = 'Please enter your name (at least 2 characters).'
    return next
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (phase !== 'form') return
    const found = validate()
    setErrors(found)
    if (found.email || found.name) {
      setShake((s) => s + 1)
      document.getElementById(`${id}-${found.email ? 'email' : 'name'}`)?.focus()
      return
    }
    const profile = {
      name: name.trim().replace(/\s+/g, ' ').slice(0, 40),
      email: email.trim().toLowerCase(),
      collegeId: detected?.id,
      emailVerified: emailLocked,
      provider: account?.provider,
      photoURL: account?.photoURL ?? undefined,
      year,
      branch,
    }
    // A short, satisfying moment before the challenge starts.
    setPhase('creating')
    timers.current = [
      window.setTimeout(() => setPhase('done'), reduce ? 0 : 650),
      window.setTimeout(() => onJoin(profile), reduce ? 250 : 1500),
    ]
  }

  const shakeAnim = reduce ? {} : { x: [0, -9, 8, -6, 5, -2, 0] }

  return (
    <dialog
      ref={ref}
      onClose={() => open && onCancel()}
      aria-labelledby={`${id}-title`}
      className="join-dialog m-auto max-h-[calc(100dvh-24px)] w-[min(820px,calc(100vw-24px))] overflow-y-auto rounded-3xl border border-line bg-surface p-0 text-ink shadow-2xl"
    >
      <div className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_310px]">
        <div className="relative order-2 min-w-0 p-6 sm:p-8 md:order-1">
          <AnimatePresence mode="wait" initial={false}>
            {phase === 'form' ? (
              <motion.form key={`form-${session}`} noValidate onSubmit={handleSubmit} variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0, y: -8 }}>
                <motion.div variants={rise} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs text-accent-strong">$ git config --global · step 2 of 2</p>
                    <h2 id={`${id}-title`} className="mt-1.5 font-display text-[28px] font-bold leading-tight tracking-[-0.02em]">
                      Complete your profile
                    </h2>
                    {account && account.provider !== 'demo' ? (
                      <p className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-paper py-1 pl-1.5 pr-3 text-xs text-ink-soft">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface ring-1 ring-line">
                          {account.provider === 'google' ? <GoogleIcon className="h-3 w-3" /> : <GithubIcon className="h-3 w-3" />}
                        </span>
                        <span className="truncate">Signed in with {account.provider === 'google' ? 'Google' : 'GitHub'}{account.email ? ` · ${account.email}` : ''}</span>
                      </p>
                    ) : (
                      <p className="mt-1.5 text-sm text-muted">Use your CHARUSAT email — we’ll read your year and branch from your ID.</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted transition hover:rotate-90 hover:bg-sunken hover:text-ink"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </motion.div>

                <div className="mt-6 space-y-5">
                  {/* College email */}
                  <motion.div variants={rise}>
                    <motion.div key={errors.email ? `e-${shake}` : 'email'} animate={errors.email ? shakeAnim : {}} transition={{ duration: 0.45 }}>
                      <label htmlFor={`${id}-email`} className="text-sm font-semibold">
                        College email <span className="font-normal text-hard">*</span>
                      </label>
                      <div className="relative mt-1.5">
                        <AtSign className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" aria-hidden="true" />
                        <input
                          id={`${id}-email`}
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          spellCheck={false}
                          required
                          autoFocus
                          value={email}
                          readOnly={emailLocked}
                          onChange={(e) => changeEmail(e.target.value)}
                          onFocus={() => setFocus('email')}
                          onBlur={() => setFocus(null)}
                          placeholder="25cs099@charusat.edu.in"
                          aria-invalid={Boolean(errors.email)}
                          aria-describedby={`${id}-email-help`}
                          className={cn(inputClass, 'font-mono text-[14px]')}
                        />
                        <AnimatePresence>
                          {emailLocked ? (
                            <motion.span
                              initial={{ scale: 0.6, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-full bg-easy-soft px-2 py-1 text-[11px] font-semibold text-easy"
                            >
                              <Lock className="h-3 w-3" aria-hidden="true" />
                              Verified
                            </motion.span>
                          ) : emailValid && (
                            <motion.span
                              initial={{ scale: 0, rotate: -45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0 }}
                              transition={{ type: 'spring', stiffness: 520, damping: 20 }}
                              className="absolute right-3.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-easy text-on-accent"
                            >
                              <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                      <div id={`${id}-email-help`} className="mt-1.5 min-h-5 text-xs" aria-live="polite">
                        {errors.email ? (
                          <p role="alert" className="font-medium text-hard">
                            {errors.email}
                          </p>
                        ) : emailLocked ? (
                          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 font-medium text-easy">
                            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                            Verified by Google{detected ? ` · ${detected.id}${detected.year ? ` · ${yearLabel(detected.year)}` : ''}${detected.branch ? ` · ${detected.branch}` : ''}` : ''}
                          </motion.p>
                        ) : detected && (detected.year || detected.branch) ? (
                          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 font-medium text-easy">
                            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                            Detected {detected.id}
                            {detected.year ? ` · ${yearLabel(detected.year)}` : ''}
                            {detected.branch ? ` · ${detected.branch}` : ''}
                          </motion.p>
                        ) : emailValid ? (
                          <p className="font-medium text-easy">Looks good.</p>
                        ) : (
                          <p className="text-muted">Must end in charusat.edu.in</p>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Name */}
                  <motion.div variants={rise}>
                    <motion.div key={errors.name ? `n-${shake}` : 'name'} animate={errors.name ? shakeAnim : {}} transition={{ duration: 0.45 }}>
                      <label htmlFor={`${id}-name`} className="text-sm font-semibold">
                        Full name <span className="font-normal text-hard">*</span>
                      </label>
                      <div className="relative mt-1.5">
                        <User className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" aria-hidden="true" />
                        <input
                          id={`${id}-name`}
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value)
                            if (errors.name) setErrors((er) => ({ ...er, name: undefined }))
                          }}
                          onFocus={() => setFocus('name')}
                          onBlur={() => setFocus(null)}
                          placeholder="e.g. Riya Patel"
                          autoComplete="name"
                          maxLength={40}
                          required
                          aria-invalid={Boolean(errors.name)}
                          className={inputClass}
                        />
                      </div>
                      {errors.name && (
                        <p role="alert" className="mt-1.5 text-xs font-medium text-hard">
                          {errors.name}
                        </p>
                      )}
                    </motion.div>
                  </motion.div>

                  <motion.div variants={rise}>
                    <ChipGroup
                      legend="Year"
                      name={`${id}-year`}
                      options={YEARS}
                      value={year}
                      onChange={(v) => {
                        setYear(v)
                        setTouched((t) => ({ ...t, year: true }))
                      }}
                      render={(v) => ['1st', '2nd', '3rd', '4th'][v - 1]}
                      columns="grid-cols-4"
                    />
                  </motion.div>

                  <motion.div variants={rise}>
                    <ChipGroup
                      legend="Branch"
                      name={`${id}-branch`}
                      options={BRANCHES}
                      value={branch}
                      onChange={(v) => {
                        setBranch(v)
                        setTouched((t) => ({ ...t, branch: true }))
                      }}
                      render={(v) => v}
                      columns="grid-cols-4"
                    />
                  </motion.div>
                </div>

                <motion.div variants={rise} className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <button type="button" onClick={onCancel} className={buttonClass('ghost')}>
                    Cancel
                  </button>
                  <button type="submit" data-magnetic className={buttonClass('primary', 'lg')}>
                    <GitBranch className="h-4 w-4" aria-hidden="true" />
                    Finish &amp; enter the Arena
                  </button>
                </motion.div>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex min-h-[420px] flex-col items-center justify-center text-center"
                role="status"
                aria-live="polite"
              >
                <div className="relative flex h-24 w-24 items-center justify-center">
                  {phase === 'creating' ? (
                    <LoaderCircle className="h-10 w-10 animate-spin text-accent" aria-hidden="true" />
                  ) : (
                    <svg viewBox="0 0 96 96" className="h-24 w-24" aria-hidden="true">
                      <motion.circle
                        cx="48"
                        cy="48"
                        r="42"
                        fill="none"
                        stroke="var(--color-easy)"
                        strokeWidth="5"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, rotate: -90 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        style={{ originX: '50%', originY: '50%' }}
                      />
                      <motion.path
                        d="M30 49 l12 12 l24 -26"
                        fill="none"
                        stroke="var(--color-easy)"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.35, delay: 0.35, ease: 'easeOut' }}
                      />
                    </svg>
                  )}
                </div>
                <p className="mt-5 font-mono text-xs text-muted">
                  {phase === 'creating' ? `$ git checkout -b arena/${(detected?.id ?? 'you').toLowerCase()}` : `Switched to branch 'arena/${(detected?.id ?? 'you').toLowerCase()}'`}
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em]">
                  {phase === 'creating' ? 'Creating your branch…' : `You’re in, ${name.trim().split(' ')[0]}!`}
                </h2>
                <p className="mt-2 text-sm text-muted">{phase === 'creating' ? 'Setting up your profile' : 'Starting your challenge…'}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="order-1 min-w-0 md:order-2">
          <LivePreview name={name} email={email} collegeId={detected?.id} year={year} branch={branch} focus={focus} />
        </div>
      </div>
    </dialog>
  )
}
