import { useEffect, useReducer, useRef, useState } from 'react'
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
import { initialState, reducer } from './engine'
import { isMuted, play, setMuted } from './sfx'

const STORAGE_KEY = 'screw-vcs-v2'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...initialState(), ...JSON.parse(raw) } : initialState()
  } catch {
    return initialState()
  }
}

const TONE_SFX = { neon: 'approve', hot: 'decline', gold: 'warn', cyan: 'click' }
const TOAST = { neon: 'border-neon text-neon', cyan: 'border-cyan text-cyan', hot: 'border-hot text-hot', gold: 'border-gold text-gold' }

export default function App() {
  const [s, dispatch] = useReducer(reducer, undefined, load)
  const [muted, setMutedState] = useState(isMuted)
  const [toasts, setToasts] = useState([])
  const lastLog = useRef(s.log[0]?.id)
  const lastEvent = useRef(s.activeEvent)
  const lastPhase = useRef(s.phase)

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) }, [s])

  useEffect(() => {
    const top = s.log[0]
    if (!top || top.id === lastLog.current) return
    const fresh = []
    for (const l of s.log) { if (l.id === lastLog.current) break; fresh.push(l) }
    lastLog.current = top.id
    play(TONE_SFX[top.tone])
    setToasts((t) => [...t, ...fresh.reverse()].slice(-4))
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

  const toggleMute = () => { setMuted(!muted); setMutedState(!muted) }
  const blocked = !!s.activeEvent

  return (
    <div className="grid-bg min-h-screen overflow-x-clip">
      <TopBar s={s} dispatch={dispatch} muted={muted} toggleMute={toggleMute} />

      <main className="mx-auto max-w-7xl px-4 py-6">
        {s.phase === 'setup' && (
          <>
            <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-hot/40 bg-hot/5 p-3 text-xs text-slate-300">
                <span className="font-black text-hot">VC money</span> needs no monthly repayment, but it dilutes ownership and can add investor governance rights such as board seats.
              </div>
              <div className="rounded-xl border border-gold/40 bg-gold/5 p-3 text-xs text-slate-300">
                <span className="font-black text-gold">27 days:</span> the median small business held about 27 days of cash reserves to cover outflows if revenue stopped (JPMorgan Chase Institute, 2016).
              </div>
              <div className="rounded-xl border border-neon/40 bg-neon/5 p-3 text-xs italic text-slate-300">
                “Because it's easier to borrow $10M than to earn it.” <span className="not-italic font-bold text-neon">Donna L. Fox</span>
                <span className="not-italic text-slate-500"> Borrowing is only half the game: you still have to pay it back.</span>
              </div>
            </div>
            <Setup s={s} dispatch={dispatch} />
          </>
        )}

        {s.phase === 'fund' && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Underwriting s={s} dispatch={dispatch} blocked={blocked} />
            <Squad s={s} dispatch={dispatch} locked={blocked} />
            <div className="lg:col-span-2"><FinanceCards s={s} dispatch={dispatch} blocked={blocked} /></div>
            <CardStacking s={s} dispatch={dispatch} blocked={blocked} />
            <div className="space-y-5">
              <Ledger s={s} dispatch={dispatch} blocked={blocked} />
              <JVMatch s={s} dispatch={dispatch} blocked={blocked} />
            </div>
          </div>
        )}

        {s.phase === 'boss' && <Boss s={s} dispatch={dispatch} />}
        {s.phase === 'results' && s.result && <Results s={s} dispatch={dispatch} />}

        <footer className="mt-10 border-t border-edge pt-4 text-center text-[10px] leading-relaxed text-slate-500">
          Educational simulation. The game does not approve loans, create binding offers, or match you with verified capital partners. Scores, approvals, limits, and forecasts are illustrative mock rules, not Experian or lender decisions.
          0% intro APR periods expire; business credit usually requires a personal guarantee; multiple entities do not automatically multiply borrowing capacity; authorized-user tradelines do not guarantee score changes; founder pay from loan proceeds must fit lender terms.
          <br />Powered by <a href="https://nationwidebusinessfunding.com" target="_blank" rel="noreferrer" className="text-cyan hover:underline">NationwideBusinessFunding.com</a>, Fractional Chief Capital Officer Platform.
          <button onClick={() => { if (window.confirm('Reset everything?')) dispatch({ type: 'RESET' }) }} className="ml-2 text-slate-600 underline hover:text-hot">Reset all</button>
        </footer>
      </main>

      <EventModal s={s} dispatch={dispatch} />

      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-in rounded-lg border-l-4 bg-panel/95 px-3 py-2 text-xs font-bold shadow-lg ${TOAST[t.tone]}`}>{t.text}</div>
        ))}
      </div>
    </div>
  )
}
