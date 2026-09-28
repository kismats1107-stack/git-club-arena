import { useState } from 'react'
import { cn } from '../lib/cn'

const PALETTE = [
  'bg-[#fde2d8] text-[#8a2b12]',
  'bg-[#dfeafc] text-[#1d4a8a]',
  'bg-[#e3f3e6] text-[#1d5e33]',
  'bg-[#f3e4fa] text-[#6b2a86]',
  'bg-[#fbeecd] text-[#7a4a05]',
  'bg-[#dcf1f0] text-[#115e59]',
]

function hash(text: string): number {
  let h = 0
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

const SIZES = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-16 w-16 text-xl',
}

/** Account photo when there is one (Google/GitHub), otherwise coloured initials. */
export function Avatar({ name, size = 'md', highlight = false, src }: { name: string; size?: keyof typeof SIZES; highlight?: boolean; src?: string | null }) {
  const [broken, setBroken] = useState(false)
  const base = cn('inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold', SIZES[size])
  if (src && !broken) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className={cn(base, 'object-cover', highlight && 'ring-2 ring-accent')}
      />
    )
  }
  return (
    <span aria-hidden="true" className={cn(base, highlight ? 'bg-accent-strong text-on-accent' : PALETTE[hash(name) % PALETTE.length])}>
      {initials(name)}
    </span>
  )
}
