import { ArrowRight } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, type PointerEvent } from 'react'
import { Link } from 'react-router'
import { LogoMark } from '../../components/Brand'
import { CHALLENGES } from '../../data/challenges'
import { getPhase } from '../../lib/challenge'
import { useArena } from '../../state/arena'
import { CREATIVES } from './RingCards'

/* Design canvas and ring geometry (design px). */
const CANVAS_W = 1172
const CANVAS_H = 657
const TAB_MAX = 1080
const TAB_MIN = 701
const DW_MIN = 920
const R = 891
const N = 37
const STEP = 360 / N
const CULL = 42
const SPEED = 1.9 // deg per second
const DRAG_GAIN = 0.11 // deg per design px

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function Starfield() {
  const a = useRef<HTMLDivElement>(null)
  const b = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const field = (count: number, blur: number, min: number, max: number) =>
      Array.from(
        { length: count },
        () =>
          `${(Math.random() * 100).toFixed(2)}vw ${(Math.random() * 100).toFixed(2)}vh ${blur}px 0 rgba(255,255,255,${(min + Math.random() * (max - min)).toFixed(2)})`,
      ).join(',')
    if (a.current) a.current.style.boxShadow = field(150, 0, 0.05, 0.3)
    if (b.current) b.current.style.boxShadow = field(18, 1.2, 0.35, 0.7)
  }, [])
  return (
    <>
      <div ref={a} className="l-stars" aria-hidden="true" />
      <div ref={b} className="l-stars" aria-hidden="true" />
    </>
  )
}

