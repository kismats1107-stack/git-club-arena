import { useEffect, useRef } from 'react'
import { cn } from '../lib/cn'
import { formatDate, isoDay, shortMonth } from '../lib/time'

const WEEKS = 36
const LEVEL_CLASS = ['bg-sunken', 'bg-accent/30', 'bg-accent/60', 'bg-accent']

function level(count: number): number {
  if (count <= 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  return 3
}

/** A GitHub-style contribution grid of the participant's own activity. */
export function ActivityHeatmap({ activity }: { activity: Record<string, number> }) {
  const scroller = useRef<HTMLDivElement>(null)

  // On narrow screens the grid scrolls; start at the most recent weeks.
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])

  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const start = new Date(today)
  start.setDate(start.getDate() - today.getDay() - (WEEKS - 1) * 7)

  const weeks = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = new Date(start)
      date.setDate(start.getDate() + w * 7 + d)
      return { date, count: activity[isoDay(date)] ?? 0, future: date > today }
    }),
  )

  const total = Object.values(activity).reduce((a, b) => a + b, 0)
  const activeDays = Object.keys(activity).length

  return (
    <figure>
      <div ref={scroller} className="overflow-x-auto no-scrollbar">
        <div className="inline-flex flex-col gap-1.5">
          <div className="flex gap-[3px] pl-8 font-mono text-[10px] text-muted" aria-hidden="true">
            {weeks.map((week, i) => {
              const first = week[0].date
              const showMonth = i === 0 || first.getMonth() !== weeks[i - 1][0].date.getMonth()
              return (
                <span key={i} className="w-[13px] overflow-visible whitespace-nowrap">
                  {showMonth ? shortMonth(first) : ''}
                </span>
              )
            })}
          </div>
          <div className="flex gap-[3px]">
            <div className="flex w-7 flex-col gap-[3px] pr-1 font-mono text-[10px] leading-[13px] text-muted" aria-hidden="true">
              {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
                <span key={i} className="h-[13px]">
                  {d}
                </span>
              ))}
            </div>
            {weeks.map((week, w) => (
              <div key={w} className="flex flex-col gap-[3px]">
                {week.map(({ date, count, future }) => (
                  <span
                    key={date.toISOString()}
                    title={future ? undefined : `${count} action${count === 1 ? '' : 's'} on ${formatDate(date)}`}
                    className={cn('h-[13px] w-[13px] rounded-[3px]', future ? 'bg-transparent' : LEVEL_CLASS[level(count)])}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>
          {total} action{total === 1 ? '' : 's'} across {activeDays} day{activeDays === 1 ? '' : 's'}
        </span>
        <span className="inline-flex items-center gap-1" aria-hidden="true">
          Less
          {LEVEL_CLASS.map((c) => (
            <span key={c} className={cn('h-[11px] w-[11px] rounded-[3px]', c)} />
          ))}
          More
        </span>
      </figcaption>
    </figure>
  )
}
