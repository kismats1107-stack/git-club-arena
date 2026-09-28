import confetti from 'canvas-confetti'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { JoinDialog } from '../components/JoinDialog'
import { SignInDialog } from '../components/SignInDialog'
import { PASS_MARK } from '../config'
import { getChallenge } from '../data/challenges'
import { PARTICIPANTS } from '../data/participants'
import type { Participant } from '../data/types'
import { cloudEnabled, loadCloudState, loadCommunity, saveCloudState, type PublicEntry, type SavedState } from '../lib/cloud'
import {
  BADGES,
  INITIAL_STATE,
  computeAward,
  currentStreak,
  earnedBadges,
  getLevel,
  rankFor,
  totalXp,
  type ArenaState,
  type BadgeId,
  type ChallengeProgress,
  type Climb,
  type Profile,
} from '../lib/progress'
import type { Review } from '../lib/review'
import { isoDay } from '../lib/time'
import { useAuth, type AuthUser } from './auth'
import { useToast } from './toast'

/* Each account keeps its own progress: cached in this browser under its uid and, when
 * Firebase is configured, synced to Firestore so it follows the student across devices. */
const STORAGE_PREFIX = 'gitclub-arena:v3:'

function normalize(raw: Partial<ArenaState>): ArenaState {
  const saved: ArenaState = { ...INITIAL_STATE, ...raw, climb: null }
  // A review interrupted by a reload can't resume; put the challenge back where it was.
  for (const [slug, p] of Object.entries(saved.progress)) {
    if (p.status === 'submitted') saved.progress[slug] = { ...p, status: p.review ? 'changes_requested' : 'in_progress' }
  }
  return saved
}

function loadLocal(uid: string): SavedState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + uid)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedState
    return { state: normalize(parsed.state), savedAt: parsed.savedAt ?? 0 }
  } catch {
    return null
  }
}

function saveLocal(uid: string, saved: SavedState) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + uid, JSON.stringify({ ...saved, state: { ...saved.state, climb: null } }))
  } catch {
    // Private mode or blocked storage: the app still works for this session.
  }
}

function bumpActivity(activity: ArenaState['activity']): ArenaState['activity'] {
  const key = isoDay(new Date())
  return { ...activity, [key]: (activity[key] ?? 0) + 1 }
}

function celebrate() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const colors = ['#f05032', '#17150f', '#f3b33d', '#157a3c', '#ffffff']
  void confetti({ particleCount: 90, spread: 70, startVelocity: 42, origin: { y: 0.72 }, colors })
  window.setTimeout(() => void confetti({ particleCount: 60, spread: 110, scalar: 0.8, origin: { y: 0.62 }, colors }), 220)
}

export function climbMessage(climb: Climb): string {
  if (climb.from === null) return `You entered the leaderboard at #${climb.to}.`
  const places = climb.from - climb.to
  if (places > 0) return `You climbed ${places} place${places === 1 ? '' : 's'} to #${climb.to}.`
  return `You're holding #${climb.to} on the leaderboard.`
}

type SignInMode = 'signin' | 'signup'

interface ArenaContextValue {
  state: ArenaState
  profile: Profile | null
  /** The signed-in account (Google, GitHub or a local demo session). */
  account: AuthUser | null
  /** True once the account's saved progress has been loaded. */
  ready: boolean
  cloudSync: boolean
  xp: number
  level: ReturnType<typeof getLevel>
  rank: number | null
  streak: number
  solved: number
  badges: BadgeId[]
  /** Everyone on the board except you: sample builders plus real accounts from the cloud. */
  others: Participant[]
  refreshCommunity: () => void
  progressFor: (slug: string) => ChallengeProgress | undefined
  /** Runs `then` once the visitor is signed in and has a profile, asking for whichever is missing. */
  requireProfile: (then?: () => void) => void
  openSignIn: (mode?: SignInMode) => void
  signOut: () => Promise<void>
  startChallenge: (slug: string) => void
  toggleRequirement: (slug: string, index: number) => void
  beginReview: (slug: string, submission: { repoUrl: string; liveUrl?: string }) => void
  finishReview: (slug: string, review: Review) => void
  cancelReview: (slug: string) => void
  clearClimb: () => void
  resetDemo: () => void
}

const ArenaContext = createContext<ArenaContextValue | null>(null)

