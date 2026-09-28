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
const TEST_FILES = /(^|\/)(tests?|__tests__|spec)\/|\.(test|spec)\.[jt]sx?$|(^|\/)test_[^/]+\.py$|_test\.go$/i
const WORKFLOWS = /^\.github\/workflows\/[^/]+\.ya?ml$/i
const SCRIPTS = /\.(js|mjs|ts|jsx|tsx|vue|svelte|html?)$/i
/** Common key formats (AWS, Google, GitHub, OpenAI, Slack) and hard-coded passwords. */
const SECRETS =
  /(AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|ghp_[0-9A-Za-z]{36}|sk-[A-Za-z0-9]{20,}|xox[baprs]-[0-9A-Za-z-]{10,}|(password|passwd|secret|api[_-]?key)\s*[:=]\s*['"][^'"\s]{6,}['"])/i

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
        rule: { kind: 'files', path: TEST_FILES, label: 'test files', min: 1 },
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
    slug: 'write-a-readme-people-read',
    title: 'Write a README People Actually Read',
    tagline: 'Turn any project you’ve built into one a stranger can understand, install and run in two minutes.',
    category: 'Git',
    difficulty: 'Easy',
    points: 80,
    opens: [-1, 10],
    closes: [4, 23],
    estimatedTime: '45 min',
    host: 'Git Club Core Team',
    participants: 58,
    problem: [
      'A repository without a README is a locked door. Recruiters, teammates and your future self all start there — and most student repositories leave it empty.',
      'Pick any project you have built, even a college assignment, and give it a README that answers three questions fast: what is this, how do I run it, and what does it look like?',
    ],
    requirements: [
      {
        title: 'Title and summary',
        text: 'Start with the project name and a one-line summary of what it does',
        how: 'README opens with a # heading followed by a paragraph',
        rule: { kind: 'readme', checks: [{ pattern: /^# +\S[^\n]*\n+[^#\s]/gm, label: 'title and summary' }] },
      },
      {
        title: 'Install and usage',
        text: 'Explain how to install it and how to use it',
        how: 'README has an Install / Setup / Getting started section and a Usage section',
        rule: {
          kind: 'readme',
          checks: [
            { pattern: /^#{2,3}\s*(install|installation|setup|getting started)/gim, label: 'install section' },
            { pattern: /^#{2,3}\s*(usage|how to use|running|run)/gim, label: 'usage section' },
          ],
        },
      },
      {
        title: 'Copyable commands',
        text: 'Put commands in fenced code blocks so people can copy them',
        how: 'README contains a fenced (```) code block',
        rule: { kind: 'readme', checks: [{ pattern: /```/g, label: 'code block', min: 2 }] },
      },
      {
        title: 'Screenshot',
        text: 'Show what it looks like with a screenshot or GIF',
        how: 'README embeds an image',
        rule: { kind: 'readme', checks: [{ pattern: IMAGE_EMBED, label: 'screenshot' }] },
      },
      {
        title: 'License',
        text: 'Add a LICENSE so others know how they may use your code',
        how: 'A LICENSE file exists in the repository',
        rule: { kind: 'file', path: /(^|\/)licen[cs]e(\.(md|txt))?$/i, label: 'LICENSE file' },
      },
    ],
    rules: ['Any project of yours counts — it doesn’t have to be new', 'Generated templates are fine only if you edit them to fit your project'],
    skills: ['Markdown', 'Documentation', 'Open source'],
    resources: [
      {
        label: 'GitHub Docs — About READMEs',
        url: 'https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes',
      },
      { label: 'Choose an open source license', url: 'https://choosealicense.com/' },
    ],
  },
  {
    slug: 'hide-your-secrets',
    title: 'Hide Your Secrets',
    tagline: 'Bots scan GitHub for leaked API keys every minute. Make sure none of yours are there — and keep the project easy to run.',
    category: 'Backend',
    difficulty: 'Easy',
    points: 100,
    opens: [-2, 18],
    closes: [6, 23],
    estimatedTime: '30–45 min',
    host: 'Git Club Web Team',
    participants: 47,
    problem: [
      'Automated scanners find thousands of leaked API keys on GitHub every day, and a leaked key can be abused within minutes of the push.',
      'Take a project that talks to an API or a database and move every secret into a .env file that Git never sees — while leaving teammates a clear way to set up their own.',
    ],
    requirements: [
      {
        title: '.env is ignored',
        text: 'Keep secrets in a .env file that Git ignores',
        how: '.gitignore has a .env entry',
        rule: { kind: 'content', path: /(^|\/)\.gitignore$/, scope: '.gitignore', checks: [{ pattern: /^\s*\.env\b/gm, label: '.env entry' }] },
      },
      {
        title: '.env.example provided',
        text: 'Commit a .env.example with the variable names but no real values',
        how: 'Finds .env.example (or .env.sample / .env.template)',
        rule: { kind: 'file', path: /(^|\/)\.env\.(example|sample|template)$/i, label: '.env.example' },
      },
      {
        title: 'No .env committed',
        text: 'Never commit the real .env file',
        how: 'Fails if a .env file is in the repository',
        rule: { kind: 'noFile', path: /(^|\/)\.env$/, label: '.env file' },
      },
      {
        title: 'No keys in the code',
        text: 'No API keys, tokens or passwords written into the source',
        how: 'Scans every text file for common key formats (AWS, Google, GitHub, OpenAI, Slack) and hard-coded passwords',
        rule: { kind: 'noContent', path: TEXT_FILES, pattern: SECRETS, label: 'possible secrets' },
      },
      {
        title: 'Setup explained',
        text: 'Tell teammates how to create their own .env',
        how: 'README mentions the .env file',
        rule: { kind: 'readme', checks: [{ pattern: /\.env/g, label: '.env instructions' }] },
      },
    ],
    rules: ['If a key was ever committed, rotate it — deleting the file is not enough', 'Use any project that needs a key, token or password'],
    skills: ['Security', 'Environment variables', 'Git hygiene'],
    resources: [
      {
        label: 'GitHub Docs — Removing sensitive data from a repository',
        url: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository',
      },
    ],
  },
  {
    slug: 'todo-app-with-localstorage',
    title: 'To-Do App with LocalStorage',
    tagline: 'The classic first build: add, tick off and delete tasks — and keep them after a page refresh.',
    category: 'Web',
    difficulty: 'Easy',
    points: 120,
    opens: [-1, 9],
    closes: [8, 23],
    estimatedTime: '2–3 hours',
    host: 'Git Club Web Team',
    participants: 81,
    problem: [
      'The to-do app is a rite of passage: small enough to finish in an evening, big enough to teach events, state and persistence.',
      'Build one that lets you add, complete and delete tasks, and that still remembers everything after the browser is refreshed — no backend, the browser is your database.',
    ],
    requirements: [
      {
        title: 'Add-task form',
        text: 'An input and a button (or form) to add tasks',
        how: 'Finds an <input> and a <button> or <form> in your markup',
        rule: {
          kind: 'content',
          path: MARKUP,
          scope: 'HTML and component files',
          checks: [
            { pattern: /<input[\s>]/gi, label: '<input>' },
            { pattern: /<(button|form)[\s>]/gi, label: 'button or form' },
          ],
        },
      },
      {
        title: 'Event handlers',
        text: 'Add, complete and delete tasks with event handlers',
        how: 'Finds addEventListener, onClick/onSubmit or @click in your code',
        rule: {
          kind: 'content',
          path: SCRIPTS,
          scope: 'script and component files',
          checks: [{ pattern: /addEventListener|onClick|onSubmit|@click|on:click/g, label: 'event handlers' }],
        },
      },
      {
        title: 'Saved to localStorage',
        text: 'Tasks survive a page refresh',
        how: 'Finds both localStorage.setItem and localStorage.getItem',
        rule: {
          kind: 'content',
          path: SCRIPTS,
          scope: 'script and component files',
          checks: [
            { pattern: /localStorage\.setItem/g, label: 'setItem' },
            { pattern: /localStorage\.getItem/g, label: 'getItem' },
          ],
        },
      },
      {
        title: 'Live URL responds',
        text: 'Deploy it to a public URL',
        how: 'Pings your live link — taken from the form, the repository’s website field or the README',
        rule: { kind: 'liveUrl' },
      },
      {
        title: 'README link + screenshot',
        text: 'A README with the live link and a screenshot',
        how: 'README contains a non-GitHub link and an embedded image',
        rule: {
          kind: 'readme',
          checks: [
            { pattern: LIVE_LINK, label: 'live link' },
            { pattern: IMAGE_EMBED, label: 'screenshot' },
          ],
        },
      },
    ],
    rules: ['Plain JavaScript or any framework', 'No backend — everything lives in the browser'],
    skills: ['JavaScript', 'DOM events', 'localStorage'],
    resources: [{ label: 'MDN — Window.localStorage', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage' }],
  },
  {
    slug: 'sliding-window-week',
    title: 'Sliding Window Week',
    tagline: 'The technique after two pointers: four problems where a moving window turns O(n²) into O(n).',
    category: 'DSA',
    difficulty: 'Medium',
    points: 150,
    opens: [-3, 9],
    closes: [5, 12],
    estimatedTime: '2–3 hours',
    host: 'Git Club DSA Circle',
    participants: 52,
    problem: [
      'The sliding window is the trick behind “longest substring without repeating characters” and many interview favourites. Solve four problems: the maximum sum of a subarray of size k, the longest substring without repeating characters, the minimum window substring, and the longest subarray whose sum is at most k.',
    ],
    requirements: [
      {
        title: 'Four solution files',
        text: 'Solve all four problems — one file each, in C++, Java, Python or JavaScript',
        how: 'Counts solution files (.cpp, .java, .py, .js, .ts) — four or more',
        rule: { kind: 'files', path: SOLUTIONS, label: 'solution files', min: 4 },
      },
      {
        title: 'Complexity in every file',
        text: 'State the time and space complexity at the top of each file',
        how: 'Every solution file mentions Big-O at least twice',
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
        title: 'Explain the window',
        text: 'In the README, explain when your window grows and when it shrinks',
        how: 'README talks about both growing and shrinking the window',
        rule: {
          kind: 'readme',
          checks: [
            { pattern: /expand|grow/gi, label: 'growing the window' },
            { pattern: /shrink|contract/gi, label: 'shrinking the window' },
          ],
        },
      },
    ],
    rules: ['Standard library only', 'Brute-force solutions score, but reviewers look for O(n)'],
    skills: ['Sliding window', 'Hash maps', 'Complexity analysis'],
    resources: [{ label: 'Visualgo — array visualisations', url: 'https://visualgo.net/en' }],
  },
  {
    slug: 'add-ci-with-github-actions',
    title: 'Add CI with GitHub Actions',
    tagline: 'Make a machine run your tests on every push — and show the green badge on your README.',
    category: 'Git',
    difficulty: 'Medium',
    points: 150,
    opens: [2, 10],
    closes: [9, 23],
    estimatedTime: '1–2 hours',
    host: 'Git Club Core Team',
    participants: 34,
    problem: [
      'On real teams, every push is checked by a machine before a human reviews it. Continuous integration catches broken builds and failing tests the moment they happen.',
      'Add a GitHub Actions workflow to one of your projects that installs dependencies and runs your tests on every push, and put its status badge on the README.',
    ],
    requirements: [
      {
        title: 'Workflow file',
        text: 'Add a workflow under .github/workflows/',
        how: 'Finds a .yml workflow file in .github/workflows/',
        rule: { kind: 'files', path: WORKFLOWS, label: 'workflow files', min: 1 },
      },
      {
        title: 'Runs on every push',
        text: 'Trigger the workflow on push',
        how: 'The workflow declares a push trigger',
        rule: { kind: 'content', path: WORKFLOWS, scope: 'workflow files', checks: [{ pattern: /\bpush\b/g, label: 'push trigger' }] },
      },
      {
        title: 'Runs your tests',
        text: 'A job installs dependencies and runs your test command',
        how: 'The workflow runs npm test, pytest, go test, mvn test or similar',
        rule: {
          kind: 'content',
          path: WORKFLOWS,
          scope: 'workflow files',
          checks: [{ pattern: /npm (?:run )?test|pnpm test|yarn test|pytest|go test|mvn test|gradle test|cargo test/g, label: 'test command' }],
        },
      },
      {
        title: 'Tests exist',
        text: 'Include at least one automated test for the workflow to run',
        how: 'Finds a test file such as *.test.js, test_*.py or a tests/ folder',
        rule: { kind: 'files', path: TEST_FILES, label: 'test files', min: 1 },
      },
      {
        title: 'Status badge',
        text: 'Show the workflow’s status badge on the README',
        how: 'README embeds an actions/workflows/…/badge.svg image',
        rule: { kind: 'readme', checks: [{ pattern: /actions\/workflows\/[^)\s]+\/badge\.svg/g, label: 'status badge' }] },
      },
    ],
    rules: ['Any language and any test framework', 'The workflow must pass on your latest commit'],
    skills: ['GitHub Actions', 'CI/CD', 'Testing'],
    resources: [{ label: 'GitHub Docs — Actions quickstart', url: 'https://docs.github.com/en/actions/writing-workflows/quickstart' }],
  },
  {
    slug: 'rest-api-for-club-events',
    title: 'REST API for Club Events',
    tagline: 'Give the Event Hub a backend: list, create, update and delete events — and reject bad input clearly.',
    category: 'Backend',
    difficulty: 'Medium',
    points: 220,
    opens: [5, 10],
    closes: [13, 23],
    estimatedTime: '4–6 hours',
    host: 'Git Club Web Team',
    participants: 38,
    problem: [
      'Club events live in scattered posts and group chats. Build the small REST API an event website would call: list events, add one, edit it and delete it.',
      'Good APIs fail helpfully. A missing title or date should return a clear 400 or 422 error, not crash the server.',
    ],
    requirements: [
      {
        title: '/events routes',
        text: 'Routes under /events for listing, creating, updating and deleting',
        how: 'Finds an /events route plus GET/POST and PUT/PATCH/DELETE handlers',
        rule: {
          kind: 'content',
          path: SERVER_CODE,
          scope: 'server files',
          checks: [
            { pattern: /['"`]\/events/g, label: '/events route' },
            { pattern: /\.(get|post)\(|@(Get|Post)Mapping|methods\s*=\s*\[/gi, label: 'GET/POST handlers' },
            { pattern: /\.(put|patch|delete)\(|@(Put|Patch|Delete)Mapping/gi, label: 'update/delete handlers' },
          ],
        },
      },
      {
        title: 'Validation errors',
        text: 'Reject missing or invalid fields with a 400 or 422 response',
        how: 'Finds a 400 or 422 status in your server code',
        rule: { kind: 'content', path: SERVER_CODE, scope: 'server files', checks: [{ pattern: /\b(400|422)\b/g, label: '400/422 response' }] },
      },
      {
        title: 'Automated tests',
        text: 'Include at least one automated test',
        how: 'Finds a test file such as *.test.js, test_*.py or a tests/ folder',
        rule: { kind: 'files', path: TEST_FILES, label: 'test files', min: 1 },
      },
      {
        title: 'README with curl examples',
        text: 'Document the endpoints with example requests',
        how: 'README has at least two curl examples',
        rule: { kind: 'readme', checks: [{ pattern: /curl /g, label: 'curl examples', min: 2 }] },
      },
      {
        title: 'Built in steps',
        text: 'Commit as you build — at least five commits',
        how: 'Counts commits pushed since the challenge opened',
        rule: { kind: 'commits', min: 5 },
      },
    ],
    rules: ['Any backend language or framework', 'In-memory storage is fine; a real database earns a mention'],
    skills: ['REST APIs', 'Validation', 'Testing'],
    resources: [{ label: 'MDN — HTTP response status codes', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status' }],
  },
  {
    slug: 'sentiment-of-club-feedback',
    title: 'Sentiment of Club Feedback',
    tagline: 'Teach a model to read workshop feedback — “loved the hands-on part” vs “too fast for beginners”.',
    category: 'AI/ML',
    difficulty: 'Medium',
    points: 180,
    opens: [9, 17],
    closes: [16, 23],
    estimatedTime: '3–4 hours',
    host: 'Git Club AI/ML Team',
    participants: 26,
    problem: [
      'After every workshop the club collects feedback. Train a model that labels each comment as positive, negative or neutral using any public sentiment dataset — then test it on feedback you write yourself.',
    ],
    requirements: [
      {
        title: 'Train/test split',
        text: 'Split your data into training and test sets',
        how: 'Finds train_test_split or a test_size in your code or notebook',
        rule: { kind: 'content', path: NOTEBOOKS, scope: 'notebooks and Python files', checks: [{ pattern: /train_test_split|test_size/gi, label: 'train/test split' }] },
      },
      {
        title: 'Model trained',
        text: 'Train at least one classifier',
        how: 'Finds a model .fit( call',
        rule: { kind: 'content', path: NOTEBOOKS, scope: 'notebooks and Python files', checks: [{ pattern: /\.fit\(/g, label: 'model.fit(…) call' }] },
      },
      {
        title: 'Precision, recall, F1',
        text: 'Report precision, recall and F1 score',
        how: 'Finds precision, recall and F1 in your code, notebook or README',
        rule: {
          kind: 'content',
          path: NOTEBOOKS_AND_DOCS,
          scope: 'notebooks, Python and Markdown files',
          checks: [
            { pattern: /precision/gi, label: 'precision' },
            { pattern: /recall/gi, label: 'recall' },
            { pattern: /\bf1/gi, label: 'F1' },
          ],
        },
      },
      {
        title: 'Tested on real feedback',
        text: 'Run the model on at least five feedback sentences you wrote and show the predictions',
        how: 'Finds predictions on your own examples in the code, notebook or README',
        rule: {
          kind: 'content',
          path: NOTEBOOKS_AND_DOCS,
          scope: 'notebooks, Python and Markdown files',
          checks: [{ pattern: /\.predict\(|prediction/gi, label: 'predictions', min: 2 }],
        },
      },
      {
        title: 'Error analysis',
        text: 'Explain where the model gets it wrong',
        how: 'Finds a discussion of misclassified examples, false positives or false negatives',
        rule: {
          kind: 'content',
          path: NOTEBOOKS_AND_DOCS,
          scope: 'notebooks, Python and Markdown files',
          checks: [{ pattern: /misclassif|false (?:positive|negative)|wrong/gi, label: 'error analysis' }],
        },
      },
    ],
    rules: ['Python with scikit-learn or any equivalent library', 'Credit the dataset you use in the README'],
    skills: ['Python', 'NLP', 'Model evaluation'],
    resources: [{ label: 'scikit-learn — Working with text data', url: 'https://scikit-learn.org/stable/tutorial/text_analytics/working_with_text_data.html' }],
  },
  {
    slug: 'generative-art-with-p5js',
    title: 'Generative Art with p5.js',
    tagline: 'Write one sketch, get endless artworks: use randomness to generate a series, then pick your three favourites.',
    category: 'Creative',
    difficulty: 'Easy',
    points: 100,
    opens: [14, 10],
    closes: [21, 23],
    estimatedTime: '2 hours',
    host: 'Git Club Design Team',
    participants: 21,
    problem: [
      'Generative art is code that makes a different picture every time it runs. Write a p5.js sketch driven by randomness or noise, run it until you love the results, and export your three favourite variations.',
    ],
    requirements: [
      {
        title: 'A p5.js sketch',
        text: 'Create the artwork with p5.js',
        how: 'Finds createCanvas() in your code',
        rule: { kind: 'content', path: /\.(js|ts|html?)$/i, scope: 'sketch files', checks: [{ pattern: /createCanvas\(/g, label: 'createCanvas()' }] },
      },
      {
        title: 'Driven by randomness',
        text: 'Use random() or noise() so every run is different',
        how: 'Finds random() or noise() in your sketch',
        rule: { kind: 'content', path: /\.(js|ts|html?)$/i, scope: 'sketch files', checks: [{ pattern: /\brandom\(|\bnoise\(/g, label: 'random() or noise()' }] },
      },
      {
        title: 'Three variations',
        text: 'Export your three favourite outputs as images',
        how: 'Counts PNG, JPG or WebP files — three or more',
        rule: { kind: 'files', path: IMAGES, label: 'exported variations', min: 3 },
      },
      {
        title: 'Live sketch',
        text: 'Share a live version (p5.js editor link or GitHub Pages)',
        how: 'Pings your live link — taken from the form, the repository’s website field or the README',
        rule: { kind: 'liveUrl' },
      },
    ],
    rules: ['Only p5.js — no image editing afterwards', 'Seeded randomness is welcome so others can reproduce your picks'],
    skills: ['Creative coding', 'p5.js', 'Randomness'],
    resources: [{ label: 'p5.js reference', url: 'https://p5js.org/reference/' }],
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
