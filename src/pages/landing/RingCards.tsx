import type { CSSProperties, ReactNode } from 'react'

/*
 * The ten "posters" that ride the 3D ring. Each is a 130 × 300 design-px card drawn
 * entirely in HTML/CSS from real Arena content — no images to load or break.
 */

const mono = 'var(--font-mono)'
const display = 'var(--font-display)'

function Abs({ style, children }: { style: CSSProperties; children?: ReactNode }) {
  return <div style={{ position: 'absolute', ...style }}>{children}</div>
}

function Tag({ children, color = 'rgba(255,255,255,.55)', top = 278 }: { children: ReactNode; color?: string; top?: number }) {
  return (
    <Abs style={{ left: 10, right: 10, top, font: `500 4.6px/1 ${mono}`, letterSpacing: '.16em', color, textTransform: 'uppercase' }}>
      {children}
    </Abs>
  )
}

function Conflict() {
  const line = (text: string, color: string) => <div style={{ color, whiteSpace: 'pre' }}>{text}</div>
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0d0f14' }}>
      <Abs style={{ left: 10, right: 8, top: 16, font: `400 5.4px/1.75 ${mono}` }}>
        {line('$ git merge feature/cards', 'rgba(255,255,255,.75)')}
        {line('Auto-merging index.html', 'rgba(255,255,255,.42)')}
        {line('CONFLICT (content): Merge', '#f85149')}
        {line('conflict in index.html', '#f85149')}
      </Abs>
      <Abs
        style={{
          left: 10,
          right: 10,
          top: 76,
          padding: '7px 8px',
          borderRadius: 6,
          background: 'rgba(255,255,255,.04)',
          border: '1px solid rgba(255,255,255,.07)',
          font: `400 5.6px/1.8 ${mono}`,
        }}
      >
        {line('<<<<<<< HEAD', '#f2b65f')}
        {line('  renderCards()', 'rgba(255,255,255,.8)')}
        {line('=======', 'rgba(255,255,255,.35)')}
        {line('  renderList()', 'rgba(255,255,255,.8)')}
        {line('>>>>>>> feature/filters', '#8db8ff')}
      </Abs>
      <Abs style={{ left: 10, top: 186, font: `800 27px/.92 ${display}`, letterSpacing: '-.03em', color: '#fff' }}>
        RESOLVE
        <br />
        <span style={{ color: '#ff7a58' }}>IT.</span>
      </Abs>
      <Tag>Git · Easy · 100 XP</Tag>
    </div>
  )
}

function Xp() {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(165deg,#ff9a72 0%,#f05032 42%,#7d1f0d 100%)' }}>
      <Abs style={{ left: 10, top: 16, font: `600 5px/1 ${mono}`, letterSpacing: '.2em', color: 'rgba(255,255,255,.85)' }}>REVIEW · APPROVED</Abs>
      <Abs style={{ left: 8, top: 60, font: `800 54px/.85 ${display}`, letterSpacing: '-.05em', color: '#fff' }}>+120</Abs>
      <Abs style={{ left: 10, top: 110, font: `800 22px/1 ${display}`, color: 'rgba(255,255,255,.9)' }}>XP</Abs>
      <Abs
        style={{
          left: 10,
          top: 150,
          padding: '4px 8px',
          borderRadius: 20,
          background: 'rgba(0,0,0,.25)',
          font: `600 5.6px/1 ${mono}`,
          letterSpacing: '.12em',
          color: '#fff',
        }}
      >
        ✓ MERGED INTO MAIN
      </Abs>
      <Abs style={{ left: 10, right: 10, top: 232, font: `500 6.4px/1.5 var(--font-sans)`, color: 'rgba(255,255,255,.9)' }}>
        Resolve the Merge Conflict — scored 100%, plus an early-push bonus.
      </Abs>
      <Tag color="rgba(255,255,255,.7)">+20 XP · pushed a day early</Tag>
    </div>
  )
}

