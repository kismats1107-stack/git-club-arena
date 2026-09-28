import { MotionConfig, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { BrowserRouter, Outlet, Route, Routes, useLocation } from 'react-router'
import { CommandPaletteProvider } from './components/CommandPalette'
import { CursorFX } from './components/CursorFX'
import { Footer } from './components/Footer'
import { Header, MobileTabBar } from './components/Header'
import { ArenaPage } from './pages/ArenaPage'
import { ChallengePage } from './pages/ChallengePage'
import { LandingPage } from './pages/landing/LandingPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProfilePage } from './pages/ProfilePage'
import { ArenaProvider } from './state/arena'
import { AuthProvider } from './state/auth'
import { ToastProvider } from './state/toast'

/**
 * New page → top of page and focus moves to the main region (so screen readers
 * announce the new page); "/#section" links → that section. Filter changes keep scroll.
 */
function ScrollManager() {
  const { pathname, hash } = useLocation()
  const firstRender = useRef(true)
  useEffect(() => {
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null
    if (target) target.scrollIntoView()
    else window.scrollTo(0, 0)
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    if (!target) document.getElementById('main')?.focus({ preventScroll: true })
  }, [pathname, hash])
  return null
}

function Layout() {
  const { pathname } = useLocation()
  return (
    <div className="flex min-h-dvh flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>
      <Footer />
      <MobileTabBar />
    </div>
  )
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <ArenaProvider>
              <CommandPaletteProvider>
                <ScrollManager />
                <CursorFX />
                <Routes>
                  <Route index element={<LandingPage />} />
                  <Route element={<Layout />}>
                    <Route path="arena" element={<ArenaPage />} />
                    <Route path="challenges/:slug" element={<ChallengePage />} />
                    <Route path="leaderboard" element={<LeaderboardPage />} />
                    <Route path="me" element={<ProfilePage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Routes>
              </CommandPaletteProvider>
            </ArenaProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </MotionConfig>
  )
}
