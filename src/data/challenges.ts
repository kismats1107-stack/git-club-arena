import { dayOffset } from '../lib/time'
import type { Category, Challenge, Difficulty } from './types'

export const CATEGORIES: Category[] = ['Web', 'Git', 'DSA', 'Design', 'Backend', 'AI/ML', 'Open Source', 'Creative']
export const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard']

/* ---------- File groups used by the automated review ---------- */

/** Common source and text files, plus extension-less files such as README or Makefile. */
const TEXT_FILES = /\.(md|txt|html?|css|scss|js|jsx|mjs|ts|tsx|json|py|java|c|cc|cpp|h|go|rb|php|vue|svelte|astro|yml|yaml)$|(^|\/)[^/.]+$/i
const MARKUP = /\.(html?|jsx|tsx|vue|svelte|astro)$/i
const MARKUP_AND_STYLES = /\.(html?|css|scss|jsx|tsx|vue|svelte|astro)$/i
const SOLUTIONS = /\.(c|cc|cpp|java|py|js|ts|go|kt)$/i
const SERVER_CODE = /\.(js|mjs|ts|py|go|java|rb|php|cs|rs|kt)$/i
const NOTEBOOKS = /\.(ipynb|py)$/i
const NOTEBOOKS_AND_DOCS = /\.(ipynb|py|md)$/i
const IMAGES = /\.(png|jpe?g|webp|gif)$/i
const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)]|#{2,4})\s+\S/gm
const LIVE_LINK = /https?:\/\/(?!(?:www\.)?github\.com|raw\.githubusercontent\.com|img\.shields\.io)[^\s)"'<>\]]+/gi
const IMAGE_EMBED = /!\[[^\]]*\]\([^)]+\)|<img\s/gi
const CONVENTIONAL = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([\w./-]+\))?!?: \S/i

type Seed = Omit<Challenge, 'opensAt' | 'closesAt'> & {
  /** [days from today, hour] */
  opens: [number, number]
  closes: [number, number]
}

