import { GITHUB_REPO_URL } from '../config'
import { CATEGORIES } from '../data/challenges'

/** A pre-filled GitHub issue: club members propose challenges the same way they propose code. */
export function proposeChallengeUrl(): string {
  const body = [
    '## Challenge title',
    '',
    `## Category (${CATEGORIES.join(' / ')})`,
    '',
    '## Difficulty (Easy / Medium / Hard)',
    '',
    '## What will participants build?',
    '',
    '## Requirements (and how each one could be checked automatically)',
    '- ',
    '',
    '## Suggested points and duration',
    '',
  ].join('\n')
  const params = new URLSearchParams({ title: 'Challenge proposal: ', body, labels: 'challenge-proposal' })
  return `${GITHUB_REPO_URL}/issues/new?${params.toString()}`
}

/** "⌘K" on Apple devices, "Ctrl K" elsewhere. */
export function shortcutLabel(key: string): string {
  const apple = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)
  return apple ? `⌘${key}` : `Ctrl ${key}`
}
