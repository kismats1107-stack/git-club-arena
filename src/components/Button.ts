import { cn } from '../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent-strong text-on-accent shadow-[0_1px_0_rgb(255_255_255/0.25)_inset,0_1px_2px_rgb(23_21_15/0.2)] hover:bg-accent-deep',
  secondary: 'border border-line-strong bg-surface text-ink hover:border-ink/30 hover:bg-sunken',
  ghost: 'text-ink-soft hover:bg-sunken hover:text-ink',
  dark: 'bg-ink text-paper hover:bg-ink-soft',
}

const SIZES: Record<Size, string> = {
  // 40px on touch screens, 36px where a precise pointer is available
  sm: 'h-10 sm:h-9 px-3.5 text-sm rounded-lg',
  md: 'h-11 px-5 text-sm rounded-xl',
  lg: 'h-12 px-6 text-[15px] rounded-xl',
}

/** Shared button styling so <button> and <Link> actions look identical. */
export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra?: string): string {
  return cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
    VARIANTS[variant],
    SIZES[size],
    extra,
  )
}