function Graph() {
  const lanes = [26, 50, 74]
  const nodes: Array<[number, number, string]> = [
    [0, 40, '#f05032'],
    [1, 62, '#8db8ff'],
    [2, 84, '#c026d3'],
    [1, 106, '#8db8ff'],
    [0, 128, '#f05032'],
    [2, 150, '#c026d3'],
    [0, 172, '#f05032'],
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#0b1422,#0e1d33 55%,#070d18)' }}>
      <svg viewBox="0 0 130 200" width="130" height="200" style={{ position: 'absolute', left: 0, top: 6 }} aria-hidden="true">
        {lanes.map((x, i) => (
          <line key={x} x1={x} y1="20" x2={x} y2="190" stroke={i === 0 ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.12)'} strokeWidth="2" strokeDasharray={i ? '3 4' : undefined} />
        ))}
        <path d="M50 106 C50 118, 26 118, 26 128" fill="none" stroke="#8db8ff" strokeWidth="2" />
        <path d="M74 150 C74 162, 26 162, 26 172" fill="none" stroke="#c026d3" strokeWidth="2" />
        {nodes.map(([lane, y, color], i) => (
          <circle key={i} cx={lanes[lane]} cy={y} r={lane === 0 && i > 0 ? 5.5 : 4.5} fill={lane === 0 ? color : '#0e1d33'} stroke={color} strokeWidth="2" />
        ))}
        <text x="84" y="43" fill="rgba(255,255,255,.6)" fontFamily="JetBrains Mono" fontSize="5">main</text>
        <text x="84" y="65" fill="rgba(141,184,255,.8)" fontFamily="JetBrains Mono" fontSize="5">feature/web</text>
        <text x="84" y="87" fill="rgba(192,38,211,.9)" fontFamily="JetBrains Mono" fontSize="5">feature/ui</text>
      </svg>
      <Abs style={{ left: 10, right: 10, top: 216, font: `800 17px/.98 ${display}`, letterSpacing: '-.02em', color: '#fff' }}>
        YOUR HISTORY,
        <br />
        READABLE.
      </Abs>
      <Tag color="rgba(141,184,255,.75)">Every submission is a commit</Tag>
    </div>
  )
}

function Board() {
  const rows: Array<[string, string, string]> = [
    ['DS', 'Dhruvi Shah', '1,480'],
    ['AP', 'Aarav Patel', '1,335'],
    ['KM', 'Krisha Mehta', '1,190'],
    ['HD', 'Het Desai', '1,015'],
    ['YP', 'Yash Parmar', '890'],
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#faf8f4', color: '#17150f' }}>
      <Abs style={{ left: 10, top: 16, font: `500 5px/1 ${mono}`, letterSpacing: '.2em', color: '#6b655b' }}>LEADERBOARD · SEASON 3</Abs>
      <Abs style={{ left: 10, top: 30, font: `800 20px/.95 ${display}`, letterSpacing: '-.03em' }}>
        CLIMB
        <br />
        THE BOARD
      </Abs>
      <Abs style={{ left: 8, right: 8, top: 84 }}>
        {rows.map(([initials, name, xp], i) => (
          <div
            key={name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 5px',
              borderRadius: 6,
              background: i === 0 ? '#fdece6' : 'transparent',
              borderBottom: i === 0 ? 'none' : '1px solid #ece6dc',
            }}
          >
            <span style={{ width: 9, font: `600 5.5px/1 ${mono}`, color: i === 0 ? '#c68a00' : '#8a8378' }}>{i === 0 ? '♛' : `#${i + 1}`}</span>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                display: 'grid',
                placeItems: 'center',
                background: i === 0 ? '#c93e1b' : '#e9e3d8',
                color: i === 0 ? '#fff' : '#46423a',
                font: `600 5px/1 var(--font-sans)`,
              }}
            >
              {initials}
            </span>
            <span style={{ flex: 1, font: `600 6px/1 var(--font-sans)` }}>{name}</span>
            <span style={{ font: `600 5.5px/1 ${mono}` }}>{xp}</span>
          </div>
        ))}
      </Abs>
      <Tag color="#8a8378">17 builders ranked</Tag>
    </div>
  )
}

