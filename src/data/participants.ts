import type { Branch, Participant, Year } from './types'

export const BRANCHES: Branch[] = ['CE', 'CSE', 'IT', 'AIML', 'EC', 'EE', 'ME', 'CL']
export const YEARS: Year[] = [1, 2, 3, 4]

export function yearLabel(year: Year): string {
  return ['1st', '2nd', '3rd', '4th'][year - 1] + ' year'
}

/** Season standings for everyone who has earned XP so far. */
export const PARTICIPANTS: Participant[] = [
  { id: 'dhruvi-shah', name: 'Dhruvi Shah', year: 3, branch: 'CE', xp: 1480, solved: 11, streak: 14 },
  { id: 'aarav-patel', name: 'Aarav Patel', year: 4, branch: 'IT', xp: 1335, solved: 10, streak: 9 },
  { id: 'krisha-mehta', name: 'Krisha Mehta', year: 3, branch: 'CSE', xp: 1190, solved: 9, streak: 21 },
  { id: 'het-desai', name: 'Het Desai', year: 2, branch: 'CE', xp: 1015, solved: 8, streak: 6 },
  { id: 'yash-parmar', name: 'Yash Parmar', year: 4, branch: 'AIML', xp: 890, solved: 6, streak: 3 },
  { id: 'nidhi-joshi', name: 'Nidhi Joshi', year: 2, branch: 'IT', xp: 760, solved: 6, streak: 11 },
  { id: 'parth-solanki', name: 'Parth Solanki', year: 3, branch: 'CE', xp: 655, solved: 5, streak: 2 },
  { id: 'riya-trivedi', name: 'Riya Trivedi', year: 1, branch: 'CSE', xp: 560, solved: 5, streak: 8 },
  { id: 'jay-chauhan', name: 'Jay Chauhan', year: 2, branch: 'AIML', xp: 475, solved: 4, streak: 0 },
  { id: 'khushi-panchal', name: 'Khushi Panchal', year: 1, branch: 'CE', xp: 400, solved: 4, streak: 5 },
  { id: 'meet-prajapati', name: 'Meet Prajapati', year: 3, branch: 'IT', xp: 330, solved: 3, streak: 1 },
  { id: 'vrunda-bhatt', name: 'Vrunda Bhatt', year: 1, branch: 'CE', xp: 265, solved: 3, streak: 4 },
  { id: 'om-rathod', name: 'Om Rathod', year: 2, branch: 'CSE', xp: 210, solved: 2, streak: 0 },
  { id: 'hetvi-modi', name: 'Hetvi Modi', year: 1, branch: 'IT', xp: 170, solved: 2, streak: 2 },
  { id: 'dev-thakkar', name: 'Dev Thakkar', year: 1, branch: 'AIML', xp: 140, solved: 1, streak: 1 },
  { id: 'isha-vyas', name: 'Isha Vyas', year: 2, branch: 'CE', xp: 115, solved: 1, streak: 0 },
  { id: 'harsh-makwana', name: 'Harsh Makwana', year: 1, branch: 'CSE', xp: 90, solved: 1, streak: 1 },
]

export function getParticipant(id: string): Participant | undefined {
  return PARTICIPANTS.find((p) => p.id === id)
}
