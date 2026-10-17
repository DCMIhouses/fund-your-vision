import { useEffect, useState } from 'react'
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
import CommandCenter, { AgentStrip } from './components/CommandCenter'
import PayPage from './components/PayPage'
import Guide from './components/Guide'
import { AchievementToasts, MedalShowcase, TrophyRoom } from './components/Medals'
import { CoinBurst, Hangar, Mascot, QuestMap, Starfield } from './components/Fx'
import { medalCount, rankGem } from './meta'
import useGame from './useGame'

const TABS = [
  ['team', 'Team', 'Recruit your squad'],
  ['underwrite', 'Underwriting', 'Check fundability'],
  ['fund', 'Financing', 'Play power-up cards'],
  ['stack', '0% Card Stack', 'Apply issuer by issuer'],
  ['partners', 'Partners', 'Match a capital partner'],
  ['trophies', 'Trophies', 'Your medals'],
  ['reports', 'Command Center', 'Agents & reports'],
]

const TOAST = { neon: 'border-neon text-neon', cyan: 'border-cyan text-cyan', hot: 'border-hot text-hot', gold: 'border-gold text-gold' }

export default function ClassicApp() {
  const { s, dispatch, meta, updateMeta, collection, book, meetPartner, medalQueue, dropMedal, toasts, burst, muted, toggleMute, today } = useGame()
  const [tab, setTab] = useState('team')
  const tabIdx = TABS.findIndex(([id]) => id === tab)
  const blocked = !!s.activeEvent
  const [route, setRoute] = useState(() => window.location.hash.slice(1))
  useEffect(() => {
    const on = () => { setRoute(window.location.hash.slice(1)); window.scrollTo({ top: 0 }) }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const onPay = route === 'pay'

  return (
    <div className="grid-bg min-h-screen overflow-x-clip">
      <div className="aurora" aria-hidden="true" />
      <Starfield />
      <header className="relative overflow-hidden border-b border-purple-500/30 bg-gradient-to-b from-sky-500/10 via-ink to-ink px-4 py-6 text-center sm:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(56,189,248,.18),transparent_55%),radial-gradient(ellipse_at_50%_50%,rgba(251,191,36,.12),transparent_55%),radial-gradient(ellipse_at_70%_40%,rgba(168,85,247,.2),transparent_55%)]" />
        <h1 className="relative mx-auto w-full max-w-[min(520px,85vw)]">
          <img src={`${import.meta.env.BASE_URL}fyv-logo.png`} alt="FYV: Fund Your Vision, The Startup Survival Game" className="medal-pop mx-auto w-full drop-shadow-[0_0_40px_rgba(168,85,247,.35)]" />
        </h1>
        <div className="relative mt-3 bg-gradient-to-r from-sky-400 via-gold to-fuchsia-400 bg-clip-text text-xl font-black uppercase tracking-wide text-transparent sm:text-3xl">$10,000 to $1 Million to Fund Your Dream</div>
        <div className="relative mt-2 text-xs text-slate-400 sm:text-sm">Powered by <span className="font-semibold text-cyan">NationwideBusinessFunding.com</span> · Fractional Chief Capital Officer Platform</div>
      </header>
      {!onPay && <TopBar s={s} dispatch={dispatch} muted={muted} toggleMute={toggleMute} meta={meta} />}

      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        {onPay && <PayPage onBack={() => { window.location.hash = '' }} />}
        {!onPay && <>
        {s.phase === 'setup' && (
          <>
            <Guide id="overview" />
            <Hangar meta={meta} s={s} dispatch={dispatch} today={today} collection={collection} />
            <MedalShowcase collection={collection} meta={meta} update={updateMeta} />
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
              <QuestMap tabs={TABS} tab={tab} setTab={setTab} s={s} skin={rankGem(meta, medalCount(collection)).id} />
              <div key={tab} className="fade-up">
              {tab === 'team' && <Squad s={s} dispatch={dispatch} locked={blocked} />}
              {tab === 'underwrite' && <Underwriting s={s} dispatch={dispatch} blocked={blocked} />}
              {tab === 'fund' && <FinanceCards s={s} dispatch={dispatch} blocked={blocked} goTo={setTab} />}
              {tab === 'stack' && <CardStacking s={s} dispatch={dispatch} blocked={blocked} />}
              {tab === 'partners' && <><JVMatch s={s} dispatch={dispatch} blocked={blocked} onMeet={meetPartner} /><div className="mt-8"><PartnerBinder book={book} /></div></>}
              {tab === 'trophies' && <TrophyRoom s={s} collection={collection} />}
              {tab === 'reports' && <CommandCenter s={s} goTo={(t) => { setTab(t); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />}
              </div>
              {tabIdx < TABS.length - 1 && (
                <button onClick={() => { setTab(TABS[tabIdx + 1][0]); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className="mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-neon/50 text-sm font-black uppercase tracking-wider text-neon hover:bg-neon/10">
                  Next: {TABS[tabIdx + 1][1]} →
                </button>
              )}
            </div>
            <aside className="lg:sticky lg:top-56 lg:max-h-[calc(100vh-15rem)] lg:self-start lg:overflow-y-auto">
              <AgentStrip s={s} onOpen={() => { setTab('reports'); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
              <Ledger s={s} dispatch={dispatch} blocked={blocked} />
            </aside>
          </div>
        )}

        {s.phase === 'boss' && <div className="fade-up"><Boss s={s} dispatch={dispatch} /><div className="mt-10"><CommandCenter s={s} /></div></div>}
        {s.phase === 'results' && s.result && <><Results s={s} dispatch={dispatch} /><div className="mt-10"><CommandCenter s={s} /></div></>}
        {s.phase !== 'fund' && s.phase !== 'setup' && <div className="mt-10"><TrophyRoom s={s} collection={collection} /></div>}

        </>}

        <footer className="mt-10 border-t border-edge pt-4 text-center text-[10px] leading-relaxed text-slate-500">
          Educational simulation. The game does not approve loans, create binding offers, or match you with verified capital partners. Scores, approvals, limits, and forecasts are illustrative mock rules, not Experian or lender decisions.
          0% intro APR periods expire; business credit usually requires a personal guarantee; multiple entities do not automatically multiply borrowing capacity; authorized-user tradelines do not guarantee score changes; founder pay from loan proceeds must fit lender terms.
          <br />Powered by <a href="https://nationwidebusinessfunding.com" target="_blank" rel="noreferrer" className="text-cyan hover:underline">NationwideBusinessFunding.com</a>, Fractional Chief Capital Officer Platform.
          <a href="#pay" className="ml-2 font-bold text-gold hover:underline">Make a payment</a>
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