export function ArenaProvider({ children }: { children: ReactNode }) {
  const toast = useToast()
  const { user, status: authStatus, signOut: authSignOut } = useAuth()
  const uid = user?.uid ?? null
  const syncsToCloud = cloudEnabled && Boolean(uid) && user?.provider !== 'demo'

  const [state, setState] = useState<ArenaState>(INITIAL_STATE)
  const [loadedFor, setLoadedFor] = useState<string | null | undefined>(undefined)
  const ready = authStatus !== 'loading' && loadedFor === uid
  const [community, setCommunity] = useState<Participant[]>([])
  const [dialog, setDialog] = useState<'signin' | 'setup' | null>(null)
  const [signInMode, setSignInMode] = useState<SignInMode>('signin')

  const stateRef = useRef(state)
  const readyRef = useRef(ready)
  const pending = useRef<(() => void) | undefined>(undefined)
  const toastedBadges = useRef(new Set<string>())

  useEffect(() => {
    stateRef.current = state
    readyRef.current = ready
  }, [state, ready])

  /** Applies an update immediately to the ref too, so async review callbacks never read stale state. */
  const commit = useCallback((update: (prev: ArenaState) => ArenaState) => {
    const next = update(stateRef.current)
    stateRef.current = next
    setState(next)
    return next
  }, [])

  /* ----- Load the account's progress whenever the signed-in user changes ----- */
  useEffect(() => {
    if (authStatus === 'loading') return
    toastedBadges.current.clear()
    if (!uid) {
      stateRef.current = INITIAL_STATE
      setState(INITIAL_STATE)
      setLoadedFor(null)
      return
    }
    const local = loadLocal(uid)
    const initial = local?.state ?? INITIAL_STATE
    stateRef.current = initial
    setState(initial)
    if (!syncsToCloud) {
      setLoadedFor(uid)
      return
    }
    let cancelled = false
    const timeout = new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 5000))
    Promise.race([loadCloudState(uid), timeout])
      .then((remote) => {
        if (cancelled || !remote || remote.savedAt <= (local?.savedAt ?? 0)) return
        const fresh = normalize(remote.state)
        stateRef.current = fresh
        setState(fresh)
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoadedFor(uid)
      })
    return () => {
      cancelled = true
    }
  }, [uid, authStatus, syncsToCloud])

  const xp = useMemo(() => totalXp(state.progress), [state.progress])
  const solved = useMemo(() => Object.values(state.progress).filter((p) => p.status === 'completed').length, [state.progress])
  const streak = currentStreak(state.activity)
  const badges = useMemo(() => {
    // Badges are permanent once celebrated, even if a streak later breaks.
    return [...new Set([...(state.celebratedBadges as BadgeId[]), ...earnedBadges(state)])]
  }, [state])

  /* ----- Save locally at once, and to the cloud shortly after changes settle ----- */
  useEffect(() => {
    if (!ready || !uid) return
    const saved: SavedState = { state, savedAt: Date.now() }
    saveLocal(uid, saved)
    if (!syncsToCloud) return
    const entry: PublicEntry | null =
      state.profile && xp > 0
        ? {
            name: state.profile.name,
            year: state.profile.year,
            branch: state.profile.branch,
            xp,
            solved,
            streak,
            updatedAt: saved.savedAt,
          }
        : null
    const t = window.setTimeout(() => saveCloudState(uid, saved, entry).catch(() => undefined), 1200)
    return () => window.clearTimeout(t)
  }, [state, ready, uid, syncsToCloud, xp, solved, streak])

  /* ----- Real builders on the leaderboard ----- */
  const refreshCommunity = useCallback(() => {
    if (!cloudEnabled) return
    loadCommunity(uid ?? undefined)
      .then(setCommunity)
      .catch(() => undefined)
  }, [uid])

  useEffect(() => {
    refreshCommunity()
  }, [refreshCommunity])

  const others = useMemo(() => [...PARTICIPANTS, ...community], [community])
  const othersRef = useRef(others)
  useEffect(() => {
    othersRef.current = others
  }, [others])

  /* ----- Sign-in and registration gate ----- */

  const requireProfile = useCallback(
    (then?: () => void) => {
      if (uid && readyRef.current && stateRef.current.profile) {
        then?.()
        return
      }
      pending.current = then
      if (uid && readyRef.current) {
        setDialog('setup')
      } else {
        setSignInMode(uid ? 'signin' : 'signup')
        setDialog('signin')
      }
    },
    [uid],
  )

  const openSignIn = useCallback((mode: SignInMode = 'signin') => {
    pending.current = undefined
    setSignInMode(mode)
    setDialog('signin')
  }, [])

  const closeDialogs = useCallback(() => {
    pending.current = undefined
    setDialog(null)
  }, [])

  // Once sign-in succeeds and the account has loaded: returning users continue, new ones register.
  useEffect(() => {
    if (dialog !== 'signin' || !uid || !ready) return
    if (stateRef.current.profile) {
      setDialog(null)
      toast({
        tone: 'success',
        title: `Welcome back, ${stateRef.current.profile.name.split(' ')[0]}!`,
        description: syncsToCloud ? 'Your progress is synced to your account.' : 'Signed in for this browser.',
      })
      const then = pending.current
      pending.current = undefined
      then?.()
    } else {
      setDialog('setup')
    }
  }, [dialog, uid, ready, toast, syncsToCloud])

  const completeSetup = useCallback(
    (input: Omit<Profile, 'joinedAt'>) => {
      commit((prev) => ({ ...prev, profile: { ...input, joinedAt: new Date().toISOString() } }))
      setDialog(null)
      toast({
        tone: 'success',
        title: `Welcome to the Arena, ${input.name.split(' ')[0]}!`,
        description: syncsToCloud ? 'Your account is ready — progress syncs across your devices.' : 'Your progress is saved in this browser.',
      })
      const then = pending.current
      pending.current = undefined
      then?.()
    },
    [commit, toast, syncsToCloud],
  )

  const signOut = useCallback(async () => {
    await authSignOut()
    toast({ tone: 'info', title: 'Logged out', description: 'Your progress is safe in your account. See you soon.' })
  }, [authSignOut, toast])

  /* ----- Challenge actions ----- */

  const startChallenge = useCallback(
    (slug: string) => {
      commit((prev) =>
        prev.progress[slug]
          ? prev
          : {
              ...prev,
              progress: { ...prev.progress, [slug]: { status: 'in_progress', startedAt: new Date().toISOString(), done: [] } },
              activity: bumpActivity(prev.activity),
            },
      )
    },
    [commit],
  )

  const toggleRequirement = useCallback(
    (slug: string, index: number) => {
      commit((prev) => {
        const current = prev.progress[slug]
        if (!current || current.status !== 'in_progress') return prev
        const done = current.done.includes(index)
          ? current.done.filter((i) => i !== index)
          : [...current.done, index].sort((a, b) => a - b)
        return { ...prev, progress: { ...prev.progress, [slug]: { ...current, done } }, activity: bumpActivity(prev.activity) }
      })
    },
    [commit],
  )

  const beginReview = useCallback(
    (slug: string, { repoUrl, liveUrl }: { repoUrl: string; liveUrl?: string }) => {
      commit((prev) => {
        const current = prev.progress[slug]
        if (!current) return prev
        return {
          ...prev,
          progress: {
            ...prev.progress,
            [slug]: {
              ...current,
              status: 'submitted',
              submittedAt: new Date().toISOString(),
              repoUrl,
              liveUrl,
              attempts: (current.attempts ?? 0) + 1,
            },
          },
          activity: bumpActivity(prev.activity),
        }
      })
    },
    [commit],
  )

  const cancelReview = useCallback(
    (slug: string) => {
      commit((prev) => {
        const current = prev.progress[slug]
        if (!current || current.status !== 'submitted') return prev
        return {
          ...prev,
          progress: {
            ...prev.progress,
            [slug]: { ...current, status: current.review ? 'changes_requested' : 'in_progress', attempts: Math.max(0, (current.attempts ?? 1) - 1) },
          },
        }
      })
    },
    [commit],
  )

  const finishReview = useCallback(
    (slug: string, review: Review) => {
      const current = stateRef.current
      const entry = current.progress[slug]
      const challenge = getChallenge(slug)
      if (!entry || !challenge) return
      const done = review.items.flatMap((item, i) => (item.status === 'pass' ? [i] : []))

      if (!review.approved) {
        commit((prev) => ({
          ...prev,
          progress: { ...prev.progress, [slug]: { ...entry, status: 'changes_requested', review, done } },
        }))
        toast({
          tone: 'warn',
          title: `Changes requested · ${review.percent}%`,
          description: `You need ${PASS_MARK * 100}% to get merged. Fix the failing requirements, push, and run the review again.`,
        })
        return
      }

      const award = computeAward(challenge, review, new Date(entry.submittedAt ?? Date.now()))
      const xpBefore = totalXp(current.progress)
      const xpAfter = xpBefore + award.total
      const climb: Climb = {
        xpBefore,
        xpAfter,
        from: rankFor(xpBefore, othersRef.current),
        to: rankFor(xpAfter, othersRef.current) ?? 1,
      }
      commit((prev) => ({
        ...prev,
        progress: {
          ...prev.progress,
          [slug]: { ...entry, status: 'completed', completedAt: new Date().toISOString(), review, award, done },
        },
        activity: bumpActivity(prev.activity),
        climb,
      }))
      celebrate()
      toast({
        tone: 'xp',
        title: `Approved · +${award.total} XP`,
        description: `${challenge.title} scored ${review.percent}%. ${climbMessage(climb)}`,
        action: { label: 'See leaderboard', to: '/leaderboard' },
      })
    },
    [commit, toast],
  )

  // Celebrate each badge exactly once — several at a time share one notification.
  useEffect(() => {
    if (!ready) return
    const fresh = badges.filter((id) => !state.celebratedBadges.includes(id) && !toastedBadges.current.has(id))
    if (fresh.length === 0) return
    fresh.forEach((id) => toastedBadges.current.add(id))
    const unlocked = BADGES.filter((b) => fresh.includes(b.id))
    const [first] = unlocked
    if (first) {
      window.setTimeout(
        () =>
          toast(
            unlocked.length === 1
              ? { tone: 'badge', title: `Badge unlocked: ${first.name}`, description: first.description, action: { label: 'View badges', to: '/me' } }
              : {
                  tone: 'badge',
                  title: `${unlocked.length} badges unlocked`,
                  description: unlocked.map((b) => b.name).join(' · '),
                  action: { label: 'View badges', to: '/me' },
                },
          ),
        900,
      )
    }
    commit((prev) => ({ ...prev, celebratedBadges: [...new Set([...prev.celebratedBadges, ...fresh])] }))
  }, [ready, badges, state.celebratedBadges, toast, commit])

  const clearClimb = useCallback(() => commit((prev) => (prev.climb ? { ...prev, climb: null } : prev)), [commit])

  const resetDemo = useCallback(() => {
    toastedBadges.current.clear()
    commit(() => INITIAL_STATE)
    toast({ tone: 'info', title: 'Progress reset', description: 'Your profile, XP and badges were cleared for this account.' })
  }, [commit, toast])

  const value = useMemo<ArenaContextValue>(
    () => ({
      state,
      profile: state.profile,
      account: user,
      ready,
      cloudSync: syncsToCloud,
      xp,
      level: getLevel(xp),
      rank: rankFor(xp, others),
      streak,
      solved,
      badges,
      others,
      refreshCommunity,
      progressFor: (slug) => state.progress[slug],
      requireProfile,
      openSignIn,
      signOut,
      startChallenge,
      toggleRequirement,
      beginReview,
      finishReview,
      cancelReview,
      clearClimb,
      resetDemo,
    }),
    [
      state,
      user,
      ready,
      syncsToCloud,
      xp,
      streak,
      solved,
      badges,
      others,
      refreshCommunity,
      requireProfile,
      openSignIn,
      signOut,
      startChallenge,
      toggleRequirement,
      beginReview,
      finishReview,
      cancelReview,
      clearClimb,
      resetDemo,
    ],
  )

  return (
    <ArenaContext.Provider value={value}>
      {children}
      <SignInDialog open={dialog === 'signin'} mode={signInMode} onModeChange={setSignInMode} onClose={closeDialogs} />
      <JoinDialog open={dialog === 'setup'} account={user} onCancel={closeDialogs} onJoin={completeSetup} />
    </ArenaContext.Provider>
  )
}

export function useArena() {
  const ctx = useContext(ArenaContext)
  if (!ctx) throw new Error('useArena must be used inside <ArenaProvider>')
  return ctx
}