function Code() {
  const t = (text: string, color: string) => <span style={{ color }}>{text}</span>
  const lines: ReactNode[] = [
    <>{t('function ', '#ff7b72')}{t('twoSum', '#d2a8ff')}(a, target) {'{'}</>,
    <>{'  '}{t('let ', '#ff7b72')}i = {t('0', '#79c0ff')}, j = a.length - {t('1', '#79c0ff')}</>,
    <>{'  '}{t('while ', '#ff7b72')}(i {'<'} j) {'{'}</>,
    <>{'    '}{t('const ', '#ff7b72')}s = a[i] + a[j]</>,
    <>{'    '}{t('if ', '#ff7b72')}(s === target)</>,
    <>{'      '}{t('return ', '#ff7b72')}[i, j]</>,
    <>{'    '}s {'<'} target ? i++ : j--</>,
    <>{'  }'}</>,
    <>{'}'}</>,
    <>{t('// O(n) time · O(1) space', '#8b949e')}</>,
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0f1117' }}>
      <Abs style={{ left: 0, right: 0, top: 0, height: 18, background: '#161a22', display: 'flex', alignItems: 'center', gap: 3, paddingLeft: 8 }}>
        {['#ee5c62', '#f6b719', '#12c02f'].map((c) => (
          <i key={c} style={{ width: 4.5, height: 4.5, borderRadius: 3, background: c }} />
        ))}
        <span style={{ marginLeft: 6, font: `400 4.6px/1 ${mono}`, color: 'rgba(255,255,255,.5)' }}>two_pointers.js</span>
      </Abs>
      <Abs style={{ left: 6, right: 4, top: 26, font: `400 5.2px/1.9 ${mono}`, color: '#e6edf3' }}>
        {lines.map((l, i) => (
          <div key={i} style={{ whiteSpace: 'pre' }}>
            <span style={{ color: 'rgba(255,255,255,.22)', marginRight: 5 }}>{String(i + 1).padStart(2, ' ')}</span>
            {l}
          </div>
        ))}
      </Abs>
      <Abs style={{ left: 10, top: 200, font: `800 22px/.92 ${display}`, letterSpacing: '-.03em', color: '#fff' }}>
        TWO
        <br />
        POINTERS
        <br />
        <span style={{ color: '#d2a8ff' }}>SPRINT.</span>
      </Abs>
      <Tag color="rgba(210,168,255,.7)">DSA · Easy · 5 problems</Tag>
    </div>
  )
}

function Design() {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(170deg,#f6e8fb,#ead3f4 60%,#dcb9ec)' }}>
      <Abs style={{ left: 22, top: 18, width: 86, height: 150, borderRadius: 14, background: '#fff', boxShadow: '0 12px 24px -10px rgba(90,20,120,.45)', padding: 7 }}>
        <div style={{ font: `600 4.2px/1 ${mono}`, letterSpacing: '.14em', color: '#8a5aa0' }}>TODAY · WED</div>
        <div style={{ marginTop: 6, borderRadius: 7, background: '#1a1022', color: '#fff', padding: '6px 6px 7px' }}>
          <div style={{ font: `600 4px/1 ${mono}`, letterSpacing: '.14em', color: '#e3b6f5' }}>NEXT UP · 10:30</div>
          <div style={{ marginTop: 4, font: `700 8px/1.05 ${display}` }}>DSA Lab</div>
          <div style={{ marginTop: 3, font: `500 4.6px/1 var(--font-sans)`, color: 'rgba(255,255,255,.75)' }}>Room 204 · Prof. Mehta</div>
        </div>
        <div style={{ marginTop: 5, padding: '4px 5px', borderRadius: 5, background: '#fff4d6', font: `600 4.4px/1.3 var(--font-sans)`, color: '#8a5a00' }}>
          ⚠ Room changed → Lab 3
        </div>
        {['11:30 · Web Tech', '1:30 · Free period', '2:30 · Maths'].map((row, i) => (
          <div key={row} style={{ marginTop: 4, padding: '4px 5px', borderRadius: 5, background: '#f6eefa', font: `500 4.4px/1 var(--font-sans)`, color: i === 1 ? '#a58db2' : '#3b2447', textDecoration: i === 2 ? 'line-through' : 'none' }}>
            {row}
          </div>
        ))}
      </Abs>
      <Abs style={{ left: 10, right: 10, top: 196, font: `800 18px/.95 ${display}`, letterSpacing: '-.025em', color: '#3b0d52' }}>
        WHERE DO
        <br />I GO NEXT?
      </Abs>
      <Tag color="#8a5aa0">Design · Medium · 150 XP</Tag>
    </div>
  )
}

