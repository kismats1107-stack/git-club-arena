import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'gitclub-theme'
const listeners = new Set<() => void>()

function current(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

/** Applies a theme, remembers the choice and keeps the browser UI colour in sync. */
export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#13110e' : '#faf8f4')
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage blocked: the theme still applies for this visit.
  }
  listeners.forEach((notify) => notify())
}

export function toggleTheme() {
  setTheme(current() === 'dark' ? 'light' : 'dark')
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify)
      return () => listeners.delete(notify)
    },
    current,
    () => 'light',
  )
}
