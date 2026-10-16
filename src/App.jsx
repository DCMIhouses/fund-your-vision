import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import TopBar from './components/TopBar'
import Setup from './components/Setup'
import Underwriting from './components/Underwriting'
import FinanceCards from './components/FinanceCards'
import CardStacking from './components/CardStacking'
import JVMatch from './components/JVMatch'
import PartnerBinder from './components/PartnerBinder'
import Squad from './components/Squad'
import Ledger from './components/Ledger'
import EventModal from './components/EventModal'
import Boss from './components/Boss'
import Results from './components/Results'
import { initialState } from './engine'
import { gameReducer } from './store'
import Guide from './components/Guide'
import { AchievementToasts, MedalShowcase, TrophyRoom } from './components/Medals'
import { isMuted, play, setMuted } from './sfx'
import { CoinBurst, Hangar, Mascot, QuestMap, Starfield } from './components/Fx'
import { MEDAL_POINTS, bumpStreak, dailyName, dayKey, loadMeta, runAward, saveMeta } from './meta'
import { totals } from './engine'
import { achievementById } from './achievements'

const STORAGE_KEY = 'fyv-game-v3'
const TROPHY_KEY = 'fyv-trophies'
const PARTNER_KEY = 'fyv-partners'
const loadBook = () => { try { return JSON.parse(localStorage.getItem(PARTNER_KEY)) || {} } catch { return {} } }
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
  const [s, rawDispatch] = useReducer(gameReducer, undefined, load)
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
  const [meta, setMetaState] = useState(loadMeta)
  const [today] = useState(() => dayKey())
  const updateMeta = useCallback((m) => { setMetaState(m); saveMeta(m) }, [])
  const [book, setBook] = useState(loadBook)
  const updateBook = useCallback((id, patch) => setBook((b) => {
    if (b[id] && Object.keys(patch).every((k) => b[id][k])) return b
    const next = { ...b, [id]: { ...patch, ...b[id] } }
    localStorage.setItem(PARTNER_KEY, JSON.stringify(next))
    return next
  }), [])
  const meetPartner = useCallback((id) => updateBook(id, { met: Date.now() }), [updateBook])
  const dispatch = useCallback((a) => {
    if (a.type === 'PLAY' && a.card === 'partner' && gameReducer(s, a).funding.some((f) => f.partnerId === a.partnerId)) updateBook(a.partnerId, { met: Date.now(), signed: Date.now() })
    if (a.type === 'START' && s.phase === 'setup') updateMeta(bumpStreak(meta, today))
    if (a.type === 'BOSS' && s.phase === 'boss') {
      const next = gameReducer(s, a)
      if (next.result) {
        const isDaily = s.startup.name === dailyName(today)
        updateMeta({ ...meta, points: meta.points + runAward(next.result.score, isDaily && meta.dailyDone !== today, meta.streak), dailyDone: isDaily ? today : meta.dailyDone })
      }
    }
    rawDispatch(a)
  }, [s, meta, today, updateMeta, updateBook])
  const available = totals(s).available
  const lastAvail = useRef(available)
  const [burst, setBurst] = useState(null)

  useEffect(() => {
    const gain = available - lastAvail.current
    lastAvail.current = available
    if (gain <= 0 || s.phase !== 'fund') return
    play('coin')
    const id = Date.now()
    setBurst({ id, amount: gain })
    const t = setTimeout(() => setBurst((b) => (b?.id === id ? null : b)), 1700)
    return () => clearTimeout(t)
  }, [available, s.phase])

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) }, [s])

  useEffect(() => {
    const fresh = s.achievements.filter((id) => !seenMedals.current.includes(id))
    const levelUp = s.level > seenLevel.current && s.level > 0 ? [`level:${s.level}`] : []
    seenMedals.current = s.achievements
    seenLevel.current = s.level
    if (!fresh.length && !levelUp.length) return
    play(fresh.some((id) => achievementById[id]?.rarity === 'legendary') ? 'legendary' : 'victory')
    const pts = fresh.reduce((n, id) => n + (MEDAL_POINTS[achievementById[id]?.rarity] || 0), 0)
    if (pts) setMetaState((m) => { const next = { ...m, points: m.points + pts }; saveMeta(next); return next })
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
      <Starfield />
      <header className="relative overflow-hidden border-b border-purple-500/30 bg-gradient-to-b from-sky-500/10 via-ink to-ink px-4 py-6 text-center sm:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(56,189,248,.18),transparent_55%),radial-gradient(ellipse_at_50%_50%,rgba(251,191,36,.12),transparent_55%),radial-gradient(ellipse_at_70%_40%,rgba(168,85,247,.2),transparent_55%)]" />
        <h1 className="relative mx-auto w-full max-w-[min(520px,85vw)]">
          <img src="/fyv-logo.png" alt="FYV: Fund Your Vision, The Startup Survival Game" className="medal-pop mx-auto w-full drop-shadow-[0_0_40px_rgba(168,85,247,.35)]" />
        </h1>
        <div className="relative mt-3 bg-gradient-to-r from-sky-400 via-gold to-fuchsia-400 bg-clip-text text-xl font-black uppercase tracking-wide text-transparent sm:text-3xl">$10,000 to $1 Million to Fund Your Dream</div>
        <div className="relative mt-2 text-xs text-slate-400 sm:text-sm">Powered by <span className="font-semibold text-cyan">NationwideBusinessFunding.com</span> · Fractional Chief Capital Officer Platform</div>
      </header>
      <TopBar s={s} dispatch={dispatch} muted={muted} toggleMute={toggleMute} meta={meta} />

      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        {s.phase === 'setup' && (
          <>
            <Guide id="overview" />
            <Hangar meta={meta} update={updateMeta} s={s} dispatch={dispatch} today={today} collection={collection} />
            <MedalShowcase collection={collection} />
            <div className="mb-8"><PartnerBinder book={book} /></div>
            <Setup s={s} dispatch={dispatch} />
            <div className="mt-8 rounded-2xl border border-hot/40 bg-hot/5 p-4 text-sm leading-relaxed text-slate-300">
              <span className="font-black text-hot">VC money</span> needs no monthly repayment, but it dilutes ownership and can add investor governance rights such as board seats.
            </div>
          </>
        )}

        {s.phase === 'fund' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="min-w-0">
              <QuestMap tabs={TABS} tab={tab} setTab={setTab} s={s} skin={meta.skin} />
              <div key={tab} className="fade-up">
              {tab === 'team' && <Squad s={s} dispatch={dispatch} locked={blocked} />}
              {tab === 'underwrite' && <Underwriting s={s} dispatch={dispatch} blocked={blocked} />}
              {tab === 'fund' && <FinanceCards s={s} dispatch={dispatch} blocked={blocked} goTo={setTab} />}
              {tab === 'stack' && <CardStacking s={s} dispatch={dispatch} blocked={blocked} />}
              {tab === 'partners' && <><JVMatch s={s} dispatch={dispatch} blocked={blocked} onMeet={meetPartner} /><div className="mt-8"><PartnerBinder book={book} /></div></>}
              {tab === 'trophies' && <TrophyRoom s={s} collection={collection} />}
              </div>
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

        {s.phase === 'boss' && <div className="fade-up"><Boss s={s} dispatch={dispatch} /></div>}
        {s.phase === 'results' && s.result && <Results s={s} dispatch={dispatch} />}
        {s.phase !== 'fund' && s.phase !== 'setup' && <div className="mt-10"><TrophyRoom s={s} collection={collection} /></div>}

        <footer className="mt-10 border-t border-edge pt-4 text-center text-[10px] leading-relaxed text-slate-500">
          Educational simulation. The game does not approve loans, create binding offers, or match you with verified capital partners. Scores, approvals, limits, and forecasts are illustrative mock rules, not Experian or lender decisions.
          0% intro APR periods expire; business credit usually requires a personal guarantee; multiple entities do not automatically multiply borrowing capacity; authorized-user tradelines do not guarantee score changes; founder pay from loan proceeds must fit lender terms.
          <br />Powered by <a href="https://nationwidebusinessfunding.com" target="_blank" rel="noreferrer" className="text-cyan hover:underline">NationwideBusinessFunding.com</a>, Fractional Chief Capital Officer Platform.
          <button onClick={() => { if (window.confirm('Reset everything?')) dispatch({ type: 'RESET' }) }} className="ml-2 text-slate-600 underline hover:text-hot">Reset all</button>
        </footer>
      </main>

      <EventModal s={s} dispatch={dispatch} />
      <AchievementToasts queue={medalQueue} onDone={dropMedal} />
      <CoinBurst burst={burst} />
      <Mascot s={s} meta={meta} collection={collection} />

      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2 max-md:[&>*:not(:last-child)]:hidden">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-in rounded-lg border-l-4 bg-panel/95 px-3 py-2 text-xs font-bold shadow-lg ${TOAST[t.tone]}`}>{t.text}</div>
        ))}
      </div>
    </div>
  )
}
