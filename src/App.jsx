import { useEffect, useMemo, useRef, useState } from 'react'
import TopBar from './components/TopBar'
import Underwriting from './components/Underwriting'
import CardStacking from './components/CardStacking'
import EntityStacking from './components/EntityStacking'
import Tradelines from './components/Tradelines'
import JVMatch from './components/JVMatch'
import Victory from './components/Victory'
import {
  DEFAULT_PROFILE, DEFAULT_RUNWAY, buildPlan, ENTITY_BASE_CAPACITY, ENTITY_TASKS, PARTNERS, approvalOdds, clamp, effectiveProfile,
  estimatedLimit, fmt, fundabilityScore, levelFor, monthlyBurnFor, runwayDays,
} from './game'

const STORAGE_KEY = 'screw-vcs-v1'
const INITIAL = {
  target: 150000,
  runway: DEFAULT_RUNWAY,
  profile: DEFAULT_PROFILE,
  underwriting: null,
  cards: {},
  entities: [],
  aus: [],
  needs: ['Capital'],
  partners: {},
  xp: 0,
  dispatched: false,
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...INITIAL, ...JSON.parse(raw) } : INITIAL
  } catch {
    return INITIAL
  }
}

export default function App() {
  const [s, setS] = useState(load)
  const [toasts, setToasts] = useState([])
  const [victoryOpen, setVictoryOpen] = useState(false)
  const toastId = useRef(0)

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) }, [s])

  const toast = (text, tone = 'neon') => {
    const id = ++toastId.current
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }

  const update = (patch, xp = 0) => {
    setS((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch), xp: prev.xp + xp }))
  }

  const levelIdx = levelFor(s.xp).idx
  const prevLevel = useRef(levelIdx)
  useEffect(() => {
    if (levelIdx > prevLevel.current) toast(`LEVEL UP → ${levelFor(s.xp).name}`, 'gold')
    prevLevel.current = levelIdx
  }, [levelIdx, s.xp])

  const cardApps = Object.keys(s.cards).length
  const effective = useMemo(() => effectiveProfile(s.profile, s.aus, cardApps), [s.profile, s.aus, cardApps])
  const liveScore = fundabilityScore(effective)
  const locked = !s.underwriting

  const cardTotal = Object.values(s.cards).reduce((a, r) => a + (r.status === 'approved' ? r.limit : 0), 0)
  const entityTotal = s.entities.reduce((a, e) => a + (e.amount || 0), 0)
  const jvTotal = PARTNERS.filter((p) => s.partners[p.id] === 'matched').reduce((a, p) => a + p.capacity, 0)
  const spend = s.aus.reduce((a, t) => a + t.cost, 0)
  const unlocked = cardTotal + entityTotal + jvTotal
  const net = Math.max(0, unlocked - spend)
  const entityCapacity = Math.round((ENTITY_BASE_CAPACITY * clamp((liveScore - 20) / 75, 0.2, 1)) / 500) * 500

  const sources = [
    { label: '0% Card Stacking', amount: cardTotal },
    { label: 'Multi-Entity Stacking', amount: entityTotal },
    { label: 'JV Credit Partners', amount: jvTotal },
    { label: 'AU Tradeline Spend', amount: -spend },
  ].filter((x) => x.amount !== 0)

  const monthlyBurn = monthlyBurnFor(s.runway, s.target)
  const runway = runwayDays(net, s.runway.startDays, monthlyBurn)
  const plan = buildPlan({ target: s.target, net, unlocked, spend, sources, runway })

  const funded = net >= s.target
  const wasFunded = useRef(funded)
  useEffect(() => {
    if (funded && !wasFunded.current) toast('100% FUNDED: VICTORY button unlocked!', 'neon')
    wasFunded.current = funded
  }, [funded])

  const onRun = (score) => {
    const first = !s.underwriting
    update({ underwriting: { score } }, first ? 50 : 10)
    toast(`AI Underwriting complete: Fundability ${score}`, 'cyan')
  }

  const onApply = (card) => {
    const odds = approvalOdds(liveScore, card)
    const approved = Math.random() * 100 < odds
    const limit = approved ? estimatedLimit(liveScore, s.profile.income, card) : 0
    update((p) => ({ cards: { ...p.cards, [card.id]: { status: approved ? 'approved' : 'denied', limit } } }), approved ? 60 : 10)
    toast(approved ? `APPROVED: ${card.name} +${fmt(limit)} @ 0%` : `Denied: ${card.name} (+1 inquiry)`, approved ? 'neon' : 'hot')
  }

  const onAddEntity = (name, state) => {
    update((p) => ({ entities: [...p.entities, { id: crypto.randomUUID(), name, state, tasks: {}, amount: 0 }] }), 25)
    toast(`Formed ${name} (${state})`, 'gold')
  }
  const onToggleTask = (id, task) => update((p) => ({
    entities: p.entities.map((e) => (e.id === id ? { ...e, tasks: { ...e.tasks, [task]: !e.tasks[task] } } : e)),
  }), 5)
  const onStackEntity = (id) => {
    const ent = s.entities.find((e) => e.id === id)
    if (!ent || ENTITY_TASKS.some((t) => !ent.tasks[t.id])) return
    update((p) => ({ entities: p.entities.map((e) => (e.id === id ? { ...e, amount: entityCapacity } : e)) }), 100)
    toast(`${ent.name} stacked +${fmt(entityCapacity)}`, 'gold')
  }

  const onBuyAU = (t) => {
    update((p) => ({ aus: [...p.aus, t] }), 30)
    toast(`AU added: ${t.bank} (${t.age} yrs, ${fmt(t.limit)})`, 'hot')
  }
  const onRemoveAU = (id) => update((p) => ({ aus: p.aus.filter((t) => t.id !== id) }))

  const onDecide = (partner, decision) => {
    update((p) => ({ partners: { ...p.partners, [partner.id]: decision } }), decision === 'matched' ? 75 : 5)
    if (decision === 'matched') toast(`JV match: ${partner.name} brings +${fmt(partner.capacity)}`, 'cyan')
  }

  const reset = () => {
    if (!window.confirm('Reset all progress?')) return
    localStorage.removeItem(STORAGE_KEY)
    setS(INITIAL)
    setVictoryOpen(false)
  }

  const toneClass = { neon: 'border-neon text-neon', cyan: 'border-cyan text-cyan', hot: 'border-hot text-hot', gold: 'border-gold text-gold' }

  return (
    <div className="grid-bg min-h-screen overflow-x-clip">
      <TopBar target={s.target} setTarget={(target) => update({ target })} unlocked={unlocked} spend={spend}
        runway={runway} runwaySettings={s.runway} monthlyBurn={monthlyBurn} setRunway={(r) => update((p) => ({ runway: { ...p.runway, ...r } }))}
        xp={s.xp} onVictory={() => setVictoryOpen(true)} onReset={reset} />

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-hot/40 bg-hot/5 p-3 text-xs text-slate-300">
            <span className="font-black text-hot">VCs</span> take 30–50% equity and board seats, and can fire you from your own company.
          </div>
          <div className="rounded-xl border border-gold/40 bg-gold/5 p-3 text-xs text-slate-300">
            <span className="font-black text-gold">Personal savings?</span> The median small business holds just 27 cash buffer days (JPMorgan Chase Institute). About half fail within 5 years.
          </div>
          <div className="rounded-xl border border-neon/40 bg-neon/5 p-3 text-xs italic text-slate-300">
            “Because it's easier to borrow $10M than to earn it.” <span className="not-italic font-bold text-neon">Donna L. Fox</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Underwriting profile={s.profile} setProfile={(profile) => update({ profile })} effective={effective}
            result={s.underwriting} onRun={onRun} />
          <CardStacking score={liveScore} income={s.profile.income} locked={locked} results={s.cards} onApply={onApply} />
          <Tradelines owned={s.aus} onBuy={onBuyAU} onRemove={onRemoveAU} />
          <EntityStacking entities={s.entities} onAdd={onAddEntity} onToggle={onToggleTask} onStack={onStackEntity}
            entityCapacity={entityCapacity} locked={locked} />
          <JVMatch needs={s.needs} setNeeds={(needs) => update({ needs })} decisions={s.partners} onDecide={onDecide} />

          <section className="rounded-2xl border border-edge bg-panel/95 p-5">
            <h2 className="text-lg font-black uppercase tracking-wide text-white">Capital Architect Playbook</h2>
            <ol className="mt-3 space-y-2 text-sm text-slate-300">
              {[
                ['Run AI Underwriting', !locked],
                ['Add AU tradelines to lift your score before applying', s.aus.length > 0],
                ['Stack 0% cards in one sequence', cardTotal > 0],
                ['Form & fund extra LLCs', entityTotal > 0],
                ['Match a JV credit partner', jvTotal > 0],
                ['Hit 100% of your Target Raise', funded],
                ['Dispatch plan to the Slack War Room', s.dispatched],
              ].map(([label, done], i) => (
                <li key={label} className="flex items-center gap-2">
                  <span className={`grid h-5 w-5 place-items-center rounded-full font-mono text-[10px] font-black ${done ? 'bg-neon text-ink' : 'border border-edge text-slate-500'}`}>
                    {done ? '✓' : i + 1}
                  </span>
                  <span className={done ? 'text-slate-500 line-through' : ''}>{label}</span>
                </li>
              ))}
            </ol>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center font-mono text-xs">
              <div className="rounded-lg bg-ink/60 p-2"><div className="text-[9px] uppercase text-slate-500">Cards</div><span className="text-neon">{fmt(cardTotal)}</span></div>
              <div className="rounded-lg bg-ink/60 p-2"><div className="text-[9px] uppercase text-slate-500">Entities</div><span className="text-gold">{fmt(entityTotal)}</span></div>
              <div className="rounded-lg bg-ink/60 p-2"><div className="text-[9px] uppercase text-slate-500">JV</div><span className="text-cyan">{fmt(jvTotal)}</span></div>
            </div>
          </section>
        </div>

        <footer className="mt-10 border-t border-edge pt-4 text-center text-[10px] leading-relaxed text-slate-500">
          Educational simulation. Not a credit offer, a guarantee of approval, or financial advice. Scores, odds, and limits are illustrative and not produced by Experian.
          0% intro APR periods expire; balances then accrue interest, and business cards typically require a personal guarantee.
          <br />Powered by <a href="https://nationwidebusinessfunding.com" target="_blank" rel="noreferrer" className="text-cyan hover:underline">NationwideBusinessFunding.com</a>, Fractional Chief Capital Officer Platform.
        </footer>
      </main>

      <Victory open={victoryOpen} onClose={() => setVictoryOpen(false)} plan={plan} sources={sources} net={net}
        onDispatched={() => { if (!s.dispatched) update({ dispatched: true }, 200); toast('Plan dispatched to the 22-person War Room', 'neon') }} />

      <div className="fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-in rounded-lg border-l-4 bg-panel/95 px-3 py-2 text-xs font-bold shadow-lg ${toneClass[t.tone]}`}>{t.text}</div>
        ))}
      </div>
    </div>
  )
}
