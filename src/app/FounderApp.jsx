import { useEffect, useMemo, useState } from 'react'
import useGame from './useGame'
import { useHashRoute } from './router'
import { buildReport } from '../report'
import { agentStates } from '../agents'
import { fmt } from '../game'
import { NBF_URL, currentMission, JOURNEY, moneyPicture, ownershipInfo, runwayInfo } from '../shared/gameSelectors'
import { SIM_NOTE, Term } from '../shared/ui'
import Welcome from '../features/onboarding/Welcome'
import QuickStart from '../features/onboarding/QuickStart'
import PlayScreen from '../features/game/PlayScreen'
import EventSheet from '../features/game/EventSheet'
import BusinessScreen from '../features/business/BusinessScreen'
import BlueprintScreen from '../features/blueprint/BlueprintScreen'
import ResultsScreen from '../features/results/ResultsScreen'
import MoreScreen from '../features/more/MoreScreen'
import PayPage from '../components/PayPage'
import { AchievementToasts } from '../components/Medals'

const NAV = [['/play', 'Play'], ['/business', 'My Business'], ['/blueprint', 'Blueprint']]
const GAME_ROUTES = ['/play', '/business', '/blueprint', '/results']
const pref = (k, d) => { try { return localStorage.getItem(k) ?? d } catch { return d } }

function Kpis({ s }) {
  const [open, setOpen] = useState(false)
  const m = moneyPicture(s)
  const r = runwayInfo(s)
  const o = ownershipInfo(s)
  const runway = r.days >= 60 ? `${(r.days / 30).toFixed(1)} mo` : `${r.days} days`
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex min-h-[44px] items-center gap-4 rounded-[12px] px-2 text-left hover:bg-fos-soft sm:gap-6">
        <span><span className="block text-[12px] text-fos-muted">Cash available</span><span className="fos-num block text-[15px] font-semibold">{fmt(m.cash)}</span></span>
        <span><span className="block text-[12px] text-fos-muted">Runway</span><span className={`fos-num block text-[15px] font-semibold ${r.days < 90 ? 'text-fos-risk' : ''}`}>{runway}</span></span>
        <span className="hidden sm:block"><span className="block text-[12px] text-fos-muted">You own</span><span className="fos-num block text-[15px] font-semibold">{(o.founder * 100).toFixed(1)}%</span></span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-[min(340px,calc(100vw-2rem))] rounded-[18px] border border-fos-line bg-fos-surface p-4 text-sm fos-shadow">
          {[['Funding goal progress', `${fmt(m.available)} of ${fmt(m.target)}`], ['Promised, not in bank yet', fmt(m.pendingAmount)], ['Freed-up expenses (not cash)', fmt(m.freed)], ['Borrowed (must be repaid)', fmt(m.borrowed)], ['Monthly spending', fmt(r.burn)], ['You own', `${(o.founder * 100).toFixed(1)}%`]].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 py-1"><span className="text-fos-muted">{k}</span><span className="fos-num font-semibold">{v}</span></div>
          ))}
          <p className="mt-2 text-[12px] text-fos-muted"><Term k="runway">Runway</Term> is estimated under this scenario.</p>
        </div>
      )}
    </div>
  )
}

