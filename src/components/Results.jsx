import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import Chart from './Chart'
import Guide from './Guide'
import { Medal } from './Medals'
import { fmt } from '../game'
import { FINANCE_CARDS, INDUSTRIES } from '../data'
import { totals, findScenario } from '../engine'
import { LEVELS, achievementById } from '../achievements'
import { validateRun } from '../store'

const LB_KEY = 'fyv-leaderboard'
const loadLb = () => { try { return JSON.parse(localStorage.getItem(LB_KEY)) || [] } catch { return [] } }
const OUTCOME = {
  victory: { title: 'VICTORY', sub: 'Funded, sustainable, and still in control.', color: 'text-neon', ring: 'border-neon shadow-[0_0_60px_rgba(57,255,136,.35)]' },
  partial: { title: 'PARTIAL SUCCESS', sub: 'You survived, but the plan has cracks.', color: 'text-gold', ring: 'border-gold shadow-[0_0_60px_rgba(251,191,36,.25)]' },
  failure: { title: 'OUT OF CASH', sub: 'You raised the money but could not carry it.', color: 'text-hot', ring: 'border-hot shadow-[0_0_60px_rgba(255,46,99,.3)]' },
}
const BOARDS = [['overall', 'Overall', (e) => e.score, (e) => e.score], ['ownership', 'Ownership', (e) => e.ownership, (e) => `${e.ownership.toFixed(1)}%`], ['survival', 'Survival', (e) => e.endCash, (e) => fmt(e.endCash)]]

function useCountUp(target) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf
    const start = performance.now()
    const step = (t) => { const p = Math.min(1, (t - start) / 1400); setV(Math.round(target * (1 - (1 - p) ** 3))); if (p < 1) raf = requestAnimationFrame(step) }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target])
  return v
}

function blueprint(s, t, r) {
  const used = new Set(s.funding.filter((f) => f.status === 'available').map((f) => f.type))
  const risks = r.checks.filter((c) => !c.ok).map((c) => `- Fix: ${c.label}`)
  const events = s.resolvedEvents.map((e) => `- ${e.id.replace(/_/g, ' ')} → ${e.choice}`)
  return [
    `FUND YOUR VISION: CAPITAL BLUEPRINT (educational simulation)`,
    `${s.startup.name} · ${INDUSTRIES[s.startup.industry].label}`,
    '',
    'FUNDING OBJECTIVE',
    `- Target ${fmt(s.startup.target)}; monthly burn ${fmt(s.startup.monthlyBurn)} + founder pay ${fmt(s.startup.founderPay || 0)}`,
    `- Achieved ${fmt(t.available)} available (${Math.round((t.available / s.startup.target) * 100)}%)`,
    '',
    'FINANCING ALTERNATIVES',
    ...FINANCE_CARDS.map((c) => `- ${used.has(c.id) ? '[used]    ' : '[explore] '}${c.name}: ${c.risks}`),
    '',
    'CRITICAL RISKS',
    ...(risks.length ? risks : ['- All sustainability checks passed in this scenario']),
    `- Debt remaining at month 18: ${fmt(r.debtRemaining)}`,
    '',
    'EVENTS YOU FACED',
    ...(events.length ? events : ['- none']),
    '',
    'RECOMMENDED NEXT STEPS',
    '- Build a real 18-month cash-flow forecast with a CPA',
    '- Plan the refinance or payoff of any 0% balances before promos expire',
    '- Put any capital-partner guarantee and profit share in writing',
    '- Request a real funding eligibility assessment: nationwidebusinessfunding.com',
    '',
    'Simulation only. Not a credit offer, approval, or financial advice.',
  ].join('\n')
}