/** A miniature of the real Arena, drawn at design scale inside the browser mock. */
function MiniArena() {
  return (
    <div className="l-page">
      <div className="mm-head">
        <span className="mm-logo">
          <LogoMark />
          git club <span className="mm-tag">ARENA</span>
        </span>
        <span className="mm-nav">
          <span>Challenges</span>
          <span>Leaderboard</span>
          <span>My progress</span>
        </span>
        <span className="mm-right">
          <span className="mm-search">
            Jump to… <kbd>Ctrl K</kbd>
          </span>
          <span className="mm-join">Join the Arena</span>
        </span>
      </div>
      <div className="mm-hero">
        <div>
          <div className="mm-kick">
            <b>git club</b> · charusat / arena
          </div>
          <div className="mm-title">
            Learn by building<i>.</i>
          </div>
          <div className="mm-copy">
            Short coding, design and web challenges every week. Build it, push it to GitHub, and get it reviewed live.
          </div>
        </div>
        <div className="mm-status">
          <div className="top">$ git status</div>
          <div className="body">
            <div className="git">nothing to commit, working tree clean</div>
            <div className="k">New here? Start with this one</div>
            <div className="t">Two Pointers Sprint</div>
            <div className="go">Start here →</div>
          </div>
        </div>
      </div>
      <div className="mm-cards">
        {[
          ['GIT', 'Easy', '#e6f4ea', '#157a3c', 'Resolve the Merge Conflict', 'Create a real conflict, then resolve it so both features survive.', '100 XP'],
          ['WEB', 'Medium', '#fbf0dc', '#a35a07', 'Club Landing Page in 90 Minutes', 'From an empty folder to a live URL in one focus block.', '200 XP'],
          ['BACKEND', 'Hard', '#fdeceb', '#b42318', 'Rate-Limited URL Shortener API', 'Shorten links, count clicks, stop floods with a 429.', '300 XP'],
        ].map(([cat, lvl, bg, fg, title, text, xp]) => (
          <div className="mm-card" key={title}>
            <div className="row">
              {cat}
              <span className="lvl" style={{ background: bg, color: fg }}>
                {lvl}
              </span>
            </div>
            <h4>{title}</h4>
            <p>{text}</p>
            <div className="meta">
              <span>Closes in 2d</span>
              <b>{xp}</b>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Hero() {
  const { profile, xp } = useArena()
  const stageRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const cards = useRef<Array<HTMLDivElement | null>>([])
  const motion = useRef({ phase: -2, velocity: 0, dragging: false, lastX: 0, lastT: 0, k: 1 })

  const live = CHALLENGES.filter((c) => getPhase(c, Date.now()) === 'active').length

  /* ----- Scale the design canvas to the viewport ----- */
  useLayoutEffect(() => {
    const stage = stageRef.current
    const canvas = canvasRef.current
    if (!stage || !canvas) return
    function resize() {
      if (!stage || !canvas) return
      const vw = window.innerWidth
      const vh = stage.clientHeight
      if (vw <= 700) {
        for (const prop of ['--k', '--fill', '--sshift', '--stshift', '--rs']) canvas.style.removeProperty(prop)
        motion.current.k = 1
        return
      }
      let W = CANVAS_W
      if (vw <= TAB_MAX) {
        W = DW_MIN + ((vw - TAB_MIN) * (CANVAS_W - DW_MIN)) / (TAB_MAX - TAB_MIN)
        if (vh > vw * 1.15) W = Math.min(W, 900)
      }
      const k = Math.min(vw / W, vh / 560)
      let fill = Math.max(0, vh / k - CANVAS_H)
      let showcaseShift = 0
      let ringScale = 1
      let stackShift = 0
      // Tablets ease into a different architecture over 120px: surplus height moves the
      // wheel and mock down, brings the camera closer, and re-centres the hero text.
      const ramp = vw <= TAB_MAX ? Math.min(1, (TAB_MAX - vw) / 120) : 0
      if (fill > 0 && ramp > 0) {
        showcaseShift = Math.min(fill * 0.55, 420) * ramp
        ringScale = 1 + Math.min(fill / 1100, 0.75) * ramp
        const slack = 219.5 - 125 * ringScale + showcaseShift
        stackShift = Math.max(0, slack / 2 - 28) * ramp
        fill -= showcaseShift
      }
      canvas.style.setProperty('--k', String(k))
      canvas.style.setProperty('--fill', `${fill}px`)
      canvas.style.setProperty('--sshift', `${showcaseShift}px`)
      canvas.style.setProperty('--stshift', `${stackShift}px`)
      canvas.style.setProperty('--rs', String(ringScale))
      motion.current.k = k
    }
    resize()
    window.addEventListener('resize', resize)
    window.visualViewport?.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      window.visualViewport?.removeEventListener('resize', resize)
    }
  }, [])

  /* ----- The ring: cards on a cylinder, camera at its centre ----- */
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const state = motion.current
    const reduce = reducedMotion()
    let raf = 0
    let running = false
    let last = performance.now()

    const place = () => {
      for (let i = 0; i < N; i++) {
        const el = cards.current[i]
        if (!el) continue
        const a = ((((i * STEP + state.phase) % 360) + 540) % 360) - 180
        if (Math.abs(a) > CULL) {
          if (el.style.visibility !== 'hidden') el.style.visibility = 'hidden'
          continue
        }
        const r = (a * Math.PI) / 180
        const c = Math.cos(r)
        el.style.visibility = 'visible'
        el.style.transform = `translate3d(${(R * Math.sin(r)).toFixed(2)}px,0,${(R * (1 - c)).toFixed(2)}px) rotateY(${(-a).toFixed(3)}deg)`
        el.style.filter = `brightness(${Math.max(0.55, 1 - 0.9 * (1 / c - 1)).toFixed(3)})`
      }
    }

    const tick = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.1)
      last = t
      if (!state.dragging) {
        if (Math.abs(state.velocity) > 0.05) {
          state.phase += state.velocity * dt
          state.velocity *= Math.pow(0.05, dt) // inertia after a flick
        } else {
          state.velocity = 0
        }
        if (!reduce) state.phase -= SPEED * dt
      }
      place()
      raf = requestAnimationFrame(tick)
    }

    const start = () => {
      if (running) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    place()
    // Only animate while the hero is on screen and the tab is visible.
    const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()))
    observer.observe(stage)
    const onVisibility = () => {
      if (document.hidden) stop()
      else if (stage.getBoundingClientRect().bottom > 0) start()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  /* ----- Drag (or swipe) to spin, with inertia ----- */
  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest('a, button')) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const s = motion.current
    s.dragging = true
    s.velocity = 0
    s.lastX = e.clientX
    s.lastT = performance.now()
    e.currentTarget.setPointerCapture(e.pointerId)
    e.currentTarget.dataset.dragging = ''
  }
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const s = motion.current
    if (!s.dragging) return
    const now = performance.now()
    const delta = ((e.clientX - s.lastX) / s.k) * DRAG_GAIN
    s.phase += delta
    const dt = Math.max(1, now - s.lastT) / 1000
    s.velocity = s.velocity * 0.6 + (delta / dt) * 0.4
    s.lastX = e.clientX
    s.lastT = now
  }
  const endDrag = (e: PointerEvent<HTMLElement>) => {
    const s = motion.current
    if (!s.dragging) return
    s.dragging = false
    if (performance.now() - s.lastT > 90) s.velocity = 0
    s.velocity = Math.max(-240, Math.min(240, s.velocity))
    delete e.currentTarget.dataset.dragging
  }

  /* ----- Entrance: runs once, then the page is still ----- */
  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    if (reducedMotion() || typeof stage.animate !== 'function') {
      stage.removeAttribute('data-intro')
      return
    }
    const D = window.innerWidth <= 700 ? 0.66 : 1
    const EXPO = 'cubic-bezier(.16,1,.3,1)'
    const Y = (px: number) => `0 ${px * D}px`
    const animations: Animation[] = []

    const play = (selector: string, from: Keyframe, duration: number, delay: number, stagger = 0) => {
      stage.querySelectorAll<HTMLElement>(selector).forEach((el, i) => {
        const to: Keyframe = { opacity: 1 }
        if (from.translate) to.translate = '0 0'
        if (from.scale) to.scale = '1'
        if (from.clipPath) to.clipPath = 'inset(-30% 0 -30% 0)'
        animations.push(el.animate([from, to], { duration, delay: delay + i * stagger, easing: EXPO, fill: 'both' }))
      })
    }

    play('.l-nav', { opacity: 0, translate: Y(-9) }, 620, 60)
    play('.l-badge', { opacity: 0, translate: Y(11), scale: '.985' }, 560, 270)
    play('.l-h1', { opacity: 0, translate: Y(15), clipPath: 'inset(100% 0 -30% 0)' }, 900, 380, 90)
    play('.l-sub', { opacity: 0, translate: Y(10) }, 620, 690, 55)
    play('.l-ctas', { opacity: 0, translate: Y(13), scale: '.985' }, 620, 830)
    play('.l-ring', { opacity: 0, translate: Y(18), scale: '.99' }, 950, 700)
    play('.l-mock', { opacity: 0, translate: Y(26) }, 900, 900)
    play('.l-drag-hint', { opacity: 0 }, 700, 1500)
    stage.removeAttribute('data-intro')

    // Nothing survives completion: the final frame is the authored design.
    const settle = () => animations.forEach((a) => a.cancel())
    Promise.all(animations.map((a) => a.finished))
      .then(settle)
      .catch(() => undefined)
    const failsafe = window.setTimeout(settle, 4000)
    return () => {
      window.clearTimeout(failsafe)
      settle()
    }
  }, [])

  const firstName = profile?.name.split(' ')[0]

  return (
    <section
      ref={stageRef}
      data-intro=""
      data-cursor="Drag to spin"
      className="l-stage cursor-grab select-none data-[dragging]:cursor-grabbing"
      aria-labelledby="hero-title"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div className="l-bg" aria-hidden="true" />
      <Starfield />

      <div ref={canvasRef} className="l-canvas">
        <nav className="l-nav" aria-label="Landing">
          <Link to="/" className="l-home" aria-label="Git Club Arena — home">
            <LogoMark className="l-mark" />
            <span className="l-wm" aria-hidden="true">
              <span className="kick">GIT CLUB · CHARUSAT</span>
              <span className="name">ARENA</span>
            </span>
          </Link>
          <div className="l-links">
            <a href="#story" className="link-draw">Story</a>
            <a href="#how" className="link-draw">How it works</a>
            <a href="#scoring" className="link-draw">Scoring</a>
            <Link to="/leaderboard" className="link-draw">Leaderboard</Link>
          </div>
          <Link to="/arena" className="l-btn" data-magnetic>
            <span>{profile ? `Continue · ${xp} XP` : 'Enter Arena'}</span>
          </Link>
        </nav>

        <div className="l-stack">
          <div className="l-badge">
            <i aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,236,226,.95)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="18" r="3" />
                <circle cx="6" cy="6" r="3" />
                <path d="M6 21V9a9 9 0 0 0 9 9" />
              </svg>
            </i>
            <b>
              <em aria-hidden="true" />
              Season 3 · {live} challenges live
            </b>
          </div>

          <h1 id="hero-title" className="contents">
            <span className="l-h1 l1">Build it. Push it.</span>
            <span className="l-h1 l2">
              Get <span className="l-ember-text">merged.</span>
            </span>
          </h1>

          <p className="l-subs">
            <span className="l-sub s1">
              <b>Weekly coding, design &amp; web challenges</b> from Git Club CHARUSAT —
            </span>{' '}
            <span className="l-sub s2">graded live against your real GitHub repo. Score 70% to get merged.</span>
          </p>

          <div className="l-ctas">
            <Link to="/arena" className="l-btn" data-magnetic>
              <span>
                {firstName ? `Continue, ${firstName}` : 'Enter the Arena'}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
            <a href="#how" className="l-ghost" data-magnetic>
              How it works
            </a>
          </div>

          <div className="l-drag-hint" aria-hidden="true">
            ← drag to spin →
          </div>
        </div>

        <div className="l-showcase">
          <div className="l-ring" aria-hidden="true">
            {Array.from({ length: N }, (_, i) => {
              const Creative = CREATIVES[i % CREATIVES.length]
              return (
                <div
                  key={i}
                  ref={(el) => {
                    cards.current[i] = el
                  }}
                  className="l-card"
                >
                  <Creative />
                  <div className="edge" />
                </div>
              )
            })}
          </div>

          <Link to="/arena" className="l-mock" aria-label="Open the Arena" data-cursor="Enter the Arena">
            <div className="l-bar">
              <div className="l-dots" aria-hidden="true">
                <i style={{ background: '#ee5c62' }} />
                <i style={{ background: '#f6b719' }} />
                <i style={{ background: '#12c02f' }} />
              </div>
              <div className="l-omni">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.8-3.8" />
                </svg>
                arena.gitclub.dev/challenges
              </div>
            </div>
            <MiniArena />
          </Link>
        </div>
      </div>

    </section>
  )
}
