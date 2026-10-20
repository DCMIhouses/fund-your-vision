import { useEffect, useState } from 'react'
import { fmt } from '../../game'
import { INDUSTRIES } from '../../data'
import { validateRun } from '../../store'
import { OUTCOME_COPY, resultInsights } from '../../shared/gameSelectors'
import { Button, Card, CashChart, Eyebrow, Progress, Term } from '../../shared/ui'
import NbfPanel from '../blueprint/NbfPanel'

const LB_KEY = 'fyv-leaderboard'
const loadLb = () => { try { return JSON.parse(localStorage.getItem(LB_KEY)) || [] } catch { return [] } }

export default function ResultsScreen({ s, dispatch, report, go }) {
  const r = s.result
  const o = OUTCOME_COPY[r.outcome]
  const ins = resultInsights(r, report?.alternatives || [])
  const [copied, setCopied] = useState(false)
  const [nick, setNick] = useState('')
  const [status, setStatus] = useState(null)
  const [lb, setLb] = useState(loadLb)
  useEffect(() => { localStorage.setItem(LB_KEY, JSON.stringify(lb)) }, [lb])
  const url = window.location.origin + window.location.pathname
  const summary = `${s.startup.name}: ${o.title}. Capital IQ ${r.score}/100 (game score). Played FUND YOUR VISION, an educational simulation: ${url}`
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: 'FUND YOUR VISION', text: summary, url }); return } catch { /* fall back */ } }
    try { await navigator.clipboard.writeText(summary); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* blocked */ }
  }
  const submit = (e) => {
    e.preventDefault()
    const name = nick.trim().slice(0, 20)
    if (!name) return
    const v = validateRun(s)
    if (!v.ok) return setStatus({ ok: false, text: v.reason })
    setLb([...lb, { nick: name, scenario: s.scenarioId, score: v.result.score, badge: v.result.badge, ownership: v.result.founderOwnership * 100, endCash: Math.round(v.result.forecast.endCash), at: Date.now() }])
    setStatus({ ok: true, text: 'Verified by replay and saved to this device’s leaderboard.' })
  }
  const tone = r.outcome === 'victory' ? 'text-fos-green' : r.outcome === 'partial' ? 'text-fos-gold' : 'text-fos-risk'
  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">
      <Card className="p-6 text-center sm:p-10">
        <Eyebrow>{s.startup.name} · {INDUSTRIES[s.startup.industry].label} · simulated outcome</Eyebrow>
        <h1 className={`fos-display mt-2 text-[36px] sm:text-[48px] ${tone}`}>{o.title}</h1>
        <p className="mx-auto mt-2 max-w-xl text-fos-muted">{o.sub}{r.forecast.insolventMonth ? ` Cash ran out in month ${r.forecast.insolventMonth}.` : ''}</p>
        <div className="mt-6 inline-flex flex-col items-center"><div className="fos-num text-[64px] font-semibold leading-none">{r.score}</div><div className="text-sm text-fos-muted"><Term k="iq">Capital IQ</Term> out of 100 · game score, not a credit score</div></div>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={() => go('/blueprint')}>See my Business Blueprint</Button>
          <Button variant="secondary" onClick={() => { dispatch({ type: 'RESTART' }); go('/play') }}>Try a new strategy</Button>
          <Button variant="secondary" onClick={share}>{copied ? 'Copied ✓' : 'Share my result'}</Button>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-3">
        <Card className="p-5"><Eyebrow>What went well</Eyebrow><ul className="mt-2 space-y-1.5 text-[15px]">{ins.well.length ? ins.well.map((b) => <li key={b.id}>✓ {b.label} ({b.pts}/{b.max})</li>) : <li className="text-fos-muted">No category reached 70% this time.</li>}</ul></Card>
        <Card className="p-5"><Eyebrow>What caused trouble</Eyebrow><ul className="mt-2 space-y-1.5 text-[15px]">{ins.trouble.length ? ins.trouble.map((t) => <li key={t}>✕ {t}</li>) : <li className="text-fos-muted">Nothing major.</li>}</ul></Card>
        <Card className="p-5"><Eyebrow>Try next time</Eyebrow><p className="mt-2 text-[15px]">{ins.tryNext ? `${ins.tryNext.label}: this game’s forecast scores it ${ins.tryNext.score} with ${fmt(ins.tryNext.endCash)} at month 18.` : 'Your plan matched or beat every single-move alternative in this model.'}</p></Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="p-5"><Eyebrow>Your 18-month cash</Eyebrow><div className="mt-2"><CashChart forecast={r.forecast} height={220} /></div></Card>
        <Card className="p-5">
          <Eyebrow>How your score was built</Eyebrow>
          <ul className="mt-3 space-y-3">{r.breakdown.map((b) => <li key={b.id}><div className="flex justify-between text-sm"><span>{b.label}</span><span className="fos-num">{b.pts}/{b.max}</span></div><Progress value={b.pts / b.max} tone="green" label={b.label} /></li>)}</ul>
        </Card>
      </div>

      {s.mode === 'tournament' && (
        <Card className="p-5">
          <Eyebrow>Tournament leaderboard (this device only)</Eyebrow>
          {!status?.ok && <form onSubmit={submit} className="mt-3 flex gap-2"><input value={nick} onChange={(e) => setNick(e.target.value)} maxLength={20} placeholder="Nickname only" aria-label="Nickname" className="min-h-[44px] min-w-0 flex-1 rounded-[14px] border border-fos-line bg-fos-surface px-4" /><Button>Submit</Button></form>}
          {status && <p className={`mt-2 text-sm ${status.ok ? 'text-fos-green' : 'text-fos-risk'}`}>{status.text}</p>}
        </Card>
      )}

      <NbfPanel s={s} />
      <p className="text-[13px] text-fos-muted">A simulation score does not predict real business survival or real credit approval.</p>
    </div>
  )
}