function Badge() {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(90% 55% at 50% 38%, #4a1a0f 0%, #1a0d0a 55%, #0c0807 100%)' }}>
      <Abs style={{ left: 30, top: 44, width: 70, height: 70, borderRadius: 35, background: 'linear-gradient(160deg,#ffb08f,#f05032 55%,#9a2f16)', boxShadow: '0 0 0 6px rgba(240,80,50,.14), 0 0 40px rgba(240,80,50,.45)', display: 'grid', placeItems: 'center' }}>
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="18" cy="18" r="3" />
          <circle cx="6" cy="6" r="3" />
          <path d="M6 21V9a9 9 0 0 0 9 9" />
        </svg>
      </Abs>
      <Abs style={{ left: 0, right: 0, top: 138, textAlign: 'center', font: `600 5px/1 ${mono}`, letterSpacing: '.24em', color: '#ff9a72' }}>BADGE UNLOCKED</Abs>
      <Abs style={{ left: 0, right: 0, top: 152, textAlign: 'center', font: `800 22px/.95 ${display}`, letterSpacing: '-.02em', color: '#fff' }}>
        FIRST
        <br />
        MERGE
      </Abs>
      <Abs style={{ left: 14, right: 14, top: 218, textAlign: 'center', font: `400 5.8px/1.5 var(--font-sans)`, color: 'rgba(255,255,255,.62)' }}>
        Complete your first challenge. Six more to collect.
      </Abs>
      <Tag color="rgba(255,154,114,.6)">7 badges · 5 levels</Tag>
    </div>
  )
}

function Review() {
  const rows: Array<[string, string, string]> = [
    ['✓', 'Merge commit on main', '20/20'],
    ['✓', 'No conflict markers', '20/20'],
    ['◐', 'Merge message explains', '10/20'],
    ['✓', 'CONFLICTS.md', '20/20'],
    ['◐', 'Readable history', '15/20'],
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0b0c0f' }}>
      <Abs style={{ left: 9, right: 9, top: 14, font: `400 5px/1 ${mono}`, color: 'rgba(255,255,255,.7)' }}>
        <span style={{ color: '#f05032' }}>$</span> arena review
      </Abs>
      <Abs style={{ left: 9, right: 9, top: 30 }}>
        {rows.map(([icon, label, pts]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5.5px 0', borderBottom: '1px solid rgba(255,255,255,.06)', font: `400 5px/1 ${mono}` }}>
            <span style={{ color: icon === '✓' ? '#3fb950' : '#d29922' }}>{icon}</span>
            <span style={{ flex: 1, color: 'rgba(255,255,255,.85)' }}>{label}</span>
            <span style={{ color: 'rgba(255,255,255,.6)' }}>{pts}</span>
          </div>
        ))}
      </Abs>
      <Abs style={{ left: 9, right: 9, top: 124, font: `400 5px/1 ${mono}`, color: 'rgba(255,255,255,.55)', display: 'flex', justifyContent: 'space-between' }}>
        <span>Score</span>
        <span style={{ color: '#fff' }}>85/100</span>
      </Abs>
      <Abs style={{ left: 9, right: 9, top: 134, height: 4, borderRadius: 3, background: 'rgba(255,255,255,.1)' }}>
        <div style={{ width: '85%', height: '100%', borderRadius: 3, background: '#3fb950' }} />
        <div style={{ position: 'absolute', left: '70%', top: -2, width: 1.5, height: 8, background: 'rgba(255,255,255,.7)' }} />
      </Abs>
      <Abs style={{ left: 9, top: 176, font: `800 24px/.92 ${display}`, letterSpacing: '-.03em', color: '#fff' }}>
        GRADED
        <br />
        IN <span style={{ color: '#3fb950' }}>SECONDS.</span>
      </Abs>
      <Tag color="rgba(63,185,80,.75)">Pass mark 70% · approved</Tag>
    </div>
  )
}