const SEEDS: Seed[] = [
  {
    slug: 'resolve-the-merge-conflict',
    title: 'Resolve the Merge Conflict',
    tagline: 'Create a real merge conflict on purpose, then resolve it so that both features survive.',
    category: 'Git',
    difficulty: 'Easy',
    points: 100,
    opens: [-4, 10],
    closes: [2, 23],
    estimatedTime: '45–60 min',
    host: 'Git Club Core Team',
    participants: 64,
    problem: [
      'In real teams, two people often change the same lines of the same file. Git cannot decide whose version wins, so it stops the merge and asks you.',
      'Recreate that moment deliberately. Build a tiny project — a club events page is perfect — create two feature branches that edit the same lines, merge both into main and resolve the conflict so that both features still work.',
    ],
    requirements: [
      {
        title: 'Merge commit on main',
        text: 'Create two feature branches that edit the same lines, then merge them into main',
        how: 'Looks for a merge commit (a commit with two parents) on your default branch',
        rule: { kind: 'mergeCommit' },
      },
      {
        title: 'No conflict markers left',
        text: 'Resolve every conflict — no conflict markers left in any file',
        how: 'Scans every text file for leftover <<<<<<<, ======= and >>>>>>> lines',
        rule: { kind: 'noContent', path: TEXT_FILES, pattern: /^(<{7}|={7}|>{7})(\s|$)/m, label: 'conflict markers' },
      },
      {
        title: 'Merge message explains the fix',
        text: 'Write a merge commit message that explains how you resolved the conflict',
        how: 'The merge commit has at least 30 characters of explanation beyond Git’s default “Merge branch …” line',
        rule: { kind: 'mergeMessage', minLength: 30 },
      },
      {
        title: 'CONFLICTS.md',
        text: 'Add CONFLICTS.md describing each conflict and the decision you made',
        how: 'CONFLICTS.md exists and is at least 150 bytes long',
        rule: { kind: 'file', path: /(^|\/)conflicts\.md$/i, label: 'CONFLICTS.md', minBytes: 150 },
      },
      {
        title: 'Readable history',
        text: 'Keep a readable history of at least four commits',
        how: 'Counts commits pushed since the challenge opened',
        rule: { kind: 'commits', min: 4 },
      },
    ],
    rules: [
      'Do not delete either branch’s changes just to make a conflict disappear',
      'Merge with git merge — a rebase or fast-forward leaves no merge commit to review',
      'Discuss ideas freely, but write your own resolution',
    ],
    skills: ['git merge', 'git diff', 'Conflict resolution'],
    resources: [
      { label: 'Pro Git — Basic branching and merging', url: 'https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging' },
    ],
  },
  {
    slug: 'two-pointers-sprint',
    title: 'Two Pointers Sprint',
    tagline: 'Five classic array problems, one technique. Solve them in any language and explain your complexity.',
    category: 'DSA',
    difficulty: 'Easy',
    points: 100,
    opens: [-5, 9],
    closes: [1, 12],
    estimatedTime: '1–2 hours',
    host: 'Git Club DSA Circle',
    participants: 88,
    problem: [
      'The two-pointer technique turns many O(n²) brute-force solutions into clean O(n) ones. Solve five problems that build on each other: reverse a string in place, check for a palindrome, remove duplicates from a sorted array, find a pair with a target sum in a sorted array, and find every triplet that sums to zero.',
      'The goal is not just a passing answer. Reviewers look for a clear explanation of why the pointers move the way they do.',
    ],
    requirements: [
      {
        title: 'Five solution files',
        text: 'Solve all five problems — one file per problem, in C++, Java, Python or JavaScript',
        how: 'Counts solution files (.cpp, .java, .py, .js, .ts) — five or more',
        rule: { kind: 'files', path: SOLUTIONS, label: 'solution files', min: 5 },
      },
      {
        title: 'Complexity in every file',
        text: 'State the time and space complexity at the top of each file',
        how: 'Every solution file mentions Big-O at least twice — for example O(n) time, O(1) space',
        rule: { kind: 'eachFile', path: SOLUTIONS, scope: 'solution files', pattern: /O\(\s*[^()\n]{1,15}\)/g, label: 'Complexity notes', min: 2 },
      },
      {
        title: 'Three tests per problem',
        text: 'Include at least three test cases per problem',
        how: 'Every solution file has three or more assert, print or console.log calls',
        rule: {
          kind: 'eachFile',
          path: SOLUTIONS,
          scope: 'solution files',
          pattern: /\b(assert\w*|expect|print(?:ln|f)?|console\.log|cout|System\.out)\b/g,
          label: 'Three or more test calls',
          min: 3,
        },
      },
      {
        title: 'README lists the problems',
        text: 'A README that lists each problem and your approach',
        how: 'README has at least five list items or headings',
        rule: { kind: 'readme', checks: [{ pattern: LIST_ITEM, label: 'five listed problems', min: 5 }] },
      },
    ],
    rules: ['Standard library only — no external packages', 'Solutions copied from editorial sites will not be counted'],
    skills: ['Arrays', 'Two pointers', 'Complexity analysis'],
    resources: [{ label: 'Visualgo — array and sorting visualisations', url: 'https://visualgo.net/en' }],
  },
  {
    slug: 'club-landing-page-in-90-minutes',
    title: 'Club Landing Page in 90 Minutes',
    tagline: 'Design and ship a responsive one-page site for a college club — from an empty folder to a live URL.',
    category: 'Web',
    difficulty: 'Medium',
    points: 200,
    opens: [-3, 18],
    closes: [5, 23],
    estimatedTime: '90 min focus block',
    host: 'Git Club Web Team',
    participants: 57,
    problem: [
      'In hackathons, speed matters — and so does finishing. Pick a CHARUSAT club (a robotics club, a photography society, a chess circle) and build its landing page within one 90-minute focus block.',
      'The goal is a page that is clear, responsive and live, not one that is perfect. A visitor should understand what the club does and how to join within five seconds.',
    ],
    requirements: [
      {
        title: 'Hero heading',
        text: 'A hero section with a heading that says what the club is',
        how: 'Finds an <h1> in your HTML or components',
        rule: { kind: 'content', path: MARKUP, scope: 'HTML and component files', checks: [{ pattern: /<h1[\s>]/gi, label: '<h1> heading' }] },
      },
      {
        title: 'Three sections',
        text: 'At least three sections: about, upcoming activity and how to join',
        how: 'Counts <section> elements across your pages — three or more',
        rule: {
          kind: 'content',
          path: MARKUP,
          scope: 'HTML and component files',
          checks: [{ pattern: /<section[\s>]/gi, label: '<section> elements', min: 3 }],
        },
      },
      {
        title: 'Responsive setup',
        text: 'Fully responsive from 360px to 1440px wide',
        how: 'Looks for a viewport meta tag and responsive CSS (media queries, flex/grid or sm:/md: classes)',
        rule: {
          kind: 'content',
          path: MARKUP_AND_STYLES,
          scope: 'HTML, CSS and component files',
          checks: [
            { pattern: /name=["']viewport["']/gi, label: 'viewport meta tag' },
            { pattern: /@media|\b(?:sm|md|lg|xl):[a-z]|display:\s*(?:grid|flex)|\bgrid-cols-|\bflex\b/gi, label: 'responsive CSS' },
          ],
        },
      },
      {
        title: 'Live URL responds',
        text: 'Deployed to a public URL (Vercel, Netlify or GitHub Pages)',
        how: 'Pings your live link — taken from the form, the repository’s website field or the README',
        rule: { kind: 'liveUrl' },
      },
      {
        title: 'README link + screenshot',
        text: 'A README with the live link and at least one screenshot',
        how: 'README contains a non-GitHub link and an embedded image',
        rule: {
          kind: 'readme',
          checks: [
            { pattern: LIVE_LINK, label: 'live link' },
            { pattern: IMAGE_EMBED, label: 'screenshot' },
          ],
        },
      },
      {
        title: 'Commits while building',
        text: 'Commit at least three times while you build',
        how: 'Counts commits pushed since the challenge opened',
        rule: { kind: 'commits', min: 3 },
      },
    ],
    rules: [
      'Any framework, or plain HTML and CSS, is allowed',
      'AI assistants are allowed — mention in your README how you used them',
      'Commit as you go so reviewers can follow your process',
    ],
    skills: ['HTML', 'CSS', 'Responsive design', 'Deployment'],
    resources: [
      { label: 'MDN — Responsive design', url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design' },
    ],
  },
  {
    slug: 'redesign-the-timetable-screen',
    title: 'Redesign the Timetable Screen',
    tagline: 'Students check their timetable five times a day. Make it answer “where do I need to be next?” at a glance.',
    category: 'Design',
    difficulty: 'Medium',
    points: 150,
    opens: [-2, 10],
    closes: [6, 23],
    estimatedTime: '3–4 hours',
    host: 'Git Club Design Team',
    participants: 41,
    problem: [
      'Most timetable screens show a dense weekly grid, even though students usually want one answer: what is my next lecture, and where is it?',
      'Redesign the daily timetable view of a student app for mobile. Focus on hierarchy, readability and the moments that matter — a lab moved to another room, a free period, a cancelled lecture.',
    ],
    requirements: [
      {
        title: 'Three exported screens',
        text: 'Export at least three mobile screens (390 × 844) as images and push them',
        how: 'Counts PNG, JPG or WebP files in the repository — three or more',
        rule: { kind: 'files', path: IMAGES, label: 'exported screens', min: 3 },
      },
      {
        title: 'Key states covered',
        text: 'Design the “next up” state and two edge cases: a cancelled lecture and a room change',
        how: 'README describes the next-up, cancelled-lecture and room-change screens',
        rule: {
          kind: 'readme',
          checks: [
            { pattern: /next[\s-]?up/gi, label: 'next-up state' },
            { pattern: /cancel/gi, label: 'cancelled lecture' },
            { pattern: /room/gi, label: 'room change' },
          ],
        },
      },
      {
        title: 'Design file linked',
        text: 'Link your Figma or Penpot file in the README',
        how: 'README contains a figma.com or penpot.app link',
        rule: { kind: 'readme', checks: [{ pattern: /figma\.com|penpot\.app/gi, label: 'Figma or Penpot link' }] },
      },
      {
        title: 'Three design decisions',
        text: 'Explain three design decisions in the README',
        how: 'README has at least three list items or headings',
        rule: { kind: 'readme', checks: [{ pattern: LIST_ITEM, label: 'listed decisions', min: 3 }] },
      },
    ],
    rules: ['Use Figma, Penpot or any design tool you like', 'References are fine; copying an existing app screen-for-screen is not'],
    skills: ['UI design', 'Information hierarchy', 'Figma'],
    resources: [{ label: 'Laws of UX', url: 'https://lawsofux.com/' }],
  },
  {
    slug: 'spam-or-not-tiny-classifier',
    title: 'Spam or Not? Build a Tiny Classifier',
    tagline: 'Train a simple model that flags spam messages, then explain exactly where it gets things wrong.',
    category: 'AI/ML',
    difficulty: 'Medium',
    points: 200,
    opens: [-6, 17],
    closes: [3, 23],
    estimatedTime: '3–5 hours',
    host: 'Git Club AI/ML Team',
    participants: 49,
    problem: [
      'Every student group chat has seen the “Congratulations, you have won…” message. Using the public SMS Spam Collection dataset, train a classifier that separates spam from normal messages.',
      'Accuracy alone is not the point. The strongest submissions study the mistakes: which real messages get flagged, which spam slips through, and why.',
    ],
    requirements: [
      {
        title: 'Train/test split',
        text: 'Clean the dataset and split it into training and test sets',
        how: 'Finds train_test_split or a test_size in your code or notebook',
        rule: { kind: 'content', path: NOTEBOOKS, scope: 'notebooks and Python files', checks: [{ pattern: /train_test_split|test_size/gi, label: 'train/test split' }] },
      },
      {
        title: 'Model trained',
        text: 'Train at least one model — Naive Bayes or logistic regression is enough',
        how: 'Finds a model .fit( call',
        rule: { kind: 'content', path: NOTEBOOKS, scope: 'notebooks and Python files', checks: [{ pattern: /\.fit\(/g, label: 'model.fit(…) call' }] },
      },
      {
        title: 'Evaluation metrics',
        text: 'Report precision, recall and a confusion matrix',
        how: 'Finds precision, recall and a confusion matrix in your code, notebook or README',
        rule: {
          kind: 'content',
          path: NOTEBOOKS_AND_DOCS,
          scope: 'notebooks, Python and Markdown files',
          checks: [
            { pattern: /precision/gi, label: 'precision' },
            { pattern: /recall/gi, label: 'recall' },
            { pattern: /confusion/gi, label: 'confusion matrix' },
          ],
        },
      },
      {
        title: 'Error analysis',
        text: 'Show five misclassified messages and explain why the model failed on each',
        how: 'Finds a discussion of misclassified messages, false positives or false negatives',
        rule: {
          kind: 'content',
          path: NOTEBOOKS_AND_DOCS,
          scope: 'notebooks, Python and Markdown files',
          checks: [{ pattern: /misclassif|false (?:positive|negative)/gi, label: 'error analysis' }],
        },
      },
    ],
    rules: ['Python with scikit-learn, or any equivalent library', 'Notebooks are welcome — make sure they run from top to bottom'],
    skills: ['Python', 'scikit-learn', 'Model evaluation'],
    resources: [{ label: 'UCI — SMS Spam Collection dataset', url: 'https://archive.ics.uci.edu/dataset/228/sms+spam+collection' }],
  },
  {
    slug: 'rate-limited-url-shortener',
    title: 'Rate-Limited URL Shortener API',
    tagline: 'Build a small REST API that shortens links, counts clicks and stops a single client from flooding it.',
    category: 'Backend',
    difficulty: 'Hard',
    points: 300,
    opens: [-1, 10],
    closes: [9, 23],
    estimatedTime: '6–8 hours',
    host: 'Git Club Web Team',
    participants: 33,
    problem: [
      'URL shorteners look simple until real traffic arrives. Build an API that creates short codes, redirects visitors, records click counts and applies a per-IP rate limit.',
      'You will be reviewed on correctness, code structure and how gracefully you handle abuse — duplicate URLs, invalid input and clients that ignore your limits.',
    ],
    requirements: [
      {
        title: 'POST /shorten',
        text: 'POST /shorten returns a unique short code for a valid URL',
        how: 'Finds a /shorten route in your server code',
        rule: { kind: 'content', path: SERVER_CODE, scope: 'server files', checks: [{ pattern: /['"`]\/shorten/g, label: '/shorten route' }] },
      },
      {
        title: 'Redirect + click count',
        text: 'GET /:code redirects and increments the click count',
        how: 'Finds a redirect and a click counter in your server code',
        rule: {
          kind: 'content',
          path: SERVER_CODE,
          scope: 'server files',
          checks: [
            { pattern: /redirect/gi, label: 'redirect' },
            { pattern: /click/gi, label: 'click counter' },
          ],
        },
      },
      {
        title: 'GET /stats',
        text: 'GET /stats/:code returns the click count and creation date',
        how: 'Finds a /stats route in your server code',
        rule: { kind: 'content', path: SERVER_CODE, scope: 'server files', checks: [{ pattern: /['"`]\/stats/g, label: '/stats route' }] },
      },
      {
        title: 'Rate limit + 429',
        text: 'Limit each IP to 10 requests per minute, answered with a proper 429 response',
        how: 'Finds rate-limiting logic and a 429 status in your server code',
        rule: {
          kind: 'content',
          path: SERVER_CODE,
          scope: 'server files',
          checks: [
            { pattern: /rate.?limit/gi, label: 'rate limiter' },
            { pattern: /429|too many requests/gi, label: '429 response' },
          ],
        },
      },
      {
        title: 'Automated test',
        text: 'Include at least one automated test',
        how: 'Finds a test file such as *.test.js, test_*.py or a tests/ folder',
        rule: {
          kind: 'files',
          path: /(^|\/)(tests?|__tests__|spec)\/|\.(test|spec)\.[jt]sx?$|(^|\/)test_[^/]+\.py$|_test\.go$/i,
          label: 'test files',
          min: 1,
        },
      },
      {
        title: 'README setup + examples',
        text: 'A README with setup steps and example requests',
        how: 'README has an install or run command and an example request',
        rule: {
          kind: 'readme',
          checks: [
            { pattern: /npm (?:i|install|run|start)|pip install|docker|go run|cargo run|uvicorn|flask run/gi, label: 'setup command' },
            { pattern: /curl |POST |GET /g, label: 'example request' },
          ],
        },
      },
    ],
    rules: [
      'Any backend language or framework',
      'In-memory storage is acceptable; a real database earns a mention in the review',
      'Keep secrets out of the repository',
    ],
    skills: ['REST APIs', 'Rate limiting', 'Testing'],
    resources: [{ label: 'MDN — HTTP 429 Too Many Requests', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429' }],
  },
  {
    slug: 'first-pull-request-week',
    title: 'First Pull Request Week',
    tagline: 'Find a beginner-friendly issue in a real open-source project and open your first pull request.',
    category: 'Open Source',
    difficulty: 'Easy',
    points: 120,
    opens: [3, 10],
    closes: [10, 23],
    estimatedTime: 'A few evenings',
    host: 'Git Club Open Source Team',
    participants: 72,
    problem: [
      'Open source feels intimidating until you have done it once. During this week, mentors from the core team help you pick a “good first issue”, set the project up locally and open a pull request that maintainers can review.',
    ],
    requirements: [
      {
        title: 'Issue linked',
        text: 'Pick an issue labelled “good first issue” in any public repository',
        how: 'Your README links to the GitHub issue you picked',
        rule: { kind: 'readme', checks: [{ pattern: /github\.com\/[^/\s]+\/[^/\s]+\/issues\/\d+/gi, label: 'issue link' }] },
      },
      {
        title: 'Pull request linked',
        text: 'Open a pull request that follows the project’s contribution guide',
        how: 'Your README links to your pull request',
        rule: { kind: 'readme', checks: [{ pattern: /github\.com\/[^/\s]+\/[^/\s]+\/pull\/\d+/gi, label: 'pull request link' }] },
      },
      {
        title: 'What you learned',
        text: 'Write down three things you learned from the maintainers’ review',
        how: 'README has at least three list items or headings',
        rule: { kind: 'readme', checks: [{ pattern: LIST_ITEM, label: 'listed learnings', min: 3 }] },
      },
    ],
    rules: [
      'Comment on the issue before you start working on it',
      'Documentation and typo fixes count, but low-effort spam PRs are disqualified',
      'The pull request must be opened during the challenge week',
    ],
    skills: ['Open source', 'GitHub flow', 'Communication'],
    resources: [
      { label: 'GitHub Docs — Contributing to a project', url: 'https://docs.github.com/en/get-started/exploring-projects-on-github/contributing-to-a-project' },
    ],
  },
  {
    slug: 'accessibility-audit-fix-ten',
    title: 'Accessibility Audit: Fix 10 Issues',
    tagline: 'Audit a website, fix ten real accessibility problems and prove it with before-and-after scores.',
    category: 'Web',
    difficulty: 'Medium',
    points: 180,
    opens: [7, 10],
    closes: [14, 23],
    estimatedTime: '3–4 hours',
    host: 'Git Club Web Team',
    participants: 29,
    problem: [
      'One in six people lives with some form of disability, yet most student projects are never tested with a keyboard or a screen reader. Take one of your own past projects and make it usable for everyone.',
    ],
    requirements: [
      {
        title: 'Baseline recorded',
        text: 'Run Lighthouse and axe and record the baseline in your README',
        how: 'README mentions both Lighthouse and axe',
        rule: {
          kind: 'readme',
          checks: [
            { pattern: /lighthouse/gi, label: 'Lighthouse' },
            { pattern: /\baxe\b/gi, label: 'axe' },
          ],
        },
      },
      {
        title: 'Ten fixes listed',
        text: 'Fix at least ten issues and list each one',
        how: 'README lists at least ten items',
        rule: { kind: 'readme', checks: [{ pattern: LIST_ITEM, label: 'listed fixes', min: 10 }] },
      },
      {
        title: 'Alt text everywhere',
        text: 'Every image has alternative text',
        how: 'Fails if any <img> in your markup is missing an alt attribute',
        rule: { kind: 'noContent', path: MARKUP, pattern: /<img(?![^>]*\balt=)[^>]*>/i, label: 'images without alt text' },
      },
      {
        title: 'Live URL responds',
        text: 'Deploy the fixed site',
        how: 'Pings your live link — taken from the form, the repository’s website field or the README',
        rule: { kind: 'liveUrl' },
      },
    ],
    rules: ['Do not delete content just to pass an audit', 'Keep the original design recognisable'],
    skills: ['Accessibility', 'Semantic HTML', 'Lighthouse'],
    resources: [{ label: 'web.dev — Learn Accessibility', url: 'https://web.dev/learn/accessibility' }],
  },
  {
    slug: 'code-a-poster-for-tech-week',
    title: 'Code a Poster for Tech Week',
    tagline: 'Create the poster for Git Club’s tech week using nothing but code — p5.js, CSS art or hand-written SVG.',
    category: 'Creative',
    difficulty: 'Easy',
    points: 120,
    opens: [12, 10],
    closes: [19, 23],
    estimatedTime: '2–3 hours',
    host: 'Git Club Design Team',
    participants: 18,
    problem: [
      'Posters are usually made in design tools. This time, write one. Generative patterns, animated SVG, pure CSS illustration — anything goes as long as the artwork comes from code.',
      'The three strongest posters will be used for the real tech week announcement on the club’s Instagram.',
    ],
    requirements: [
      {
        title: 'Poster exported',
        text: 'Export the poster as a PNG at 1080 × 1350 pixels',
        how: 'Finds a PNG or JPG in the repository',
        rule: { kind: 'files', path: IMAGES, label: 'poster images', min: 1 },
      },
      {
        title: 'Made with code',
        text: 'Create it entirely with code — no image editors',
        how: 'Finds the source: JavaScript, HTML, SVG or CSS files',
        rule: { kind: 'files', path: /\.(js|ts|html|svg|css)$/i, label: 'source files', min: 1 },
      },
      {
        title: 'Event details',
        text: 'The event name, date and venue are clearly legible',
        how: 'README states the event name, date and venue used on the poster',
        rule: {
          kind: 'readme',
          checks: [
            { pattern: /tech week/gi, label: 'event name' },
            { pattern: /date|\b\d{1,2}\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/gi, label: 'date' },
            { pattern: /venue|hall|auditorium|campus/gi, label: 'venue' },
          ],
        },
      },
    ],
    rules: ['Any creative-coding library is allowed', 'Fonts must be free for commercial use'],
    skills: ['Creative coding', 'p5.js', 'Typography'],
    resources: [{ label: 'p5.js — Get started', url: 'https://p5js.org/tutorials/get-started/' }],
  },
  {
    slug: 'the-rebase-gauntlet',
    title: 'The Rebase Gauntlet',
    tagline: 'Clean up a messy feature branch with interactive rebase: squash, reword, reorder and split commits.',
    category: 'Git',
    difficulty: 'Hard',
    points: 250,
    opens: [-18, 10],
    closes: [-4, 23],
    estimatedTime: '2–3 hours',
    host: 'Git Club Core Team',
    participants: 41,
    problem: [
      'A feature branch with 23 commits, six of them called “fix typo”, is about to be merged. Rewrite its history so that a reviewer can understand the change commit by commit.',
    ],
    requirements: [
      {
        title: 'No “fix typo” commits',
        text: 'Squash every “fix typo” commit into the commit it fixes',
        how: 'Fails if any commit message still says “fix typo”',
        rule: { kind: 'avoidCommitMessages', pattern: /fix(ed)? typo/i, label: '“fix typo”' },
      },
      {
        title: 'Focused commits',
        text: 'Split the large “misc changes” commit into small, focused commits',
        how: 'Counts commits pushed since the challenge opened — eight or more',
        rule: { kind: 'commits', min: 8 },
      },
      {
        title: 'Conventional Commits',
        text: 'Every commit message follows the Conventional Commits format',
        how: 'At least 90% of commit subjects look like “feat: …”, “fix(ui): …” and so on',
        rule: { kind: 'commitMessages', pattern: CONVENTIONAL, label: 'Conventional Commits', share: 0.9 },
      },
      {
        title: 'Linear history',
        text: 'Rebase onto the latest main — no merge commits',
        how: 'Fails if the history contains any merge commit',
        rule: { kind: 'linearHistory' },
      },
    ],
    rules: ['The final code must match the original branch exactly', 'Submit the branch, not a patch file'],
    skills: ['git rebase -i', 'Commit hygiene', 'Conventional Commits'],
    resources: [{ label: 'Pro Git — Rewriting history', url: 'https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History' }],
    results: {
      submissions: 22,
      winners: [
        { participantId: 'krisha-mehta', note: 'Cleanest history — nine commits, each one reviewable on its own' },
        { participantId: 'aarav-patel', note: 'Fastest correct submission, in 38 minutes' },
        { participantId: 'het-desai', note: 'Best written explanation of the rebase plan' },
      ],
    },
  },
  {
    slug: 'portfolio-in-plain-html-css',
    title: 'Portfolio in Plain HTML & CSS',
    tagline: 'No frameworks, no templates — a personal portfolio page written from scratch.',
    category: 'Web',
    difficulty: 'Easy',
    points: 100,
    opens: [-27, 10],
    closes: [-13, 23],
    estimatedTime: '2–3 hours',
    host: 'Git Club Web Team',
    participants: 96,
    problem: [
      'Before reaching for React, every web developer should be able to build a clean, responsive page with nothing but HTML and CSS. Build a one-page portfolio that introduces you and your projects.',
    ],
    requirements: [
      {
        title: 'Semantic HTML',
        text: 'Semantic HTML with a clear heading structure',
        how: 'Finds an <h1> and landmark elements such as <header>, <main> or <footer>',
        rule: {
          kind: 'content',
          path: /\.html?$/i,
          scope: 'HTML files',
          checks: [
            { pattern: /<h1[\s>]/gi, label: '<h1> heading' },
            { pattern: /<(header|main|footer|nav)[\s>]/gi, label: 'landmark elements' },
          ],
        },
      },
      {
        title: 'Flexbox or Grid',
        text: 'A responsive layout built with Flexbox or CSS Grid',
        how: 'Finds display: flex or grid and at least one media query',
        rule: {
          kind: 'content',
          path: /\.(css|html?)$/i,
          scope: 'HTML and CSS files',
          checks: [
            { pattern: /display:\s*(?:flex|grid)/gi, label: 'flex or grid layout' },
            { pattern: /@media/gi, label: 'media query' },
          ],
        },
      },
      {
        title: 'Two project links',
        text: 'At least two project entries with links',
        how: 'Counts links in your HTML — two or more',
        rule: { kind: 'content', path: /\.html?$/i, scope: 'HTML files', checks: [{ pattern: /<a\s[^>]*href=/gi, label: 'links', min: 2 }] },
      },
      {
        title: 'Live URL responds',
        text: 'Deployed with GitHub Pages',
        how: 'Pings your live link — taken from the form, the repository’s website field or the README',
        rule: { kind: 'liveUrl' },
      },
    ],
    rules: ['No CSS frameworks or templates', 'JavaScript is optional'],
    skills: ['HTML', 'CSS', 'GitHub Pages'],
    resources: [{ label: 'MDN — CSS layout', url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout' }],
    results: {
      submissions: 71,
      winners: [
        { participantId: 'riya-trivedi', note: 'Best use of CSS Grid' },
        { participantId: 'khushi-panchal', note: 'Most accessible — Lighthouse accessibility score of 100' },
        { participantId: 'vrunda-bhatt', note: 'Best typography and spacing' },
      ],
    },
  },
]

export const CHALLENGES: Challenge[] = SEEDS.map(({ opens, closes, ...rest }) => ({
  ...rest,
  opensAt: dayOffset(opens[0], opens[1]),
  closesAt: dayOffset(closes[0], closes[1], closes[1] === 23 ? 59 : 0),
}))

export function getChallenge(slug: string | undefined): Challenge | undefined {
  return CHALLENGES.find((c) => c.slug === slug)
}

export function needsLiveUrl(challenge: Challenge): boolean {
  return challenge.requirements.some((r) => r.rule.kind === 'liveUrl')
}
