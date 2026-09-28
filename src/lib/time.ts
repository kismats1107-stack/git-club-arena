export const SECOND = 1000
export const MINUTE = 60 * SECOND
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

// Hand-rolled so every browser prints the same format ("Tue, 30 Sep · 11:59 PM").
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * A date relative to today. Sample data uses this so "active" challenges stay
 * active no matter which day an evaluator opens the site.
 */
export function dayOffset(days: number, hour: number, minute = 0): Date {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + days)
  date.setHours(hour, minute, 0, 0)
  return date
}

export function formatTime(date: Date): string {
  const hours = date.getHours()
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const h12 = hours % 12 === 0 ? 12 : hours % 12
  return `${h12}:${String(date.getMinutes()).padStart(2, '0')} ${suffix}`
}

export function formatDate(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`
}

export function formatDateTime(date: Date): string {
  return `${formatDate(date)} · ${formatTime(date)}`
}

export function shortMonth(date: Date): string {
  return MONTHS[date.getMonth()]
}

export function splitDuration(ms: number) {
  const total = Math.max(0, ms)
  return {
    days: Math.floor(total / DAY),
    hours: Math.floor((total % DAY) / HOUR),
    minutes: Math.floor((total % HOUR) / MINUTE),
    seconds: Math.floor((total % MINUTE) / SECOND),
  }
}

/** Compact duration: "2d 4h", "5h 12m", "18m". */
export function formatDuration(ms: number): string {
  const { days, hours, minutes } = splitDuration(ms)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${Math.max(1, minutes)}m`
}

export function relativeAgo(date: Date, now = Date.now()): string {
  const diff = now - date.getTime()
  if (diff < MINUTE) return 'just now'
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR)
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }
  const days = Math.floor(diff / DAY)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return formatDate(date)
}

/** Local calendar day as YYYY-MM-DD. */
export function isoDay(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
