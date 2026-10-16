import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import TopBar from './components/TopBar'
import Setup from './components/Setup'
import Underwriting from './components/Underwriting'
import FinanceCards from './components/FinanceCards'
import CardStacking from './components/CardStacking'
import JVMatch from './components/JVMatch'
import Squad from './components/Squad'
import Ledger from './components/Ledger'
import EventModal from './components/EventModal'
import Boss from './components/Boss'
import Results from './components/Results'
import { initialState } from './engine'
import { gameReducer } from './store'
import { AchievementToasts, TrophyRoom } from './components/Medals'
import { isMuted, play, setMuted } from './sfx'

const STORAGE_KEY = 'fyv-game-v3'
const TROPHY_KEY = 'fyv-trophies'
const loadTrophies = () => { try { return JSON.parse(localStorage.getItem(TROPHY_KEY)) || {} } catch { return {} } }

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...initialState(), ...JSON.parse(raw) } : initialState()
  } catch {
    return initialState()
  }
}

const TABS = [
  ['team', 'Team', 'Recruit your squad'],
  ['underwrite', 'Underwriting', 'Check fundability'],
  ['fund', 'Financing', 'Play power-up cards'],
  ['stack', '0% Card Stack', 'Apply issuer by issuer'],
  ['partners', 'Partners', 'Match a capital partner'],
  ['trophies', 'Trophies', 'Your medals'],
]

const TONE_SFX = { neon: 'approve', hot: 'decline', gold: 'warn', cyan: 'click' }
const TOAST = { neon: 'border-neon text-neon', cyan: 'border-cyan text-cyan', hot: 'border-hot text-hot', gold: 'border-gold text-gold' }

