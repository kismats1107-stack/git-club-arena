import type { Challenge } from '../data/types'
import { HOUR } from './time'

export interface CalendarEvent {
  uid: string
  title: string
  description: string
  start: Date
  end: Date
  url: string
}

/** Upcoming challenges get a reminder for the opening; live ones get the deadline. */
export function calendarEventFor(challenge: Challenge, kind: 'opens' | 'deadline'): CalendarEvent {
  const url = `${window.location.origin}/challenges/${challenge.slug}`
  const description = `${challenge.tagline}\n\n${challenge.points} XP · ${challenge.difficulty} · ${challenge.category}\n${url}`
  if (kind === 'opens') {
    return {
      uid: `${challenge.slug}-opens@gitclub-arena`,
      title: `Opens: ${challenge.title} · Git Club Arena`,
      description,
      start: challenge.opensAt,
      end: new Date(challenge.opensAt.getTime() + HOUR),
      url,
    }
  }
  return {
    uid: `${challenge.slug}-deadline@gitclub-arena`,
    title: `Deadline: ${challenge.title} · Git Club Arena`,
    description,
    start: new Date(challenge.closesAt.getTime() - HOUR),
    end: challenge.closesAt,
    url,
  }
}

function stamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

/** RFC 5545 asks for lines of at most 75 octets; fold conservatively by characters. */
function fold(line: string): string {
  const parts: string[] = []
  for (let i = 0; i < line.length; i += 60) parts.push(line.slice(i, i + 60))
  return parts.join('\r\n ')
}

export function downloadIcs(event: CalendarEvent, filename: string): void {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Git Club CHARUSAT//Arena//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(event.start)}`,
    `DTEND:${stamp(event.end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `URL:${event.url}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(event.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].map(fold)

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const href = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(href), 1000)
}

export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${stamp(event.start)}/${stamp(event.end)}`,
    details: event.description,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