export default function FounderApp() {
  const g = useGame()
  const { s, dispatch } = g
  const [route, go] = useHashRoute()
  const [depth, setDepth] = useState(s.mode === 'tournament' ? 'tournament' : 'quick')
  const [theme, setThemeState] = useState(() => pref('fyv-theme', 'light'))
  const [reduceMotion, setReduceState] = useState(() => pref('fyv-reduce-motion', window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? '1' : '0') === '1')
  const [dismissedEvent, setDismissedEvent] = useState(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const eventOpen = !!s.activeEvent && dismissedEvent !== `${s.activeEvent}:${s.resolvedEvents.length}`
  const setEventOpen = (v) => setDismissedEvent(v ? null : `${s.activeEvent}:${s.resolvedEvents.length}`)
  const setTheme = (t) => { setThemeState(t); localStorage.setItem('fyv-theme', t) }
  const setReduceMotion = (v) => { setReduceState(v); localStorage.setItem('fyv-reduce-motion', v ? '1' : '0') }
  const inGame = s.phase !== 'setup'
  const report = useMemo(() => (inGame ? buildReport(s) : null), [s, inGame])
  const agents = useMemo(() => (report ? agentStates(report) : []), [report])
  const mission = inGame ? currentMission(s) : null

  useEffect(() => {
    if (!inGame && GAME_ROUTES.includes(route)) go('/', { replace: true })
    else if (route === '/results' && s.phase !== 'results') go('/play', { replace: true })
  }, [route, inGame, s.phase, go])
  useEffect(() => { const bg = document.body.style.background; document.body.style.background = theme === 'dark' ? '#0E141D' : '#F7F8FA'; return () => { document.body.style.background = bg } }, [theme])

  const startNew = () => {
    if (inGame && !window.confirm('Start a new business? Your current run will be replaced. Medals and points stay.')) return
    if (inGame || s.mode === 'tournament') dispatch({ type: 'SET_MODE', mode: 'arcade' })
    setDepth('quick')
    go('/new')
  }
  const sample = () => {
    if (inGame && !window.confirm('Load the sample startup? Your current run will be replaced.')) return
    dispatch({ type: 'SET_MODE', mode: 'arcade' })
    dispatch({ type: 'LOAD_SCENARIO', id: 'diversified' })
    dispatch({ type: 'START' })
    go('/play')
  }

  const showNav = inGame && GAME_ROUTES.includes(route)
  let body
  if (route === 'pay') body = <div className="mx-auto max-w-4xl px-4 py-6"><div className="rounded-[22px] bg-[#05070d] p-4 text-slate-200"><PayPage onBack={() => go(inGame ? '/play' : '/')} /></div></div>
  else if (route === '/new') body = <QuickStart s={s} dispatch={dispatch} depth={depth} setDepth={setDepth} onDone={() => go('/play')} onBack={() => go('/')} />
  else if (route === '/more') body = <MoreScreen s={s} dispatch={dispatch} go={go} {...g} theme={theme} setTheme={setTheme} reduceMotion={reduceMotion} setReduceMotion={setReduceMotion} />
  else if (inGame && route === '/business') body = <BusinessScreen s={s} dispatch={dispatch} report={report} book={g.book} />
  else if (inGame && route === '/blueprint') body = <BlueprintScreen s={s} report={report} />
  else if (inGame && (route === '/results' || (route === '/play' && s.phase === 'results'))) body = <ResultsScreen s={s} dispatch={dispatch} report={report} go={go} />
  else if (inGame && route === '/play') body = <PlayScreen s={s} dispatch={dispatch} go={go} report={report} agents={agents} reduceMotion={reduceMotion} onOpenEvent={() => setEventOpen(true)} onSheet={setSheetOpen} />
  else body = <Welcome hasSave={inGame} saveName={s.startup.name} onStart={startNew} onSample={sample} onContinue={() => go(s.phase === 'results' ? '/results' : '/play')} />

  return (
    <div className={`fos ${reduceMotion ? 'fos-reduce' : ''} ${showNav ? 'pb-24 lg:pb-0' : ''}`} data-theme={theme}>
      <a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>
      <header className="sticky top-0 z-30 border-b border-fos-line bg-fos-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => go('/')} className="min-h-[44px] text-[17px] font-bold tracking-tight" aria-label="FUND YOUR VISION home">FYV</button>
            {inGame && <div className="hidden min-w-0 sm:block"><div className="truncate text-[15px] font-semibold">{s.startup.name}</div><div className="text-[12px] text-fos-muted">{JOURNEY[mission.step]} · Month {Math.min(s.resolvedEvents.length + 1, 12)}{s.mode === 'tournament' ? ' · Tournament' : ''}</div></div>}
          </div>
          {showNav && (
            <nav aria-label="Main" className="hidden rounded-[14px] bg-fos-soft p-1 lg:flex">
              {NAV.map(([p, l]) => <a key={p} href={`#${p}`} aria-current={route === p ? 'page' : undefined} className={`min-h-[40px] rounded-[11px] px-4 py-2 text-[15px] font-semibold ${route === p || (p === '/play' && route === '/results') ? 'bg-fos-surface fos-shadow' : 'text-fos-muted hover:text-fos-ink'}`}>{l}</a>)}
            </nav>
          )}
          <div className="flex items-center gap-1">
            {inGame && <Kpis s={s} />}
            <button onClick={g.toggleMute} aria-label={g.muted ? 'Turn sound on' : 'Turn sound off'} aria-pressed={!g.muted} className="grid h-11 w-11 place-items-center rounded-full text-fos-muted hover:bg-fos-soft"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" />{g.muted ? <path d="m16 9 5 6m0-6-5 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />}</svg></button>
            <a href="#/more" aria-label="Profile and more" className="grid h-11 w-11 place-items-center rounded-full text-fos-muted hover:bg-fos-soft"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg></a>
          </div>
        </div>
      </header>

      <main id="main">{body}</main>

      {showNav && (
        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-fos-line bg-fos-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
          {NAV.map(([p, l]) => <a key={p} href={`#${p}`} aria-current={route === p ? 'page' : undefined} className={`flex min-h-[60px] items-center justify-center text-[15px] font-semibold ${route === p ? 'text-fos-ink' : 'text-fos-muted'}`}>{route === p && <span aria-hidden="true" className="mr-1.5 h-1.5 w-1.5 rounded-full bg-fos-gold" />}{l}</a>)}
        </nav>
      )}

      <footer className="mx-auto max-w-[1400px] px-4 pb-8 pt-4 text-[12px] leading-relaxed text-fos-muted sm:px-6">
        {SIM_NOTE} Approvals, limits, scores and forecasts are illustrative game rules, not lender or credit-bureau decisions. 0% intro periods expire; business credit usually needs a personal guarantee; extra business entities do not automatically multiply borrowing; authorized-user accounts do not guarantee score changes.
        {' '}Presented by <a href={NBF_URL} target="_blank" rel="noreferrer" className="underline">Nationwide Business Funding</a>.
      </footer>

      {inGame && <EventSheet s={s} dispatch={dispatch} open={eventOpen && !sheetOpen && GAME_ROUTES.includes(route)} onClose={() => setEventOpen(false)} />}
      <AchievementToasts queue={g.medalQueue} onDone={g.dropMedal} />
    </div>
  )
}
