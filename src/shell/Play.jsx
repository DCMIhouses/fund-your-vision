import { useEffect, useMemo, useState } from 'react'
import { buildReport } from '../report'
import { agentStates } from '../agents'
import { MIN_EVENTS, totals } from '../engine'
import { FINANCE_CARDS } from '../data'
import { fmt } from '../game'
import AgentOffice from '../components/AgentOffice'
import Boss from '../components/Boss'
import Results from '../components/Results'
import FinanceCards from '../components/FinanceCards'
import CardStacking from '../components/CardStacking'
import JVMatch from '../components/JVMatch'
import Underwriting from '../components/Underwriting'
import Ledger from '../components/Ledger'
import { RealWorldPanel } from './LeadForm'
import { btnGhost, btnPrimary, card, go, kicker } from './ui'

const DOT = { ok: 'bg-neon', watch: 'bg-gold', alert: 'bg-hot' }
const DOORS = [
  { id: 'borrow', icon: '🏦', title: 'Borrow money', cards: ['credit', 'term'], good: 'You keep 100% of your company.', bad: 'You must pay it back, usually with a personal guarantee.' },
  { id: 'partner', icon: '🤝', title: 'Invite an investor or partner', cards: ['vc', 'partner'], good: 'Bigger checks and an expert on your side.', bad: 'You give up some ownership or share profits.' },
  { id: 'customers', icon: '🧾', title: 'Earn money from customers', cards: ['prepay'], good: 'No debt and no ownership given up.', bad: 'You owe those customers the product, on time.' },
  { id: 'less', icon: '✂️', title: 'Use less money', cards: ['savings', 'cut'], good: 'Nothing to repay to a lender.', bad: 'Your own savings are at risk, and cuts can slow growth.' },
]
const ARRIVE = { credit: 'Right away if approved', term: 'About one month after approval', savings: 'Right away', vc: 'After you accept the term sheet', partner: 'After you sign or shake hands', prepay: 'Right away', cut: 'A little each month (lower costs)' }
const ROWS = [['Money this may make available', (c) => c.capital], ['What you must repay or deliver', (c) => c.repayment], ['Ownership you give up', (c) => c.ownership], ['When funds arrive', (c) => ARRIVE[c.id]], ['Risk to your business', (c) => c.risks]]

function mission(s) {
  const t = totals(s)
  const target = s.startup.target
  const conds = s.funding.filter((f) => f.status === 'conditional')
  if (!s.funding.length) return { n: 1, title: 'Make your first funding decision', body: `Your startup needs ${fmt(target)} to launch. Where could the money come from?`, cta: 'Explore my options', act: 'doors' }
  if (conds.length) return { n: 2, title: 'Answer your pending offers', body: `${conds.length} offer${conds.length > 1 ? 's need' : ' needs'} a yes or no, starting with ${conds[0].label}.`, cta: 'Review my offers', act: 'offers' }
  if (t.available < target) {
    if (t.committed >= target) return { n: 3, title: 'Wait for promised money to land', body: `${fmt(t.committed - t.available)} is promised but not in your bank yet. The next month brings it in, and may bring a surprise.`, cta: 'Go to next month', act: 'month' }
    return { n: 2, title: `Raise the rest: ${fmt(target - t.available)} to go`, body: 'Try another kind of money. Mixing sources usually lowers your risk.', cta: 'Compare funding choices', act: 'doors' }
  }
  const need = Math.max(0, MIN_EVENTS - s.resolvedEvents.length)
  if (need) return { n: 4, title: `Handle ${need} more surprise${need > 1 ? 's' : ''}`, body: 'Each month can bring a surprise. Get through them before the cash crunch.', cta: 'Go to next month', act: 'boss' }
  return { n: 5, title: 'Survive the cash crunch', body: 'You raised the money. In month 12 your 0% intro rates end and sales come in lower than hoped. Can you keep paying your bills?', cta: 'Face the cash crunch', act: 'boss' }
}

