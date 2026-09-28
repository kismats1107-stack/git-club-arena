import type { Participant } from '../data/types'
import { firebaseEnabled } from './firebaseConfig'
import type { ArenaState } from './progress'

/*
 * Cloud storage for signed-in accounts (Firestore):
 *   users/{uid}        private — the full Arena state, readable only by its owner
 *   leaderboard/{uid}  public  — name, year, branch, XP, solved and streak
 * Security rules live in firestore.rules at the project root.
 * The Firestore SDK is imported lazily so it never delays the first paint.
 */

export const cloudEnabled = firebaseEnabled

const loadFirestore = () => Promise.all([import('./firebase'), import('firebase/firestore')])

export interface SavedState {
  state: ArenaState
  savedAt: number
}

export interface PublicEntry {
  name: string
  year: number
  branch: string
  xp: number
  solved: number
  streak: number
  updatedAt: number
}

export async function loadCloudState(uid: string): Promise<SavedState | null> {
  if (!cloudEnabled) return null
  const [{ db }, { doc, getDoc }] = await loadFirestore()
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  const data = snap.data() as { state?: string; savedAt?: number }
  if (!data.state) return null
  return { state: JSON.parse(data.state) as ArenaState, savedAt: data.savedAt ?? 0 }
}

export async function saveCloudState(uid: string, saved: SavedState, entry: PublicEntry | null): Promise<void> {
  if (!cloudEnabled) return
  const [{ db }, { doc, setDoc }] = await loadFirestore()
  // Stored as JSON so nested progress maps never trip Firestore field-name rules.
  const writes: Array<Promise<void>> = [
    setDoc(doc(db, 'users', uid), { state: JSON.stringify({ ...saved.state, climb: null }), savedAt: saved.savedAt }),
  ]
  if (entry) writes.push(setDoc(doc(db, 'leaderboard', uid), entry))
  await Promise.all(writes)
}

function toParticipant(id: string, e: PublicEntry): Participant {
  return {
    id: `live-${id}`,
    name: String(e.name).slice(0, 40),
    year: Math.min(4, Math.max(1, Number(e.year) || 1)) as Participant['year'],
    branch: e.branch as Participant['branch'],
    xp: Number(e.xp) || 0,
    solved: Number(e.solved) || 0,
    streak: Number(e.streak) || 0,
    live: true,
  }
}

/**
 * Real builders on the board, live: the callback fires once with the current top 50
 * and again whenever anyone's score changes. Returns an unsubscribe function.
 */
export function subscribeCommunity(
  excludeUid: string | undefined,
  onChange: (people: Participant[]) => void,
  onError: () => void,
): () => void {
  if (!cloudEnabled) return () => undefined
  let stopped = false
  let unsubscribe: (() => void) | undefined
  loadFirestore()
    .then(([{ db }, { collection, limit, onSnapshot, orderBy, query }]) => {
      if (stopped) return
      unsubscribe = onSnapshot(
        query(collection(db, 'leaderboard'), orderBy('xp', 'desc'), limit(50)),
        (snap) =>
          onChange(
            snap.docs
              .filter((d) => d.id !== excludeUid)
              .map((d) => toParticipant(d.id, d.data() as PublicEntry))
              .filter((p) => p.xp > 0),
          ),
        onError,
      )
    })
    .catch(onError)
  return () => {
    stopped = true
    unsubscribe?.()
  }
}