function Streak() {
  const cells = Array.from({ length: 70 }, (_, i) => {
    const v = (Math.sin(i * 12.9898) * 43758.5453) % 1
    const level = i > 55 ? 3 : Math.abs(v) > 0.72 ? 3 : Math.abs(v) > 0.45 ? 2 : Math.abs(v) > 0.22 ? 1 : 0
    return level
  })
  const colors = ['#ece6dc', 'rgba(240,80,50,.3)', 'rgba(240,80,50,.6)', '#f05032']
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#faf8f4' }}>
      <Abs style={{ left: 11, top: 18, display: 'grid', gridTemplateRows: 'repeat(7, 9px)', gridAutoFlow: 'column', gap: 2.2 }}>
        {cells.map((level, i) => (
          <i key={i} style={{ width: 9, height: 9, borderRadius: 2, background: colors[level] }} />
        ))}
      </Abs>
      <Abs style={{ left: 10, top: 112, font: `800 64px/.85 ${display}`, letterSpacing: '-.05em', color: '#17150f' }}>14</Abs>
      <Abs style={{ left: 11, top: 172, font: `800 16px/1 ${display}`, letterSpacing: '-.02em', color: '#c93e1b' }}>DAY STREAK</Abs>
      <Abs style={{ left: 11, right: 12, top: 198, font: `400 6px/1.5 var(--font-sans)`, color: '#6b655b' }}>
        Starting, building and submitting all count. Show up daily.
      </Abs>
      <Tag color="#8a8378">Your activity · 17 weeks</Tag>
    </div>
  )
}

function Tracks() {
  const tracks: Array<[string, string]> = [
    ['WEB', '#2563eb'],
    ['GIT', '#f05032'],
    ['DSA', '#7c3aed'],
    ['DESIGN', '#c026d3'],
    ['BACKEND', '#0f766e'],
    ['AI/ML', '#ca8a04'],
    ['OSS', '#16a34a'],
    ['CREATIVE', '#e11d48'],
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#121110' }}>
      <Abs style={{ left: 10, top: 16, font: `500 5px/1 ${mono}`, letterSpacing: '.2em', color: 'rgba(255,255,255,.5)' }}>8 TRACKS · EVERY BRANCH</Abs>
      <Abs style={{ left: 10, right: 6, top: 32 }}>
        {tracks.map(([name, color], i) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 5, font: `800 18px/1.18 ${display}`, letterSpacing: '-.02em', color: i % 2 ? 'rgba(255,255,255,.4)' : '#fff' }}>
            <i style={{ width: 5, height: 5, borderRadius: 3, background: color, flex: '0 0 auto' }} />
            {name}
          </div>
        ))}
      </Abs>
      <Tag color="rgba(255,255,255,.45)">Pick yours. Switch any time.</Tag>
    </div>
  )
}

export const CREATIVES = [Conflict, Xp, Graph, Board, Code, Design, Badge, Review, Streak, Tracks]
