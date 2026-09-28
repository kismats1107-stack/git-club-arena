/*
 * Firebase web config. These values are public identifiers (not secrets) — access is
 * enforced by Firebase Authentication and the Firestore security rules in firestore.rules.
 * Set them in .env.local for development and in the hosting provider for production.
 *
 * Kept free of Firebase imports so the SDK itself can load lazily (see lib/firebase.ts).
 */
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

/** False until the Firebase environment variables are set; the app then runs in demo mode. */
export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId)
