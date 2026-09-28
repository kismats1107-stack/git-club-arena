import { Footer } from '../../components/Footer'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { Hero } from './Hero'
import { Enter, HowItWorksStory, Scoring, Story } from './Sections'
import './landing.css'

/**
 * The front door: 3D hero → product story → how it works → how scoring works → enter.
 * Always dark ("force-dark" re-themes shared components such as the footer).
 */
export function LandingPage() {
  useDocumentTitle()
  return (
    <div className="landing force-dark">
      <a
        href="#story"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[500] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-black"
      >
        Skip to the story
      </a>
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <Story />
        <HowItWorksStory />
        <Scoring />
        <Enter />
      </main>
      <Footer />
    </div>
  )
}
