import { useEffect, useState } from 'react'
import Chart from './Chart'
import { fmt } from '../game'
import { INDUSTRIES } from '../data'
import { ownership, totals } from '../engine'

const LB_KEY = 'screw-vcs-leaderboard'
const loadLb = () => { try { return JSON.parse(localStorage.getItem(LB_KEY)) || [] } catch { return [] } }

const WAR_ROOM = ['Fractional CCO', 'Lead Underwriter', 'Credit Analyst', 'Business Credit', 'Entity Formation', 'Bank Relations', 'Compliance', 'CPA / Tax', 'Bookkeeping', 'Cash-Flow Coach', 'Partner Success', 'Legal', 'Funding Coordinator', 'Lender Liaison', 'Refinance Desk', 'Payoff Strategist', 'Growth Advisor', 'Founder Coach', 'Client Success', 'Ops Analyst', 'Risk Review', 'Program Lead']

const OUTCOME = {
  victory: { title: 'VICTORY', sub: 'Funded, sustainable, and still in control.', color: 'text-neon', ring: 'border-neon shadow-[0_0_60px_rgba(57,255,136,.35)]' },
  partial: { title: 'PARTIAL SUCCESS', sub: 'You survived, but the plan has cracks.', color: 'text-gold', ring: 'border-gold shadow-[0_0_60px_rgba(251,191,36,.25)]' },
  failure: { title: 'OUT OF CASH', sub: 'You raised the money but could not carry it.', color: 'text-hot', ring: 'border-hot shadow-[0_0_60px_rgba(255,46,99,.3)]' },
}

