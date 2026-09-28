import { collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc } from 'firebase/firestore/lite'
import type { Participant } from '../data/types'
import { db } from './firebase'
import type { ArenaState } from './progress'

/*
 * Cloud storage for signed-in accounts (Firestore):
 *   users/{uid}        private — the full Arena state, readable only by its owner
 *   leaderboard/{uid}  public  — name, year, branch, XP, solved and streak
 * Security rules live in firestore.rules at the project root.
 */

export const cloudEnabled = Boolean(db)

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
  if (!db) return null
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  const data = snap.data() as { state?: string; savedAt?: number }
  if (!data.state) return null
  return { state: JSON.parse(data.state) as ArenaState, savedAt: data.savedAt ?? 0 }
}

export async function saveCloudState(uid: string, saved: SavedState, entry: PublicEntry | null): Promise<void> {
  if (!db) return
  // Stored as JSON so nested progress maps never trip Firestore field-name rules.
  const writes: Array<Promise<void>> = [
    setDoc(doc(db, 'users', uid), { state: JSON.stringify({ ...saved.state, climb: null }), savedAt: saved.savedAt }),
  ]
  if (entry) writes.push(setDoc(doc(db, 'leaderboard', uid), entry))
  await Promise.all(writes)
}

/** Real builders on the board, shaped like the seeded participants. */
export async function loadCommunity(excludeUid?: string): Promise<Participant[]> {
  if (!db) return []
  const snap = await getDocs(query(collection(db, 'leaderboard'), orderBy('xp', 'desc'), limit(50)))
  return snap.docs
    .filter((d) => d.id !== excludeUid)
    .map((d) => {
      const e = d.data() as PublicEntry
      return {
        id: `live-${d.id}`,
        name: String(e.name).slice(0, 40),
        year: (Math.min(4, Math.max(1, Number(e.year) || 1)) as Participant['year']),
        branch: e.branch as Participant['branch'],
        xp: Number(e.xp) || 0,
        solved: Number(e.solved) || 0,
        streak: Number(e.streak) || 0,
        live: true,
      }
    })
    .filter((p) => p.xp > 0)
}
