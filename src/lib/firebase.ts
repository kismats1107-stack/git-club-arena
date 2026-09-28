import { initializeApp } from 'firebase/app'
import { GithubAuthProvider, GoogleAuthProvider, getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { firebaseConfig } from './firebaseConfig'

/*
 * The Firebase SDK is heavy, so this module is only ever loaded with a dynamic
 * import() — the landing page renders first and Firebase arrives a moment later.
 * Call loadFirebase() only when firebaseEnabled is true.
 */
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

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