function DoorSheet({ g, door, setDoor }) {
  const { s, dispatch, meetPartner } = g
  const [sub, setSub] = useState('cards')
  const blocked = !!s.activeEvent
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && setDoor(null)
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [setDoor])
  const d = DOORS.find((x) => x.id === door)
  const cards = d ? FINANCE_CARDS.filter((c) => d.cards.includes(c.id)) : []
  return (
    <div className="fixed inset-0 z-[45] overflow-y-auto bg-black/75 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label="Funding choices">
      <div className="mx-auto max-w-5xl rounded-3xl border border-edge bg-panel p-4 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className={`${kicker} text-gold`}>{d ? 'Funding choice' : 'Where could the money come from?'}</div>
            <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">{d ? `${d.icon} ${d.title}` : 'Pick a door'}</h2>
          </div>
          <button onClick={() => setDoor(null)} className={btnGhost} aria-label="Close">✕ Close</button>
        </div>
        {d && <div className="mt-3 flex flex-wrap gap-2">{DOORS.map((x) => <button key={x.id} onClick={() => setDoor(x.id)} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${x.id === door ? 'border-gold bg-gold/15 text-gold' : 'border-edge text-slate-400 hover:text-white'}`}>{x.icon} {x.title}</button>)}</div>}
        {!d && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {DOORS.map((x) => (
              <button key={x.id} onClick={() => setDoor(x.id)} className="rounded-3xl border border-edge bg-ink/60 p-5 text-left transition hover:border-gold">
                <div className="text-3xl">{x.icon}</div>
                <div className="mt-2 text-lg font-black text-white">{x.title}</div>
                <div className="mt-2 text-sm text-neon">✓ {x.good}</div>
                <div className="mt-1 text-sm text-hot">✗ {x.bad}</div>
              </button>
            ))}
          </div>
        )}
        {d && sub === 'cards' && (
          <div className="mt-5 space-y-6">
            <div className="overflow-x-auto rounded-2xl border border-edge">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead><tr className="bg-ink/70"><th className="p-3 text-xs uppercase tracking-wider text-slate-500">Compare</th>{cards.map((c) => <th key={c.id} className="p-3 font-black text-white">{c.name}</th>)}</tr></thead>
                <tbody>{ROWS.map(([label, get]) => <tr key={label} className="border-t border-edge/60 align-top"><th className="p-3 text-xs font-bold uppercase tracking-wide text-slate-400">{label}</th>{cards.map((c) => <td key={c.id} className="p-3 text-slate-300">{get(c)}</td>)}</tr>)}</tbody>
              </table>
            </div>
            {door === 'borrow' && !s.underwritten && <div><p className="mb-3 text-sm text-slate-300">Lenders look at your (pretend) credit first. Run the check, then apply.</p><Underwriting s={s} dispatch={dispatch} blocked={blocked} /></div>}
            <FinanceCards s={s} dispatch={dispatch} blocked={blocked} goTo={(t) => setSub(t)} only={d.cards} title="Choose this strategy" />
          </div>
        )}
        {d && sub !== 'cards' && (
          <div className="mt-5 space-y-4">
            <button onClick={() => setSub('cards')} className="text-sm font-bold text-cyan hover:underline">← Back to {d.title.toLowerCase()}</button>
            {sub === 'stack' && <CardStacking s={s} dispatch={dispatch} blocked={blocked} />}
            {sub === 'partners' && <JVMatch s={s} dispatch={dispatch} blocked={blocked} onMeet={meetPartner} />}
          </div>
        )}
        <p className="mt-6 text-xs text-slate-500">Simulated choices. Applying isn&apos;t approval, and approval isn&apos;t cash in hand.</p>
      </div>
    </div>
  )
}

function OffersSheet({ g, onClose }) {
  const { s, dispatch } = g
  return (
    <div className="fixed inset-0 z-[45] overflow-y-auto bg-black/75 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label="Pending offers">
      <div className="mx-auto max-w-3xl space-y-4 rounded-3xl border border-edge bg-panel p-4 sm:p-7">
        <div className="flex justify-between gap-3"><h2 className="text-2xl font-black text-white">Your offers</h2><button onClick={onClose} className={btnGhost}>✕ Close</button></div>
        <Ledger s={s} dispatch={dispatch} blocked={!!s.activeEvent} />
      </div>
    </div>
  )
}

export default function Play({ g }) {
  const { s, dispatch } = g
  const report = useMemo(() => buildReport(s), [s])
  const agents = useMemo(() => agentStates(report), [report])
  const [door, setDoor] = useState(null)
  const [offers, setOffers] = useState(false)
  const [tipOff, setTipOff] = useState(() => sessionStorage.getItem('fyv-tip-off') === '1')

  if (s.phase === 'boss') return <div className="fade-up"><Boss s={s} dispatch={dispatch} /></div>
  if (s.phase === 'results' && s.result) return <div className="space-y-8"><Results s={s} dispatch={dispatch} modern /><RealWorldPanel s={s} /></div>

  const m = mission(s)
  const next = report.actions[0]
  const openDesk = (id) => ({
    cfo: () => go('business'), growth: () => go('business'), reporting: () => go('blueprint'), risk: () => go('blueprint'), guide: () => go('blueprint'),
    underwriting: () => setDoor('borrow'), architect: () => setDoor('partner'), vc: () => setDoor('partner'),
  })[id]?.()
  const act = () => {
    if (m.act === 'doors') setDoor('menu')
    else if (m.act === 'offers') setOffers(true)
    else if (m.act === 'month') dispatch({ type: 'DRAW_EVENT' })
    else dispatch({ type: 'START_BOSS' })
  }
  const missionCard = (
      <section className={`${card} border-gold/50`}>
          <div className={`${kicker} text-gold`}>Mission {m.n}</div>
          <h2 className="mt-1 text-xl font-black text-white">{m.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{m.body}</p>
          <button onClick={act} disabled={!!s.activeEvent || (m.act !== 'doors' && m.act !== 'offers' && s.deck.length === 0)} className={`${btnPrimary} mt-4 w-full`}>{m.cta} →</button>
          {m.act !== 'doors' && <button onClick={() => setDoor('menu')} className={`${btnGhost} mt-2 w-full`}>Compare funding choices</button>}
          <button onClick={() => go('business')} className="mt-3 w-full text-center text-sm font-bold text-cyan hover:underline">Hire help · see my money</button>
        </section>
  )
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="xl:hidden">{missionCard}</div>
      <div className="min-w-0"><AgentOffice agents={agents} onOpen={openDesk} /></div>
      <aside className="space-y-4 xl:sticky xl:top-36 xl:max-h-[calc(100vh-10rem)] xl:self-start xl:overflow-y-auto">
        <div className="hidden xl:block">{missionCard}</div>
        {next && (
          <section className={card}>
            <div className="flex items-center gap-3">
              <img src={`${import.meta.env.BASE_URL}agents/guide.jpg`} alt="" className="h-11 w-11 rounded-full object-cover" />
              <div><div className="text-sm font-black text-white">Naomi · Mentor</div><div className="text-[11px] text-slate-500">Guided explanation (rule-based)</div></div>
            </div>
            <p className="mt-3 text-sm text-slate-200">“{next.action}.”</p>
            <details className="mt-1 text-sm text-slate-400"><summary className="cursor-pointer font-bold text-cyan">Why?</summary><p className="mt-1">{next.why}</p></details>
          </section>
        )}
        {s.funding.length > 0 && !tipOff && (
          <section className="rounded-3xl border border-cyan/40 bg-cyan/5 p-4 text-sm">
            <p className="text-slate-200">Want an expert to review your <b>real</b> eligibility? It doesn&apos;t change the game.</p>
            <div className="mt-2 flex gap-3"><a href="#/help" className="font-black text-cyan hover:underline">Get a funding assessment →</a><button onClick={() => { sessionStorage.setItem('fyv-tip-off', '1'); setTipOff(true) }} className="text-slate-500 hover:text-white">Not now</button></div>
          </section>
        )}
        <section className={card}>
          <div className={`${kicker} text-slate-400`}>Your advisors</div>
          <ul className="mt-3 space-y-2">
            {agents.map((a) => (
              <li key={a.id}>
                <button onClick={() => openDesk(a.id)} className="flex w-full items-start gap-3 rounded-2xl p-1.5 text-left hover:bg-white/5">
                  <img src={a.photo} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                  <span className="min-w-0"><span className="flex items-center gap-1.5 text-sm font-bold text-white"><span className={`h-2 w-2 rounded-full ${DOT[a.status]}`} />{a.name}</span><span className="block text-xs text-slate-400">{a.finding}</span></span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className={card}>
          <div className={`${kicker} text-slate-400`}>Recent</div>
          <ul className="mt-2 space-y-1 text-sm text-slate-300">{s.log.slice(0, 5).map((l) => <li key={l.id}>{l.text}</li>)}</ul>
        </section>
      </aside>
      {door && <DoorSheet key={door} g={g} door={door === 'menu' ? null : door} setDoor={(d) => setDoor(d === null ? null : d)} />}
      {offers && <OffersSheet g={g} onClose={() => setOffers(false)} />}
    </div>
  )
}
