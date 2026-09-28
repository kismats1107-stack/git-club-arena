import type { Branch, Year } from '../data/types'

/** Any address on the CHARUSAT domain: 25cs099@charusat.edu.in, name@dept.charusat.edu.in … */
const COLLEGE_EMAIL = /^[a-z0-9._%+-]+@(?:[a-z0-9-]+\.)*charusat\.edu\.in$/i

export function isCollegeEmail(email: string): boolean {
  return COLLEGE_EMAIL.test(email.trim())
}

const BRANCH_CODES: Record<string, Branch> = {
  ce: 'CE',
  cs: 'CSE',
  cse: 'CSE',
  it: 'IT',
  ai: 'AIML',
  aiml: 'AIML',
  ec: 'EC',
  ee: 'EE',
  me: 'ME',
  cl: 'CL',
}

export interface CollegeId {
  id: string
  year?: Year
  branch?: Branch
}

/**
 * Student IDs encode the admission year and branch: 25CS099 → admitted 2025, CSE.
 * D2D (lateral entry) IDs start with "d" and join straight into the second year.
 * The academic year turns over in July.
 */
export function parseCollegeId(email: string, today = new Date()): CollegeId | null {
  if (!isCollegeEmail(email)) return null
  const local = email.trim().split('@')[0].toLowerCase()
  const match = local.match(/^(d?)(\d{2})([a-z]{2,4})(\d{2,4})$/)
  if (!match) return null
  const [, lateral, yy, code, roll] = match
  const academicStart = today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1
  const year = academicStart - (2000 + Number(yy)) + 1 + (lateral ? 1 : 0)
  return {
    id: `${lateral.toUpperCase()}${yy}${code.toUpperCase()}${roll}`,
    year: year >= 1 && year <= 4 ? (year as Year) : undefined,
    branch: BRANCH_CODES[code],
  }
}
