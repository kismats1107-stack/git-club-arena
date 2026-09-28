export const SITE_NAME = 'Git Club Arena'

/**
 * Public GitHub repository for this site.
 * Powers "Propose a challenge" (opens a pre-filled GitHub issue) and "View source".
 * Links that depend on it stay hidden while it is empty, so nothing ships broken.
 */
export const GITHUB_REPO_URL = 'https://github.com/kismats1107-stack/git-club-arena'

/** Share of a challenge's points a submission must earn to be approved and merged. */
export const PASS_MARK = 0.7

/** Submitting this long before the deadline earns the early-push bonus. */
export const EARLY_PUSH_WINDOW_MS = 24 * 60 * 60 * 1000
export const EARLY_PUSH_BONUS = 20
