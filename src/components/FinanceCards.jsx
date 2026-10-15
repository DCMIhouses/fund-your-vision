import { useState } from 'react'
import Panel from './Panel'
import { FINANCE_CARDS, INDUSTRIES } from '../data'
import { fmt } from '../game'
import { creditUsed, prepayMax, termDecision, vcTerms } from '../engine'

const KIND = {
  Debt: 'bg-hot/20 text-hot', Self: 'bg-gold/20 text-gold', Equity: 'bg-cyan/20 text-cyan',
  Partnership: 'bg-cyan/20 text-cyan', Revenue: 'bg-neon/20 text-neon', Efficiency: 'bg-neon/20 text-neon',
}
const STATUS = {
  available: 'border-neon/60 text-neon', committed: 'border-gold/60 text-gold', conditional: 'border-gold/60 text-gold',
  declined: 'border-hot/60 text-hot', withdrawn: 'border-hot/60 text-hot',
}

function Amount({ value, min, max, step = 5000, onChange }) {
  return (
    <label className="block">
      <div className="flex justify-between text-[10px] text-slate-500"><span>Amount</span><span className="font-mono text-slate-200">{fmt(value)}</span></div>
      <input type="range" min={min} max={Math.max(min, max)} step={step} value={Math.min(value, Math.max(min, max))}
        onChange={(e) => onChange(Number(e.target.value))} className="range-neon w-full" />
    </label>
  )
}

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

export default function FinanceCards({ s, dispatch, blocked }) {
  const ind = INDUSTRIES[s.startup.industry]
  const termMax = Math.round(Math.min(250000, s.startup.target * 0.6) / 5000) * 5000
  const savingsLeft = s.startup.savings - s.funding.filter((f) => f.type === 'savings').reduce((a, f) => a + f.amount, 0)
  const [amt, setAmt] = useState({ term: Math.min(60000, termMax), savings: Math.min(10000, s.startup.savings), vc: Math.min(50000, ind.vcCap), prepay: 10000 })
  const set = (k) => (v) => setAmt((a) => ({ ...a, [k]: v }))
  const play = (card, extra = {}) => dispatch({ type: 'PLAY', card, ...extra })
  const entries = (type) => s.funding.filter((f) => f.type === type)

  function action(card) {
    const played = entries(card.id).find((f) => f.status !== 'declined')
    switch (card.id) {
      case 'credit':
        return (
          <div className="space-y-1.5">
            <div className="text-[11px] text-slate-400">Approved so far: <span className="font-mono text-neon">{fmt(creditUsed(s))}</span> / cap {fmt(Math.max(25000, s.profile.income) * (s.squad.includes('cco') ? 1.1 : 1))}</div>
            <button onClick={() => scrollTo('card-stack')} className="w-full rounded-lg border border-hot/60 py-1.5 text-[11px] font-black uppercase text-hot hover:bg-hot/10">Open the 0% Card Stack ↓</button>
          </div>
        )
      case 'term': {
        const d = termDecision(s, amt.term)
        return (
          <div className="space-y-1.5">
            <Amount value={amt.term} min={10000} max={termMax} onChange={set('term')} />
            <div className="text-[10px] text-slate-500">Preview: <span className={d.status === 'approved' ? 'text-neon' : d.status === 'conditional' ? 'text-gold' : 'text-hot'}>{d.status}</span> · {d.reason}</div>
            <button disabled={blocked || !s.underwritten || !!played} onClick={() => play('term', { amount: amt.term })} className="btn-play">{!s.underwritten ? 'Run underwriting first' : played ? 'Applied' : 'Apply for term loan'}</button>
          </div>
        )
      }
      case 'savings':
        return (
          <div className="space-y-1.5">
            <Amount value={Math.min(amt.savings, savingsLeft)} min={Math.min(5000, savingsLeft)} max={savingsLeft} onChange={set('savings')} />
            <button disabled={blocked || savingsLeft <= 0} onClick={() => play('savings', { amount: Math.min(amt.savings, savingsLeft) })} className="btn-play">{savingsLeft <= 0 ? 'Savings fully committed' : 'Commit savings'}</button>
          </div>
        )
      case 'vc': {
        const t = vcTerms(s, amt.vc)
        return (
          <div className="space-y-1.5">
            <Amount value={amt.vc} min={10000} max={ind.vcCap} onChange={set('vc')} />
            <div className="text-[10px] text-slate-500">Preview: {(t.equityPct * 100).toFixed(1)}% equity at {fmt(t.preMoney)} pre-money{t.equityPct >= 0.15 ? ' + board seat' : ''}</div>
            <button disabled={blocked || !!played} onClick={() => play('vc', { amount: amt.vc })} className="btn-play">{played ? 'Term sheet requested' : 'Pitch for a term sheet'}</button>
          </div>
        )
      }
      case 'partner':
        return <button onClick={() => scrollTo('partners')} className="w-full rounded-lg border border-cyan/60 py-1.5 text-[11px] font-black uppercase text-cyan hover:bg-cyan/10">Choose a partner ↓</button>
      case 'prepay': {
        const max = prepayMax(s)
        return (
          <div className="space-y-1.5">
            <Amount value={Math.min(amt.prepay, max)} min={Math.min(5000, max)} max={max} step={1000} onChange={set('prepay')} />
            <button disabled={blocked || !!played || max <= 0} onClick={() => play('prepay', { amount: Math.min(amt.prepay, max) })} className="btn-play">{played ? 'Pre-sold' : `Pre-sell (max ${fmt(max)})`}</button>
          </div>
        )
      }
      case 'cut':
        return <button disabled={blocked || !!played} onClick={() => play('cut')} className="btn-play">{played ? 'Burn reduced 15%' : `Cut burn 15% (frees ${fmt(s.startup.monthlyBurn * 0.15 * 12)})`}</button>
      default: return null
    }
  }

  return (
    <Panel num="3" accent="gold" title="Financing Power-Up Cards"
      subtitle="Combine cards to hit the target. Every card changes the forecast; applying isn't approval, and approval isn't cash in hand.">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {FINANCE_CARDS.map((card) => {
          const list = entries(card.id)
          const last = list[list.length - 1]
          return (
            <div key={card.id} className="flex flex-col rounded-xl border border-edge bg-ink/70 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${KIND[card.kind]}`}>{card.kind}</span>
                  <div className="mt-1 text-sm font-black text-white">{card.name}</div>
                  <div className="text-[11px] text-slate-500">{card.tagline}</div>
                </div>
                {last && <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-black uppercase ${STATUS[last.status]}`}>{last.status}</span>}
              </div>
              <dl className="mt-2 grid grid-cols-1 gap-1 text-[10px] leading-snug">
                {[['Capital', card.capital], ['Cost', card.cost], ['Eligibility', card.eligibility], ['Repayment', card.repayment], ['Ownership', card.ownership], ['Risks', card.risks]].map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[70px_1fr] gap-1"><dt className="font-bold uppercase text-slate-500">{k}</dt><dd className="text-slate-300">{v}</dd></div>
                ))}
              </dl>
              <div className="mt-auto pt-3">{action(card)}</div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