export default function App() {
  const [s, dispatch] = useReducer(gameReducer, undefined, load)
  const [collection, setCollection] = useState(loadTrophies)
  const [tab, setTab] = useState('team')
  const tabIdx = TABS.findIndex(([id]) => id === tab)
  const [medalQueue, setMedalQueue] = useState([])
  const seenMedals = useRef(s.achievements)
  const seenLevel = useRef(s.level)
  const [muted, setMutedState] = useState(isMuted)
  const [toasts, setToasts] = useState([])
  const lastLog = useRef(s.log[0]?.id)
  const lastEvent = useRef(s.activeEvent)
  const lastPhase = useRef(s.phase)

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) }, [s])

  useEffect(() => {
    const fresh = s.achievements.filter((id) => !seenMedals.current.includes(id))
    const levelUp = s.level > seenLevel.current && s.level > 0 ? [`level:${s.level}`] : []
    seenMedals.current = s.achievements
    seenLevel.current = s.level
    if (!fresh.length && !levelUp.length) return
    play('victory')
    setMedalQueue((q) => [...q, ...levelUp, ...fresh])
    setCollection((c) => {
      const next = { ...c }
      for (const id of fresh) next[id] = next[id] || Date.now()
      localStorage.setItem(TROPHY_KEY, JSON.stringify(next))
      return next
    })
  }, [s.achievements, s.level])

  useEffect(() => {
    const top = s.log[0]
    if (!top || top.id === lastLog.current) return
    const fresh = []
    for (const l of s.log) { if (l.id === lastLog.current) break; fresh.push(l) }
    lastLog.current = top.id
    play(TONE_SFX[top.tone])
    setToasts((t) => [...t, ...fresh.reverse()].slice(-2))
    const ids = fresh.map((f) => f.id)
    setTimeout(() => setToasts((t) => t.filter((x) => !ids.includes(x.id))), 3200)
  }, [s.log])

  useEffect(() => {
    if (s.activeEvent && s.activeEvent !== lastEvent.current) play('event')
    lastEvent.current = s.activeEvent
  }, [s.activeEvent])

  useEffect(() => {
    if (s.phase !== lastPhase.current) {
      if (s.phase === 'results') play(s.result?.outcome === 'victory' ? 'victory' : 'fail')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    lastPhase.current = s.phase
  }, [s.phase, s.result])

  const dropMedal = useCallback((id) => setMedalQueue((q) => q.filter((x) => x !== id)), [])
  const toggleMute = () => { setMuted(!muted); setMutedState(!muted) }
  const blocked = !!s.activeEvent

  return (
    <div className="grid-bg min-h-screen overflow-x-clip">
      <header className="relative overflow-hidden border-b border-purple-500/30 bg-gradient-to-b from-sky-500/10 via-ink to-ink px-4 py-6 text-center sm:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(56,189,248,.18),transparent_55%),radial-gradient(ellipse_at_50%_50%,rgba(251,191,36,.12),transparent_55%),radial-gradient(ellipse_at_70%_40%,rgba(168,85,247,.2),transparent_55%)]" />
        <h1 className="relative mx-auto w-full max-w-[min(520px,85vw)]">
          <img src="/fyv-logo.png" alt="FYV: Fund Your Vision, The Startup Survival Game" className="medal-pop mx-auto w-full drop-shadow-[0_0_40px_rgba(168,85,247,.35)]" />
        </h1>
        <div className="relative mt-3 text-xs text-slate-400 sm:text-sm">Powered by <span className="font-semibold text-cyan">NationwideBusinessFunding.com</span> · Fractional Chief Capital Officer Platform</div>
      </header>
      <TopBar s={s} dispatch={dispatch} muted={muted} toggleMute={toggleMute} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        {s.phase === 'setup' && (
          <>
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-hot/40 bg-hot/5 p-4 text-sm leading-relaxed text-slate-300">
                <span className="font-black text-hot">VC money</span> needs no monthly repayment, but it dilutes ownership and can add investor governance rights such as board seats.
              </div>
              <div className="rounded-2xl border border-gold/40 bg-gold/5 p-4 text-sm leading-relaxed text-slate-300">
                <span className="font-black text-gold">27 days:</span> the median small business held about 27 days of cash reserves to cover outflows if revenue stopped (JPMorgan Chase Institute, 2016).
              </div>
              <div className="rounded-2xl border border-neon/40 bg-neon/5 p-4 text-sm leading-relaxed italic text-slate-300">
                “Because it's easier to borrow $10M than to earn it.” <span className="not-italic font-bold text-neon">Donna L. Fox</span>
                <span className="not-italic text-slate-500"> Borrowing is only half the game: you still have to pay it back.</span>
              </div>
            </div>
            <Setup s={s} dispatch={dispatch} />
          </>
        )}

        {s.phase === 'fund' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="min-w-0">
              <nav className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:px-0" aria-label="Workspace">
                {TABS.map(([id, label, hint], i) => (
                  <button key={id} onClick={() => setTab(id)}
                    className={`flex min-h-[52px] shrink-0 items-center gap-3 rounded-2xl border px-4 py-2 text-left transition ${tab === id ? 'border-neon bg-neon/10 text-white' : 'border-edge bg-panel/70 text-slate-400 hover:border-slate-500 hover:text-white'}`}>
                    <span className={`grid h-7 w-7 place-items-center rounded-lg font-mono text-xs font-black ${tab === id ? 'bg-neon text-ink' : 'bg-edge text-slate-300'}`}>{i + 1}</span>
                    <span><span className="block text-sm font-black">{label}</span><span className="block text-xs text-slate-500">{hint}</span></span>
                  </button>
                ))}
              </nav>
              {tab === 'team' && <Squad s={s} dispatch={dispatch} locked={blocked} />}
              {tab === 'underwrite' && <Underwriting s={s} dispatch={dispatch} blocked={blocked} />}
              {tab === 'fund' && <FinanceCards s={s} dispatch={dispatch} blocked={blocked} goTo={setTab} />}
              {tab === 'stack' && <CardStacking s={s} dispatch={dispatch} blocked={blocked} />}
              {tab === 'partners' && <JVMatch s={s} dispatch={dispatch} blocked={blocked} />}
              {tab === 'trophies' && <TrophyRoom s={s} collection={collection} />}
              {tabIdx < TABS.length - 1 && (
                <button onClick={() => { setTab(TABS[tabIdx + 1][0]); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className="mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-neon/50 text-sm font-black uppercase tracking-wider text-neon hover:bg-neon/10">
                  Next: {TABS[tabIdx + 1][1]} →
                </button>
              )}
            </div>
            <aside className="lg:sticky lg:top-56 lg:max-h-[calc(100vh-15rem)] lg:self-start lg:overflow-y-auto">
              <Ledger s={s} dispatch={dispatch} blocked={blocked} />
            </aside>
          </div>
        )}

        {s.phase === 'boss' && <Boss s={s} dispatch={dispatch} />}
        {s.phase === 'results' && s.result && <Results s={s} dispatch={dispatch} />}
        {s.phase !== 'fund' && <div className="mt-10"><TrophyRoom s={s} collection={collection} /></div>}

        <footer className="mt-10 border-t border-edge pt-4 text-center text-[10px] leading-relaxed text-slate-500">
          Educational simulation. The game does not approve loans, create binding offers, or match you with verified capital partners. Scores, approvals, limits, and forecasts are illustrative mock rules, not Experian or lender decisions.
          0% intro APR periods expire; business credit usually requires a personal guarantee; multiple entities do not automatically multiply borrowing capacity; authorized-user tradelines do not guarantee score changes; founder pay from loan proceeds must fit lender terms.
          <br />Powered by <a href="https://nationwidebusinessfunding.com" target="_blank" rel="noreferrer" className="text-cyan hover:underline">NationwideBusinessFunding.com</a>, Fractional Chief Capital Officer Platform.
          <button onClick={() => { if (window.confirm('Reset everything?')) dispatch({ type: 'RESET' }) }} className="ml-2 text-slate-600 underline hover:text-hot">Reset all</button>
        </footer>
      </main>

      <EventModal s={s} dispatch={dispatch} />
      <AchievementToasts queue={medalQueue} onDone={dropMedal} />

      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2 max-md:[&>*:not(:last-child)]:hidden">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-in rounded-lg border-l-4 bg-panel/95 px-3 py-2 text-xs font-bold shadow-lg ${TOAST[t.tone]}`}>{t.text}</div>
        ))}
      </div>
    </div>
  )
}
