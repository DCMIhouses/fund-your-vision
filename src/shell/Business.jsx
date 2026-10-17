import { totals, monthlyBurn, ownership } from '../engine'
import { fmt, runwayDays } from '../game'
import { SQUAD } from '../data'
import { fundingTiers } from '../selectors'
import Ledger from '../components/Ledger'
import Squad from '../components/Squad'
import Underwriting from '../components/Underwriting'
import CardStacking from '../components/CardStacking'
import PartnerBinder from '../components/PartnerBinder'
import FundingBar from './FundingBar'
import { card, kicker, runwayText } from './ui'

function Question({ q, answer, tone, children, note }) {
  return (
    <section className={`${card} flex flex-col`}>
      <h2 className="text-base font-bold text-slate-300">{q}</h2>
      <div className={`mt-2 font-mono text-4xl font-black ${tone}`}>{answer}</div>
      <dl className="mt-4 space-y-2 text-sm">{children}</dl>
      {note && <p className="mt-auto pt-4 text-xs text-slate-500">{note}</p>}
    </section>
  )
}
const Row = ({ k, v, hint, c = 'text-white' }) => (
  <div className="flex items-baseline justify-between gap-3 border-b border-edge/60 pb-1.5 last:border-0">
    <dt className="text-slate-400">{k}{hint && <span className="block text-[11px] text-slate-500">{hint}</span>}</dt><dd className={`font-mono font-bold ${c}`}>{v}</dd>
  </div>
)
function Section({ title, sub, open, children }) {
  return (
    <details open={open} className="group rounded-3xl border border-edge bg-panel/50">
      <summary className="flex cursor-pointer items-center justify-between gap-3 p-5 sm:p-6">
        <span><span className="block text-lg font-black text-white">{title}</span>{sub && <span className="block text-sm text-slate-400">{sub}</span>}</span>
        <span className="text-xl text-slate-500 transition group-open:rotate-45">+</span>
      </summary>
      <div className="space-y-6 px-3 pb-5 sm:px-6">{children}</div>
    </details>
  )
}

export default function Business({ g }) {
  const { s, dispatch, book } = g
  const t = totals(s)
  const tiers = fundingTiers(s)
  const burn = monthlyBurn(s)
  const runway = runwayDays(t.cash, s.startDays, burn)
  const own = ownership(s)
  const blocked = !!s.activeEvent
  const squadCost = s.squad.reduce((a, id) => a + (SQUAD.find((r) => r.id === id)?.cost || 0), 0)
  const investors = s.funding.filter((f) => f.type === 'vc' && !['declined', 'withdrawn'].includes(f.status)).length
  return (
    <div className="space-y-6">
      <div>
        <div className={`${kicker} text-gold`}>My Business</div>
        <h1 className="mt-1 text-3xl font-black text-white sm:text-4xl">{s.startup.name}: your money, plainly</h1>
        <p className="mt-1 text-sm text-slate-400">All numbers are simulated for this game.</p>
      </div>
      {s.phase === 'fund' && <div className={card}><FundingBar s={s} /></div>}
      <div className="grid gap-4 md:grid-cols-3">
        <Question q="How much cash can I use today?" answer={fmt(tiers.collected)} tone="text-neon" note="Saved money is lower costs, not cash in the bank.">
          <Row k="Collected" hint="in the bank" v={fmt(tiers.collected)} c="text-neon" />
          <Row k="Saved by cutting costs" hint="not cash, but counts toward the goal" v={fmt(tiers.saved)} c="text-teal-300" />
          <Row k="Committed" hint="promised, not here yet" v={fmt(tiers.committed)} c="text-gold" />
          <Row k="Pledged" hint="soft offer, needs your answer" v={fmt(tiers.pledged)} c="text-sky-300" />
        </Question>
        <Question q="How long can I keep going?" answer={runwayText(runway)} tone={runway < 90 ? 'text-hot' : 'text-cyan'} note="Estimated under this scenario, using cash collected so far.">
          <Row k="Monthly costs" v={fmt(burn)} />
          <Row k="Starting cash buffer" v={`${s.startDays} days`} />
          <Row k="Runway in days" v={runway.toLocaleString()} />
        </Question>
        <Question q="How much of my company do I own?" answer={`${(own.founder * 100).toFixed(own.founder === 1 ? 0 : 1)}%`} tone="text-white" note="Selling shares to investors lowers this number.">
          <Row k="Investors" v={investors} />
          <Row k="Board seats given" v={own.seats} />
        </Question>
      </div>
      <Section title="Money coming in" sub="Every funding source, its status and when it lands" open>
        <Ledger s={s} dispatch={dispatch} blocked={blocked} />
      </Section>
      <Section title="Money going out" sub="What the business spends every month">
        <dl className={`${card} space-y-2 text-sm`}>
          <Row k="Business costs (as set up)" v={`${fmt(s.startup.monthlyBurn)}/mo`} />
          <Row k="Your pay" v={`${fmt(s.startup.founderPay || 0)}/mo`} />
          <Row k="Hired team" v={`${fmt(squadCost)}/mo`} />
          <Row k="Total right now" hint="includes cost cuts, hires and surprise events" v={`${fmt(burn)}/mo`} c="text-gold" />
        </dl>
      </Section>
      <Section title="Hire help" sub="Real people cost money each month. Your AI advisors are included free.">
        <Squad s={s} dispatch={dispatch} locked={blocked} />
      </Section>
      <Section title="Advanced" sub="Pretend credit check, 0% card stack and partner binder">
        <Underwriting s={s} dispatch={dispatch} blocked={blocked} />
        <CardStacking s={s} dispatch={dispatch} blocked={blocked} />
        <PartnerBinder book={book} />
      </Section>
    </div>
  )
}