export default function Results({ s, dispatch }) {
  const r = s.result
  const t = totals(s)
  const own = ownership(s)
  const o = OUTCOME[r.outcome]
  const [lb, setLb] = useState(loadLb)
  const [nick, setNick] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [consent, setConsent] = useState(false)
  const [copied, setCopied] = useState(false)
  const [dispatchState, setDispatchState] = useState('idle')

  useEffect(() => { localStorage.setItem(LB_KEY, JSON.stringify(lb)) }, [lb])

  const runwayMonths = r.forecast.insolventMonth ? r.forecast.insolventMonth - 1 : 18
  const summary = [
    `${s.startup.name}: ${o.title} (Startup Capital IQ ${r.score}/100, ${r.badge})`,
    `Available funding ${fmt(t.available)} (${Math.round((t.available / s.startup.target) * 100)}% of ${fmt(s.startup.target)} target)`,
    `Debt ${fmt(t.debt)} · Equity ${fmt(t.equity)} · Founder ownership ${(own.founder * 100).toFixed(1)}%`,
    `Forecast runway: ${runwayMonths >= 18 ? '18+ months' : `${runwayMonths} months`}`,
    'SCREW VCs: The Startup Funding Challenge · NationwideBusinessFunding.com (simulation)',
  ].join('\n')

  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: 'SCREW VCs', text: summary }); return } catch { /* fall back */ } }
    await navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const submit = (e) => {
    e.preventDefault()
    const name = nick.trim().slice(0, 20)
    if (!name) return
    setLb([...lb, { nick: name, project: s.startup.name.slice(0, 30), score: r.score, badge: r.badge, at: Date.now() }].sort((a, b) => b.score - a.score).slice(0, 10))
    setSubmitted(true)
  }

  const cta = (campaign) => {
    const q = new URLSearchParams({ utm_source: 'screw-vcs-game', utm_medium: 'buildathon', utm_campaign: campaign })
    if (consent) { q.set('industry', s.startup.industry); q.set('target', s.startup.target); q.set('iq', r.score); q.set('outcome', r.outcome) }
    return `https://nationwidebusinessfunding.com/?${q}`
  }

  const doDispatch = () => { setDispatchState('sending'); setTimeout(() => setDispatchState('sent'), 1600) }

  return (
    <section className={`rounded-3xl border-2 bg-panel p-5 md:p-7 ${o.ring}`}>
      <div className="text-center">
        <div className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400">{s.startup.name} · {INDUSTRIES[s.startup.industry].label}</div>
        <h2 className={`mt-1 text-4xl font-black uppercase md:text-5xl ${o.color}`}>{o.title}</h2>
        <p className="text-sm text-slate-400">{o.sub}{r.forecast.insolventMonth ? ` Cash ran out in month ${r.forecast.insolventMonth}.` : ''}</p>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-edge bg-ink/70 p-4 text-center">
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Startup Capital IQ</div>
          <div className={`font-mono text-6xl font-black ${o.color}`}>{r.score}</div>
          <div className="mt-1 inline-block rounded-full border border-gold/60 bg-gold/10 px-3 py-1 text-xs font-black uppercase text-gold">★ {r.badge}</div>
          <div className="mt-4 space-y-1.5 text-left">
            {r.breakdown.map((b) => (
              <div key={b.id}>
                <div className="flex justify-between text-[11px]"><span className="text-slate-300">{b.label}</span><span className="font-mono text-white">{b.pts}/{b.max}</span></div>
                <div className="h-1.5 overflow-hidden rounded bg-edge"><div className="h-full bg-neon" style={{ width: `${(b.pts / b.max) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[['Available funding', fmt(t.available)], ['% of target', `${Math.round((t.available / s.startup.target) * 100)}%`], ['Debt / Equity', `${fmt(t.debt)} / ${fmt(t.equity)}`], ['Founder ownership', `${(own.founder * 100).toFixed(1)}%`], ['Forecast runway', runwayMonths >= 18 ? '18+ mo' : `${runwayMonths} mo`], ['Month-18 cash', fmt(r.forecast.endCash)], ['Board seats lost', own.seats], ['Boss move', r.option]].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-edge bg-ink/60 p-2"><div className="text-[9px] uppercase tracking-widest text-slate-500">{k}</div><div className="font-mono text-sm font-black text-white">{v}</div></div>
            ))}
          </div>
          <div className="rounded-2xl border border-edge bg-ink/70 p-3"><Chart forecast={r.forecast} height={160} /></div>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {r.checks.map((c) => <div key={c.label} className={`text-xs ${c.ok ? 'text-neon' : 'text-hot'}`}>{c.ok ? '✓' : '✕'} {c.label}</div>)}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-edge bg-ink/60 p-4">
          <div className="text-xs font-black uppercase tracking-widest text-white">Leaderboard</div>
          <div className="text-[10px] text-slate-500">Nicknames only. Saved on this device. No financial data.</div>
          {!submitted ? (
            <form onSubmit={submit} className="mt-2 flex gap-2">
              <input value={nick} onChange={(e) => setNick(e.target.value)} maxLength={20} placeholder="Nickname"
                className="min-w-0 flex-1 rounded-lg border border-edge bg-ink px-2 py-1.5 text-sm text-white focus:border-neon focus:outline-none" />
              <button className="rounded-lg bg-neon px-3 text-xs font-black uppercase text-ink">Submit</button>
            </form>
          ) : <div className="mt-2 text-xs text-neon">Score submitted ✓</div>}
          <ol className="mt-3 space-y-1">
            {lb.length === 0 && <li className="text-[11px] text-slate-500">No scores yet.</li>}
            {lb.map((e, i) => (
              <li key={e.at} className="flex justify-between gap-2 rounded bg-ink/70 px-2 py-1 text-[11px]">
                <span className="truncate text-slate-300">{i + 1}. {e.nick} <span className="text-slate-500">· {e.project}</span></span>
                <span className="shrink-0 font-mono text-neon">{e.score}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl border border-cyan/50 bg-cyan/5 p-4">
          <div className="text-xs font-black uppercase tracking-widest text-white">Take it to the real world</div>
          <div className="text-[10px] text-slate-400">The game does not approve loans, make offers, or verify partners.</div>
          <div className="mt-3 space-y-2">
            {[['assessment', 'Request a real funding eligibility assessment'], ['capital-partner', 'Explore a qualified capital partnership'], ['fractional-cco', 'Discuss Fractional Chief Capital Officer services']].map(([c, label]) => (
              <a key={c} href={cta(c)} target="_blank" rel="noreferrer" className="block rounded-lg bg-cyan px-3 py-2 text-center text-xs font-black uppercase text-ink hover:brightness-110">{label}</a>
            ))}
          </div>
          <label className="mt-3 flex items-start gap-2 text-[10px] text-slate-400">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-cyan" />
            Include my game scenario (industry, target, score, outcome) in the link. No personal or credit data is sent.
          </label>
        </div>

        <div className="rounded-2xl border border-edge bg-ink/60 p-4">
          <div className="text-xs font-black uppercase tracking-widest text-white">Share & War Room</div>
          <button onClick={share} className="mt-2 w-full rounded-lg border border-neon/60 py-2 text-xs font-black uppercase text-neon hover:bg-neon/10">{copied ? 'Copied ✓' : 'Share result'}</button>
          <button onClick={doDispatch} disabled={dispatchState !== 'idle'}
            className={`mt-2 w-full rounded-lg py-2 text-[11px] font-black uppercase ${r.outcome === 'victory' ? 'glow-pulse bg-neon text-ink' : 'bg-edge text-slate-200'} disabled:opacity-80`}>
            {dispatchState === 'sent' ? '✓ Dispatched (simulated)' : dispatchState === 'sending' ? 'Dispatching…' : r.outcome === 'victory' ? 'VICTORY: Confirm plan & dispatch to 22-person War Room' : 'Send plan to 22-person War Room for review'}
          </button>
          <div className="mt-2 grid grid-cols-11 gap-1">
            {WAR_ROOM.map((w, i) => (
              <span key={w} title={w} className={`h-2.5 rounded-full transition-colors duration-300 ${dispatchState === 'sent' ? 'bg-neon' : dispatchState === 'sending' ? 'animate-pulse bg-gold' : 'bg-slate-700'}`} style={{ transitionDelay: `${i * 50}ms` }} />
            ))}
          </div>
          <div className="mt-1 text-[10px] text-slate-500">Simulated hand-off. No data leaves your browser.</div>
          <button onClick={() => dispatch({ type: 'RESTART' })} className="mt-4 w-full rounded-lg bg-gold py-2 text-xs font-black uppercase text-ink hover:brightness-110">Play again (same startup)</button>
        </div>
      </div>
    </section>
  )
}
