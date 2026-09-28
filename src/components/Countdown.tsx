import { useNow } from '../hooks/useNow'
import { cn } from '../lib/cn'
import { splitDuration } from '../lib/time'

export function Countdown({ target, label, urgent }: { target: Date; label: string; urgent?: boolean }) {
  const now = useNow(1000)
  const { days, hours, minutes, seconds } = splitDuration(target.getTime() - now)
  const units: Array<[string, number]> = [
    ['days', days],
    ['hrs', hours],
    ['min', minutes],
    ['sec', seconds],
  ]
  return (
    <div role="timer" aria-label={`${label}: ${days} days, ${hours} hours, ${minutes} minutes`}>
      <div className="grid grid-cols-4 gap-2">
        {units.map(([unit, value]) => (
          <div key={unit} className={cn('rounded-xl px-1 py-2.5 text-center', urgent ? 'bg-hard-soft' : 'bg-sunken')}>
            <div className={cn('font-mono text-2xl font-semibold tabular-nums leading-none', urgent && 'text-hard')}>
              {String(value).padStart(2, '0')}
            </div>
            <div className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted">{unit}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
