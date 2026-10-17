import { useEffect, useState } from 'react'
import useGame from '../useGame'
import EventModal from '../components/EventModal'
import PayPage from '../components/PayPage'
import { AchievementToasts } from '../components/Medals'
import { CoinBurst } from '../components/Fx'
import Welcome from './Welcome'
import QuickStart from './QuickStart'
import Play from './Play'
import Business from './Business'
import Blueprint from './Blueprint'
import More from './More'
import TopNav from './TopNav'
import LeadForm from './LeadForm'
import { go } from './ui'

const GAME = ['play', 'business', 'blueprint', 'more', 'results']
const parse = () => window.location.hash.replace(/^#\/?/, '').split('?')[0]
const TOAST = { neon: 'border-neon text-neon', cyan: 'border-cyan text-cyan', hot: 'border-hot text-hot', gold: 'border-gold text-gold' }

function HelpPage({ s }) {
  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => (window.history.length > 1 ? window.history.back() : go(''))} className="text-sm font-bold text-cyan hover:underline">← Back</button>
      <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">Get real funding help</h1>
      <p className="mt-2 text-slate-400">Talk to Nationwide Business Funding about your real business. This is separate from the game: nothing here is a loan application or an approval.</p>
      <div className="mt-6"><LeadForm s={s} /></div>
    </div>
  )
}

export default function Shell() {
  const g = useGame()
  const { s, dispatch, medalQueue, dropMedal, toasts, burst } = g
  const [route, setRoute] = useState(parse)
  useEffect(() => {
    const on = () => { setRoute(parse()); window.scrollTo({ top: 0 }) }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const inGame = GAME.includes(route)
  const needsGame = inGame && route !== 'more' && s.phase === 'setup'
  useEffect(() => { if (needsGame) window.location.replace('#/new') }, [needsGame])

  let view
  if (route === 'pay') view = <PayPage onBack={() => (window.history.length > 1 ? window.history.back() : go(''))} />
  else if (route === 'new') view = <QuickStart g={g} />
  else if (route === 'help') view = <HelpPage s={s} />
  else if (route === 'business') view = <Business g={g} />
  else if (route === 'blueprint') view = <Blueprint g={g} />
  else if (route === 'more') view = <More g={g} />
  else if (inGame) view = <Play g={g} />
  else view = <Welcome g={g} />

  return (
    <div className="grid-bg min-h-screen overflow-x-clip">
      {inGame && <TopNav g={g} route={route === 'results' ? 'play' : route} />}
      <main className={`relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8 ${inGame ? 'pb-28 md:pb-10' : ''}`}>
        {view}
        <footer className="mt-12 border-t border-edge pt-4 text-center text-[11px] leading-relaxed text-slate-500">
          Free educational simulation. No real loan applications. The game does not approve loans, make binding offers, or match you with verified partners. Scores, limits and forecasts are illustrative.
          The office advisors are simulated and rule-based, not live AI.
          <br />Presented by <a href="https://nationwidebusinessfunding.com" target="_blank" rel="noreferrer" className="text-cyan hover:underline">Nationwide Business Funding</a>
          <span className="mx-2">·</span><a href="#/help" className="text-cyan hover:underline">Real funding help</a>
          <span className="mx-2">·</span><a href="#pay" className="text-slate-400 hover:underline">Make a payment</a>
          <span className="mx-2">·</span><a href="?ui=classic" className="text-slate-400 hover:underline">Classic view</a>
        </footer>
      </main>
      {inGame && <EventModal s={s} dispatch={dispatch} />}
      <AchievementToasts queue={medalQueue} onDone={dropMedal} />
      {inGame && <CoinBurst burst={burst} />}
      <div className="pointer-events-none fixed bottom-24 right-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2 md:bottom-4 max-md:[&>*:not(:last-child)]:hidden">
        {inGame && toasts.map((t) => (
          <div key={t.id} className={`toast-in rounded-lg border-l-4 bg-panel/95 px-3 py-2 text-xs font-bold shadow-lg ${TOAST[t.tone]}`}>{t.text}</div>
        ))}
      </div>
    </div>
  )
}
