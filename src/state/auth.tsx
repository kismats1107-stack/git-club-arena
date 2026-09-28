import {
  getRedirectResult,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithPopup,
  signInWithRedirect,
  type User,
} from 'firebase/auth'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { auth, firebaseEnabled, githubProvider, googleProvider } from '../lib/firebase'

export type AuthProviderId = 'google' | 'github' | 'demo'

export interface AuthUser {
  uid: string
  name: string | null
  email: string | null
  photoURL: string | null
  provider: AuthProviderId
}

type Status = 'loading' | 'signed-in' | 'signed-out'

interface AuthValue {
  status: Status
  user: AuthUser | null
  /** False when the Firebase keys aren't set — sign-in then falls back to a local demo session. */
  configured: boolean
  signIn: (provider: 'google' | 'github') => Promise<void>
  signInDemo: () => void
  signOut: () => Promise<void>
}

/** Thrown when the person closes the sign-in popup — not an error worth showing. */
export class SignInCancelled extends Error {}

const DEMO_KEY = 'gitclub-demo-session'
const DEMO_UID_KEY = 'gitclub-demo-uid'

function mapUser(user: User): AuthUser {
  const providerId = user.providerData[0]?.providerId
  return {
    uid: user.uid,
    name: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    provider: providerId === 'github.com' ? 'github' : 'google',
  }
}

function friendlyError(code: string | undefined): string {
  switch (code) {
    case 'auth/account-exists-with-different-credential':
      return 'An account with this email already exists. Sign in with the provider you used before (Google or GitHub).'
    case 'auth/unauthorized-domain':
      return 'This website isn’t on the authorised domains list yet. Add it in Firebase → Authentication → Settings.'
    case 'auth/configuration-not-found':
      return 'Authentication isn’t set up in Firebase yet. Open Firebase → Authentication and click Get started.'
    case 'auth/operation-not-allowed':
      return 'This sign-in method isn’t switched on yet. Enable it in Firebase → Authentication → Sign-in method.'
    case 'auth/network-request-failed':
      return 'Network error — check your connection and try again.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a minute and try again.'
    default:
      return 'Sign-in didn’t complete. Please try again.'
  }
}

function readDemo(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(DEMO_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    if (!auth) {
      const demo = readDemo()
      setUser(demo)
      setStatus(demo ? 'signed-in' : 'signed-out')
      return
    }
    // Completes a redirect sign-in (used when a popup was blocked).
    getRedirectResult(auth).catch(() => undefined)
    return onAuthStateChanged(auth, (next) => {
      setUser(next ? mapUser(next) : null)
      setStatus(next ? 'signed-in' : 'signed-out')
    })
  }, [])

  const signIn = useCallback(async (provider: 'google' | 'github') => {
    if (!auth) throw new Error('Sign-in isn’t configured on this build.')
    const p = provider === 'google' ? googleProvider() : githubProvider()
    try {
      await signInWithPopup(auth, p)
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, p)
        return
      }
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request' || code === 'auth/user-cancelled') {
        throw new SignInCancelled()
      }
      throw new Error(friendlyError(code))
    }
  }, [])

  const signInDemo = useCallback(() => {
    // One stable demo account per browser, so signing out and back in keeps its progress.
    let uid = `demo-${Math.random().toString(36).slice(2, 10)}`
    try {
      uid = window.localStorage.getItem(DEMO_UID_KEY) ?? uid
      window.localStorage.setItem(DEMO_UID_KEY, uid)
    } catch {
      // Storage blocked: a fresh demo account for this visit.
    }
    const demo: AuthUser = {
      uid,
      name: null,
      email: null,
      photoURL: null,
      provider: 'demo',
    }
    try {
      window.localStorage.setItem(DEMO_KEY, JSON.stringify(demo))
    } catch {
      // Storage blocked: the demo session lasts for this visit only.
    }
    setUser(demo)
    setStatus('signed-in')
  }, [])

  const signOut = useCallback(async () => {
    if (!auth || user?.provider === 'demo') {
      try {
        window.localStorage.removeItem(DEMO_KEY)
      } catch {
        // ignore
      }
      setUser(null)
      setStatus('signed-out')
      return
    }
    await firebaseSignOut(auth)
  }, [user])

  const value = useMemo<AuthValue>(
    () => ({ status, user, configured: firebaseEnabled, signIn, signInDemo, signOut }),
    [status, user, signIn, signInDemo, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
