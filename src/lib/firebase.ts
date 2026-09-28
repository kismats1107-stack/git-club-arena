import { initializeApp } from 'firebase/app'
import { GithubAuthProvider, GoogleAuthProvider, getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore/lite'

/*
 * Firebase web config. These values are public identifiers (not secrets) — access is
 * enforced by Firebase Authentication and the Firestore security rules in firestore.rules.
 * Set them in .env.local for development and in the hosting provider for production.
 */
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

/** False until the Firebase environment variables are set; the app then runs in demo mode. */
export const firebaseEnabled = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId)

const app = firebaseEnabled ? initializeApp(config) : null
export const auth: Auth | null = app ? getAuth(app) : null
export const db: Firestore | null = app ? getFirestore(app) : null

export function googleProvider() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return provider
}

export function githubProvider() {
  const provider = new GithubAuthProvider()
  provider.addScope('read:user')
  provider.addScope('user:email')
  return provider
}