export default function Results({ s, dispatch }) {
  const r = s.result
  const t = totals(s)
  const o = OUTCOME[r.outcome]
  const iq = useCountUp(r.score)
  const [lb, setLb] = useState(loadLb)
  const [board, setBoard] = useState('overall')
  const [nick, setNick] = useState('')
  const [status, setStatus] = useState(null)
  const [consent, setConsent] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qr, setQr] = useState(null)
  const gameUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''
  const runwayMonths = r.forecast.insolventMonth ? r.forecast.insolventMonth - 1 : 18
  const level = LEVELS[Math.max(0, s.level)]
  const medals = s.achievements.map((id) => achievementById[id])
  const scenario = findScenario(s.scenarioId)

  useEffect(() => { localStorage.setItem(LB_KEY, JSON.stringify(lb)) }, [lb])
  useEffect(() => { QRCode.toDataURL(gameUrl, { margin: 1, width: 160, color: { dark: '#05070d', light: '#ffffff' } }).then(setQr).catch(() => setQr(null)) }, [gameUrl])

  const summary = [
    `${s.startup.name}: ${o.title} · Startup Capital IQ ${r.score}/100 (${r.badge}) · ${level.name}`,
    `Funded ${Math.round((t.available / s.startup.target) * 100)}% of ${fmt(s.startup.target)} · kept ${(r.founderOwnership * 100).toFixed(1)}% · ${medals.length} medals`,
    `Play FUND YOUR VISION (simulation): ${gameUrl}`,
  ].join('\n')
  const bp = useMemo(() => blueprint(s, t, r), [s, t, r])

  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: 'FUND YOUR VISION', text: summary, url: gameUrl }); return } catch { /* fall back */ } }
    await navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  const download = () => {
    const url = URL.createObjectURL(new Blob([bp], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${s.startup.name.replace(/\W+/g, '-')}-capital-blueprint.txt`
    a.click()
    URL.revokeObjectURL(url)
  }
  const submit = (e) => {
    e.preventDefault()
    const name = nick.trim().slice(0, 20)
    if (!name) return
    const v = validateRun(s)
    if (!v.ok) { setStatus({ ok: false, text: v.reason }); return }
    setLb([...lb, { nick: name, scenario: s.scenarioId, score: v.result.score, badge: v.result.badge, ownership: v.result.founderOwnership * 100, endCash: Math.round(v.result.forecast.endCash), at: Date.now() }])
    setStatus({ ok: true, text: 'Verified by replay and posted.' })
  }
  const cta = (campaign) => {
    const q = new URLSearchParams({ utm_source: 'fund-your-vision-game', utm_medium: 'buildathon', utm_campaign: campaign })
    if (consent) { q.set('industry', s.startup.industry); q.set('target', s.startup.target); q.set('iq', r.score); q.set('outcome', r.outcome) }
    return `https://nationwidebusinessfunding.com/?${q}`
  }
  const [, , sortKey, show] = BOARDS.find((b) => b[0] === board)
  const rows = lb.filter((e) => !s.scenarioId || e.scenario === s.scenarioId || s.mode !== 'tournament').sort((a, b) => sortKey(b) - sortKey(a)).slice(0, 10)
  const confetti = useMemo(() => Array.from({ length: 60 }, (_, i) => ({ left: (i * 37.7) % 100, delay: ((i * 13) % 15) / 10, dur: 2.5 + ((i * 7) % 25) / 10, color: ['#39ff88', '#22d3ee', '#fbbf24', '#ff2e63'][i % 4] })), [])

  return (
    <section className={`relative rounded-3xl border-2 bg-panel p-5 md:p-7 ${o.ring}`}>
      {r.outcome === 'victory' && confetti.map((c, i) => <span key={i} className="confetti" style={{ left: `${c.left}%`, background: c.color, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s` }} />)}
      <div className="text-center">
        <div className="text-[13px] font-black uppercase tracking-[0.35em] text-slate-400">{s.startup.name} · {INDUSTRIES[s.startup.industry].label} · {s.mode === 'tournament' ? 'Tournament' : 'Arcade'}</div>
        <h2 className={`medal-pop mt-1 text-4xl font-black uppercase md:text-6xl ${o.color}`}>{o.title}</h2>
        <p className="text-sm text-slate-400">{o.sub}{r.forecast.insolventMonth ? ` Cash ran out in month ${r.forecast.insolventMonth}.` : ''} <span className="text-slate-600">(simulated outcome)</span></p>
      </div>

      <div className="mt-6"><Guide id="results" /></div>
      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-edge bg-ink/70 p-4 text-center">
          <div className="text-xs uppercase tracking-widest text-slate-500">Startup Capital IQ</div>
          <div className={`font-mono text-7xl font-black tabular-nums ${o.color}`}>{iq}</div>
          <div className="mt-1 inline-block rounded-full border border-gold/60 bg-gold/10 px-3 py-1 text-xs font-black uppercase text-gold">{r.badge}</div>
          <div className="mt-2 text-[13px] text-slate-400">Founder Level <span className="font-black text-gold">L{Math.max(0, s.level) + 1}: {level.name}</span></div>
          <div className="mt-4 space-y-1.5 text-left">
            {r.breakdown.map((b) => (
              <div key={b.id}>
                <div className="flex justify-between text-[13px]"><span className="text-slate-300">{b.label}</span><span className="font-mono text-white">{b.pts}/{b.max}</span></div>
                <div className="h-1.5 overflow-hidden rounded bg-edge"><div className="h-full bg-neon transition-all duration-1000" style={{ width: `${(b.pts / b.max) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[['Ending cash', fmt(r.forecast.endCash)], ['Debt remaining', fmt(r.debtRemaining)], ['Ownership kept', `${(r.founderOwnership * 100).toFixed(1)}%`], ['Runway', runwayMonths >= 18 ? '18+ mo' : `${runwayMonths} mo`], ['Available funding', fmt(t.available)], ['% of target', `${Math.round((t.available / s.startup.target) * 100)}%`], ['Debt / Equity', `${fmt(t.debt)} / ${fmt(t.equity)}`], ['Boss moves', r.moves.length ? r.moves.join(', ') : 'none']].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-edge bg-ink/60 p-2"><div className="text-[11px] uppercase tracking-widest text-slate-500">{k}</div><div className="truncate font-mono text-sm font-black text-white">{v}</div></div>
            ))}
          </div>
          <div className="rounded-2xl border border-edge bg-ink/70 p-3"><Chart forecast={r.forecast} height={150} /></div>
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-gold">Medals earned this run ({medals.length})</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {medals.map((a, i) => (
                <div key={a.id} className="medal-pop flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/5 py-1 pl-1 pr-3" style={{ animationDelay: `${0.3 + i * 0.12}s` }}>
                  <Medal a={a} size="sm" /><span className="text-xs font-bold text-white">{a.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-edge bg-ink/60 p-4">
          <div className="text-xs font-black uppercase tracking-widest text-white">Buildathon Leaderboard</div>
          <div className="text-xs text-hot">Local demo leaderboard: saved on this device only (no hosted backend).</div>
          <div className="mt-2 grid grid-cols-3 gap-1">
            {BOARDS.map(([id, label]) => <button key={id} onClick={() => setBoard(id)} className={`rounded-md py-1 text-xs font-black uppercase ${board === id ? 'bg-neon text-ink' : 'border border-edge text-slate-400'}`}>{label}</button>)}
          </div>
          {s.mode === 'tournament' ? (!status?.ok && (
            <form onSubmit={submit} className="mt-2 flex gap-2">
              <input value={nick} onChange={(e) => setNick(e.target.value)} maxLength={20} placeholder="Nickname only" className="min-w-0 flex-1 rounded-lg border border-edge bg-ink px-2 py-1.5 text-sm text-white focus:border-neon focus:outline-none" />
              <button className="rounded-lg bg-neon px-3 text-xs font-black uppercase text-ink">Submit</button>
            </form>
          )) : <div className="mt-2 rounded-lg border border-dashed border-edge p-2 text-[13px] text-slate-400">Arcade scores are unofficial. Play <b className="text-gold">Tournament Mode</b> to post a verified score.</div>}
          {status && <div className={`mt-1 text-[13px] ${status.ok ? 'text-neon' : 'text-hot'}`}>{status.text}</div>}
          <div className="mt-1 text-xs text-slate-500">{scenario && s.mode === 'tournament' ? scenario.label : 'All tournament scenarios'}</div>
          <ol className="mt-2 space-y-1">
            {rows.length === 0 && <li className="text-[13px] text-slate-500">No verified scores yet.</li>}
            {rows.map((e, i) => (
              <li key={e.at} className="flex justify-between gap-2 rounded bg-ink/70 px-2 py-1 text-[13px]">
                <span className="truncate text-slate-300">{i + 1}. {e.nick} <span className="text-slate-500">· {e.badge}</span></span>
                <span className="shrink-0 font-mono text-neon">{show(e)}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl border border-cyan/50 bg-cyan/5 p-4">
          <div className="text-xs font-black uppercase tracking-widest text-white">The Capital Blueprint</div>
          <div className="text-xs text-slate-400">Your personalized, educational summary: objectives, alternatives, risks, next steps.</div>
          <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap rounded-lg border border-edge bg-ink p-2 font-mono text-[11px] text-slate-400">{bp}</pre>
          <button onClick={download} className="mt-2 w-full rounded-lg border border-cyan/60 py-1.5 text-[13px] font-black uppercase text-cyan hover:bg-cyan/10">Download Capital Blueprint</button>
          <div className="mt-3 space-y-1.5">
            {[['assessment', 'Request a real funding eligibility assessment'], ['capital-partner', 'Explore a qualified capital partnership'], ['fractional-cco', 'Discuss Fractional CCO services']].map(([c, label]) => (
              <a key={c} href={cta(c)} target="_blank" rel="noreferrer" className="block rounded-lg bg-cyan px-3 py-1.5 text-center text-[13px] font-black uppercase text-ink hover:brightness-110">{label}</a>
            ))}
          </div>
          <label className="mt-2 flex items-start gap-2 text-xs text-slate-400">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-cyan" />
            Include my game scenario (industry, target, score, outcome). No personal or credit data is sent.
          </label>
          <div className="mt-1 text-xs text-slate-500">The game does not approve loans, make offers, or verify partners.</div>
        </div>

        <div className="rounded-2xl border border-edge bg-ink/60 p-4">
          <div className="text-xs font-black uppercase tracking-widest text-white">Share Your Result</div>
          <div className="mt-2 rounded-xl border border-neon/40 bg-gradient-to-br from-neon/10 via-ink to-cyan/10 p-3">
            <img src={`${import.meta.env.BASE_URL}fyv-logo.png`} alt="FYV" className="h-12 w-auto" />
            <div className="text-sm font-black text-white">{s.startup.name}</div>
            <div className={`font-mono text-3xl font-black ${o.color}`}>{r.score}<span className="text-sm text-slate-400">/100</span></div>
            <div className="text-xs text-slate-300">{o.title} · {r.badge} · {level.name} · {medals.length} medals</div>
          </div>
          <button onClick={share} className="mt-2 w-full rounded-lg border border-neon/60 py-1.5 text-xs font-black uppercase text-neon hover:bg-neon/10">{copied ? 'Copied ✓' : 'Share result'}</button>
          {qr && <div className="mt-2 flex items-center gap-2"><img src={qr} alt="QR code to play" className="h-20 w-20 rounded bg-white p-1" /><span className="text-xs text-slate-400">Scan to play on your phone</span></div>}
          <p className="text-xs text-slate-400">Nothing is sent from this game. Use the links above to contact NationwideBusinessFunding.com yourself.</p>
          <button onClick={() => dispatch({ type: 'RESTART' })} className="mt-3 w-full rounded-lg bg-gold py-2 text-xs font-black uppercase text-ink hover:brightness-110">Play again</button>
        </div>
      </div>
    </section>
  )
}
