import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { REPORT_TYPES, SECTION_TITLE, buildReport, compareSnapshots, formatMetric, money, pct, reportType, snapshotOf } from '../report'
import { agentStates } from '../agents'
import { QUESTIONS, answer } from '../consultant'
import Chart from './Chart'
import Guide from './Guide'
import Gauge from './Gauge'
import Tilt from './Tilt'
import AgentOffice from './AgentOffice'

const SNAP_KEY = 'fyv-report-snapshots'
const loadSnaps = () => { try { return JSON.parse(localStorage.getItem(SNAP_KEY)) || [] } catch { return [] } }
const LIGHT = {
  ok: { dot: 'bg-neon', label: 'All clear', text: 'text-neon', ring: 'border-neon/40' },
  watch: { dot: 'bg-gold', label: 'Watching', text: 'text-gold', ring: 'border-gold/50' },
  alert: { dot: 'bg-hot', label: 'Alert', text: 'text-hot', ring: 'border-hot/60' },
}
const clock = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })

function useReport(s, previous) {
  return useMemo(() => buildReport(s, { previous }), [s, previous])
}

export function AgentBoard({ report }) {
  const agents = agentStates(report)
  const prev = useRef(Object.fromEntries(agents.map((a) => [a.id, a.finding])))
  const [feed, setFeed] = useState(() => agents.map((a) => ({ k: `${a.id}-0`, id: a.id, at: clock(), icon: a.icon, name: a.name, status: a.status, text: a.finding })).slice(0, 8))
  const sig = agents.map((a) => a.finding).join('|')
  useEffect(() => {
    const changed = agents.filter((a) => prev.current[a.id] !== a.finding)
    if (!changed.length) return
    changed.forEach((a) => { prev.current[a.id] = a.finding })
    const at = clock()
    setFeed((f) => [...changed.map((a) => ({ k: `${a.id}-${Date.now()}`, id: a.id, at, icon: a.icon, name: a.name, status: a.status, text: a.finding })), ...f].slice(0, 12))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig])
  const alerts = agents.filter((a) => a.status === 'alert').length
  const watching = agents.filter((a) => a.status === 'watch').length
  return (
    <div className="glass rounded-3xl border border-cyan/40 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan">Live agent display</div>
          <h3 className="text-aurora mt-1 text-2xl font-black uppercase md:text-3xl">What your agents are doing</h3>
          <div className="mt-1 text-sm text-slate-400">Rule-based helpers. They read the game engine's numbers after every move. They are not live AI.</div>
        </div>
        <div className="flex items-center gap-4">
          <Radar agents={agents} active={feed[0]?.id} />
          <div className="flex flex-col gap-2 text-xs font-black uppercase">
            <span className="rounded-full border border-hot/50 px-3 py-1 text-hot">{alerts} alert</span>
            <span className="rounded-full border border-gold/50 px-3 py-1 text-gold">{watching} watching</span>
            <span className="rounded-full border border-neon/50 px-3 py-1 text-neon">{agents.length - alerts - watching} clear</span>
          </div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        {agents.map((a) => {
          const L = LIGHT[a.status]
          return (
            <Tilt key={a.id} className={`overflow-hidden rounded-2xl border ${L.ring} bg-ink/70 p-4`}>
              <div className="flex items-center gap-3">
                <div className="relative grid h-12 w-12 shrink-0 place-items-center">
                  <span className={`absolute inset-0 rounded-full border-2 border-dashed ${L.ring} ${a.status !== 'ok' ? 'animate-spin [animation-duration:6s]' : ''}`} />
                  <span className="text-2xl">{a.icon}</span>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-white">{a.name}</div>
                  <div className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider ${L.text}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${L.dot} ${a.status !== 'ok' ? 'animate-pulse' : ''}`} />{L.label}
                  </div>
                </div>
              </div>
              <div className="mt-2 w-fit max-w-full truncate rounded-lg bg-edge/60 px-2 py-1 font-mono text-[11px] text-slate-200">{a.metric}</div>
              <div className="mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Checking</div>
              <div className="text-xs text-slate-300">{a.task}</div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-edge/60"><div className={`h-full w-1/3 rounded-full ${L.dot} agent-scan`} /></div>
              <div className="mt-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Latest finding</div>
              <div className="text-sm leading-snug text-slate-100">{a.finding}</div>
            </Tilt>
          )
        })}
      </div>
      <div className="mt-5 rounded-2xl border border-edge bg-ink/70 p-4">
        <div className="text-xs font-black uppercase tracking-widest text-slate-400">Activity feed (newest first)</div>
        <ol className="mt-2 space-y-1.5">
          {feed.map((e) => (
            <li key={e.k} className="flex gap-2 text-[13px] leading-snug">
              <span className="shrink-0 font-mono text-slate-500">{e.at}</span>
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${LIGHT[e.status].dot}`} />
              <span className="min-w-0 text-slate-300"><b className="text-white">{e.icon} {e.name}:</b> {e.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

function Radar({ agents, active }) {
  return (
    <div className="relative h-32 w-32 shrink-0 rounded-full border border-cyan/30 bg-ink/60 shadow-[0_0_40px_-10px_rgba(34,211,238,.6)]">
      <span className="absolute inset-[18%] rounded-full border border-cyan/15" />
      <span className="absolute inset-[36%] rounded-full border border-cyan/15" />
      <span className="radar-sweep" />
      {agents.map((a, i) => {
        const ang = (i / agents.length) * 2 * Math.PI - Math.PI / 2
        return (
          <span key={a.id} title={`${a.name}: ${LIGHT[a.status].label}`} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${50 + 40 * Math.cos(ang)}%`, top: `${50 + 40 * Math.sin(ang)}%` }}>
            {a.id === active && <span className={`absolute inset-0 rounded-full ${LIGHT[a.status].dot} animate-ping`} />}
            <span className={`relative block h-3 w-3 rounded-full ${LIGHT[a.status].dot}`} />
          </span>
        )
      })}
      <span className="absolute inset-0 grid place-items-center text-xl">📡</span>
    </div>
  )
}

export function AgentStrip({ s, onOpen }) {
  const report = useReport(s, null)
  const agents = agentStates(report)
  return (
    <button onClick={onOpen} className="mb-4 w-full rounded-2xl border border-cyan/40 bg-panel/80 p-3 text-left hover:border-cyan">
      <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-cyan"><span>Agents at work</span><span className="text-slate-400">Open ›</span></div>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {agents.map((a) => (
          <div key={a.id} title={`${a.name}: ${a.finding}`} className="flex flex-col items-center rounded-xl bg-ink/70 py-1.5">
            <span className="relative text-xl">{a.icon}<span className={`absolute -right-1 -top-0.5 h-2.5 w-2.5 rounded-full ${LIGHT[a.status].dot} ${a.status !== 'ok' ? 'animate-pulse' : ''}`} /></span>
            <span className="mt-0.5 w-full truncate px-1 text-center text-[9px] font-bold text-slate-400">{a.name.split(' ')[0]}</span>
          </div>
        ))}
      </div>
    </button>
  )
}

function Tile({ label, value, sub, tone = 'text-white', delta, small }) {
  return (
    <Tilt className="glass rounded-2xl p-3">
      <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`mt-1 truncate font-mono font-black ${small ? 'text-base' : 'text-xl md:text-2xl'} ${tone}`}>{value}</div>
      <div className="flex justify-between gap-2 text-[11px] text-slate-500"><span>{sub}</span>{delta}</div>
    </Tilt>
  )
}

function Consultant({ report, typeId, onClose }) {
  const [chat, setChat] = useState([])
  const ask = (q, label) => setChat((c) => [...c, { q: label, a: answer(report, q) }])
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-cyan/50 bg-panel p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-cyan">🧭 Guidance Consultant</div>
            <div className="text-lg font-black text-white">Discussing: {reportType(typeId).name}</div>
            <div className="text-xs text-slate-400">Answers use the report's checked numbers and fixed rules. Not live AI, not financial advice.</div>
          </div>
          <button onClick={onClose} className="rounded-lg border border-edge px-3 py-1.5 text-sm font-bold text-slate-300 hover:border-hot hover:text-hot">Close</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {QUESTIONS.map(([id, label]) => (
            <button key={id} onClick={() => ask(id, label)} className="min-h-[40px] rounded-full border border-cyan/50 px-3 text-[13px] font-bold text-cyan hover:bg-cyan/10">{label}</button>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          {chat.length === 0 && <div className="rounded-xl border border-dashed border-edge p-3 text-sm text-slate-400">Tap a question above.</div>}
          {chat.map((m, i) => (
            <div key={i} className="space-y-1.5">
              <div className="ml-auto w-fit max-w-[85%] rounded-2xl bg-cyan/15 px-3 py-2 text-sm font-bold text-cyan">{m.q}</div>
              <div className="max-w-[95%] rounded-2xl bg-ink px-3 py-2 text-sm leading-relaxed text-slate-200">{m.a.map((l) => <div key={l}>{l}</div>)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Modal({ title, kicker, onClose, children }) {
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-cyan/50 bg-panel p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div><div className="text-xs font-black uppercase tracking-widest text-cyan">{kicker}</div><div className="text-xl font-black text-white">{title}</div></div>
          <button onClick={onClose} className="rounded-lg border border-edge px-3 py-1.5 text-sm font-bold text-slate-300 hover:border-hot hover:text-hot">Close</button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

const TD = 'py-1.5 text-right font-mono'

export default function CommandCenter({ s, goTo }) {
  const [snaps, setSnaps] = useState(loadSnaps)
  const company = s.startup.name || 'Your startup'
  const mine = snaps.filter((x) => x.company === company)
  const previous = mine[mine.length - 1] || null
  const report = useReport(s, previous)
  const k = report.kpis
  const [typeId, setTypeId] = useState('all')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [talk, setTalk] = useState(false)
  const [cmp, setCmp] = useState(['', ''])
  const [showAll, setShowAll] = useState(false)
  const [view, setView] = useState(null)
  useEffect(() => { localStorage.setItem(SNAP_KEY, JSON.stringify(snaps.slice(-30))) }, [snaps])

  const recOk = report.reconciliation.filter((c) => c.ok).length
  const chg = Object.fromEntries((report.changes || []).map((c) => [c.key, c]))
  const delta = (key, good = 1) => {
    const c = chg[key]
    if (!c || !c.delta) return null
    const up = c.delta > 0
    return <span className={(up ? good : -good) > 0 ? 'text-neon' : 'text-hot'}>{up ? '▲' : '▼'} {formatMetric(Math.abs(c.delta), c.fmt)}</span>
  }
  const save = () => setSnaps((x) => [...x, snapshotOf(report, `${company} · ${new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · ${s.phase}`)])
  const download = async () => {
    setBusy(true); setErr('')
    try { const { downloadReportPdf } = await import('../pdf/generate.jsx'); await downloadReportPdf(report, typeId) } catch (e) { setErr(`PDF failed: ${e.message}`) }
    setBusy(false)
  }
  const openDesk = (id) => {
    const nav = { architect: 'fund', vc: 'fund', growth: 'team' }
    if (id === 'guide') return setTalk(true)
    if (nav[id] && goTo) return goTo(nav[id])
    setView({ cfo: 'model', underwriting: 'apps', reporting: 'builder', risk: 'risks', architect: 'capital', vc: 'capital', growth: 'team' }[id] || id)
  }
  const a = snaps.find((x) => x.id === cmp[0]), b = snaps.find((x) => x.id === cmp[1])
  const diff = a && b ? compareSnapshots(a, b) : null
  const maxMix = Math.max(1, ...report.mix.map((m) => m.amount))
  const sev = { High: 'border-hot/60 text-hot', Medium: 'border-gold/60 text-gold', Low: 'border-neon/50 text-neon' }

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.3em] text-gold">Business intelligence</div>
          <h2 className="text-aurora mt-1 text-3xl font-black uppercase md:text-5xl">Command Center</h2>
          <div className="mt-1 text-sm text-slate-400">{report.company.name} · {report.company.industry} · {report.meta.scenario}</div>
        </div>
        <div className={`rounded-full border px-4 py-2 text-xs font-black uppercase ${recOk === report.reconciliation.length ? 'border-neon/60 text-neon' : 'border-hot/60 text-hot'}`}>
          {recOk}/{report.reconciliation.length} numbers reconciled {recOk === report.reconciliation.length ? '✓' : '✗'}
        </div>
      </div>
      <Guide id="reports" />
      <AgentOffice agents={agentStates(report)} onOpen={openDesk} />
      <AgentBoard report={report} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Funded', Math.min(1, k.fundedPct), 1, pct(k.fundedPct, 0), `${money(k.available)} of ${money(k.target)}`, ['#39ff88', '#22d3ee']],
          ['Runway', Math.min(k.runwayDays, 365), 365, `${k.runwayDays}d`, `Out ${k.runOutDate}`, k.runwayDays < 90 ? ['#ff2e63', '#fbbf24'] : ['#22d3ee', '#a855f7']],
          ['Capital IQ', k.iq, 100, String(k.iq), report.iqFinal ? 'Final score' : 'Provisional', ['#a855f7', '#fbbf24']],
          ['Fundability', k.fundability, 100, String(k.fundability), `Tier ${k.tier} (mock)`, ['#fbbf24', '#f97316']],
        ].map(([label, v, max, disp, sub, colors]) => (
          <Tilt key={label} className="glass rounded-3xl p-4">
            <div className="flex flex-col items-center text-center">
              <Gauge value={v} max={max} size={116} stroke={11} colors={colors} display={disp} />
              <div className="mt-2 text-xs font-black uppercase tracking-widest text-slate-200">{label}</div>
              <div className="text-[11px] text-slate-500">{sub}</div>
            </div>
          </Tilt>
        ))}
      </div>

      <div>
        <div className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Key numbers {previous ? '(arrows = change since your last snapshot)' : ''}</div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          <Tile label="Raised" value={money(k.committed)} sub="Promised + ready" tone="text-sky-300" delta={delta('committed')} />
          <Tile label="Available" value={money(k.available)} sub="Ready now" tone="text-neon" delta={delta('available')} />
          <Tile label="Target" value={money(k.target)} sub={`${pct(k.fundedPct, 0)} funded`} tone="text-gold" />
          <Tile label="Runway" value={`${k.runwayDays}d`} sub={`Out ${k.runOutDate}`} tone="text-cyan" delta={delta('runwayDays')} />
          <Tile label="Monthly burn" value={money(k.monthlyBurn)} sub="Costs / month" delta={delta('monthlyBurn', -1)} />
          <Tile label="Debt" value={money(k.debt)} sub={`${money(k.promoExposure)} at 0%`} tone={k.debt ? 'text-gold' : 'text-white'} delta={delta('debt', -1)} />
          <Tile label="Ownership" value={pct(k.founderOwnership)} sub={`${k.boardSeats} board seats`} delta={delta('founderOwnership')} />
          <Tile label="Fundability" value={k.fundability} sub={`Tier ${k.tier} (mock)`} delta={delta('fundability')} />
          <Tile label="Capital IQ" value={`${k.iq}`} sub={report.iqFinal ? 'Final' : 'Provisional'} tone="text-cyan" delta={delta('iq')} />
          <Tile label="Month-18 cash" value={money(k.endCash)} sub="Forecast" tone={k.endCash < 0 ? 'text-hot' : 'text-neon'} delta={delta('endCash')} />
          <Tile label="Debt at M18" value={money(k.debtRemaining)} sub="Forecast" delta={delta('debtRemaining', -1)} />
          <Tile label="Capital deployed" value="Unavailable" sub="Not tracked by the game" tone="text-slate-500" small />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 rounded-2xl border border-edge bg-panel/70 p-4">
          <div className="text-xs font-black uppercase tracking-widest text-slate-400">18-month cash forecast</div>
          <Chart forecast={report.forecast} />
          <div className="text-xs text-slate-500">{report.forecast.basis} {report.forecast.insolventMonth ? `Runs out in month ${report.forecast.insolventMonth}.` : 'Stays above $0.'}</div>
        </div>
        <div className="min-w-0 rounded-2xl border border-edge bg-panel/70 p-4">
          <div className="text-xs font-black uppercase tracking-widest text-slate-400">Capital mix (available)</div>
          {report.mix.length === 0 && <div className="mt-3 text-sm text-slate-500">No available capital yet.</div>}
          <div className="mt-3 space-y-2">
            {report.mix.map((m) => (
              <div key={m.kind}>
                <div className="flex justify-between text-[13px]"><span className="text-slate-300">{m.label}</span><span className="font-mono text-white">{money(m.amount)} · {pct(m.share, 0)}</span></div>
                <div className="mt-1 h-2.5 rounded-full bg-edge/60"><div className={`h-full rounded-full ${m.kind === 'vc' ? 'bg-sky-400' : ['credit', 'term', 'partner'].includes(m.kind) ? 'bg-gold' : 'bg-neon'}`} style={{ width: `${(m.amount / maxMix) * 100}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-gold/40 bg-gold/5 p-3 text-[13px] leading-relaxed text-slate-300">
            <div className="mb-1 text-xs font-black uppercase tracking-widest text-gold">Executive commentary · rule-based</div>
            {report.commentary.map((l) => <p key={l} className="mb-1">{l}</p>)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-edge bg-panel/70 p-4">
          <div className="text-xs font-black uppercase tracking-widest text-slate-400">Risks</div>
          {report.risks.length === 0 && <div className="mt-2 text-sm text-neon">No material risks found.</div>}
          <ul className="mt-2 space-y-2">
            {report.risks.map((r) => (
              <li key={r.id} className={`rounded-xl border bg-ink/60 p-3 ${sev[r.severity]}`}>
                <div className="flex justify-between gap-2 text-sm font-black"><span>{r.title}</span><span className="shrink-0 text-[11px] uppercase">{r.severity}</span></div>
                <div className="text-[13px] text-slate-300">{r.evidence}</div>
                <div className="text-[11px] text-slate-500">Raised by: {r.owner}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0 rounded-2xl border border-edge bg-panel/70 p-4">
          <div className="text-xs font-black uppercase tracking-widest text-slate-400">Action plan</div>
          <ol className="mt-2 space-y-2">
            {report.actions.map((x, i) => (
              <li key={x.action} className="flex gap-3 rounded-xl border border-edge bg-ink/60 p-3">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black text-ink ${x.priority === 1 ? 'bg-hot' : x.priority === 2 ? 'bg-gold' : 'bg-neon'}`}>{i + 1}</span>
                <div><div className="text-sm font-black text-white">{x.action}</div><div className="text-[13px] text-slate-400">{x.why} <span className="text-slate-500">({x.owner})</span></div></div>
              </li>
            ))}
          </ol>
          <div className="mt-3 text-xs font-black uppercase tracking-widest text-slate-400">Milestones</div>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[13px] text-slate-300">{report.milestones.map((m) => <li key={m}>{m}</li>)}</ul>
        </div>
      </div>

      <div className="min-w-0 rounded-2xl border border-edge bg-panel/70 p-4">
        <div className="text-xs font-black uppercase tracking-widest text-slate-400">Debt and repayments</div>
        {report.debt.length === 0 ? <div className="mt-2 text-sm text-slate-500">No debt right now.</div> : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[13px]">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="py-1">Instrument</th><th className="text-right">Balance</th><th>Rate</th><th className="text-right">Payment/mo</th></tr></thead>
              <tbody>{report.debt.map((d) => (
                <tr key={d.label} className="border-t border-edge/60"><td className="py-1.5 text-slate-200">{d.label}</td><td className="text-right font-mono text-white">{money(d.balance)}</td><td className="text-slate-300">{d.promoMonths ? `0% for ${d.promoMonths} mo, then ${pct(d.postPromoApr, 0)}` : `${pct(d.apr)} fixed`}</td><td className="text-right font-mono text-slate-200">{money(d.payment)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-gold/50 bg-gradient-to-br from-gold/10 via-panel to-panel p-5">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-gold">Executive reports</div>
        <div className="mt-1 text-xl font-black text-white">Pick a report, then download it as a PDF</div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {REPORT_TYPES.map((t) => (
            <button key={t.id} onClick={() => setTypeId(t.id)} className={`min-h-[56px] rounded-xl border px-3 py-2 text-left text-[13px] font-bold leading-tight ${typeId === t.id ? 'border-gold bg-gold text-ink' : 'border-edge text-slate-300 hover:border-gold/60'}`}>
              {t.name}<div className={`text-[11px] font-normal ${typeId === t.id ? 'text-ink/70' : 'text-slate-500'}`}>{t.sections.length} sections</div>
            </button>
          ))}
        </div>
        <div className="mt-3 text-xs text-slate-400">Includes: {reportType(typeId).sections.map((id) => SECTION_TITLE[id]).join(' · ')}</div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button onClick={download} disabled={busy} className="min-h-[52px] rounded-2xl bg-gold text-sm font-black uppercase tracking-wider text-ink hover:brightness-110 disabled:opacity-60">{busy ? 'Building PDF…' : 'Download PDF'}</button>
          <button onClick={() => setTalk(true)} className="min-h-[52px] rounded-2xl border border-cyan/60 text-sm font-black uppercase tracking-wider text-cyan hover:bg-cyan/10">🧭 Discuss this report</button>
        </div>
        {err && <div className="mt-2 text-sm text-hot">{err}</div>}
      </div>

      <div className="min-w-0 rounded-2xl border border-edge bg-panel/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-slate-400">Report history</div>
            <div className="text-[13px] text-slate-500">Snapshots are saved in this browser only.</div>
          </div>
          <button onClick={save} className="min-h-[44px] rounded-xl bg-cyan px-4 text-xs font-black uppercase text-ink hover:brightness-110">Save snapshot</button>
        </div>
        {snaps.length === 0 ? <div className="mt-3 text-sm text-slate-500">No snapshots yet.</div> : (
          <>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[0, 1].map((i) => (
                <select key={i} value={cmp[i]} onChange={(e) => setCmp((c) => (i ? [c[0], e.target.value] : [e.target.value, c[1]]))} className="min-h-[44px] rounded-xl border border-edge bg-ink px-3 text-sm text-slate-200">
                  <option value="">{i ? 'Compare to…' : 'Pick a snapshot…'}</option>
                  {snaps.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                </select>
              ))}
            </div>
            {diff && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-[13px]">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="py-1">Metric</th><th className="text-right">From</th><th className="text-right">To</th><th className="text-center">Material?</th></tr></thead>
                  <tbody>{diff.map((d) => (
                    <tr key={d.key} className="border-t border-edge/60"><td className="py-1.5 text-slate-200">{d.label}</td><td className="text-right font-mono">{formatMetric(d.from, d.fmt)}</td><td className="text-right font-mono text-white">{formatMetric(d.to, d.fmt)}</td><td className={`text-center font-black ${d.material ? 'text-gold' : 'text-slate-600'}`}>{d.material ? 'Yes' : 'No'}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <div className="min-w-0 rounded-2xl border border-edge bg-panel/70 p-4">
        <div className="text-xs font-black uppercase tracking-widest text-slate-400">Decision and event timeline</div>
        <ol className="mt-2 space-y-1 text-[13px]">
          {(showAll ? report.timeline : report.timeline.slice(-10)).map((t) => <li key={t.n} className="flex gap-2"><span className="w-8 shrink-0 text-right font-mono text-slate-500">{t.n}</span><span className="text-slate-300">{t.text}</span></li>)}
        </ol>
        {report.timeline.length > 10 && <button onClick={() => setShowAll((v) => !v)} className="mt-2 text-xs font-bold text-cyan">{showAll ? 'Show last 10' : `Show all ${report.timeline.length}`}</button>}
      </div>

      {talk && <Consultant report={report} typeId={typeId} onClose={() => setTalk(false)} />}
      {view === 'model' && (
        <Modal kicker="💵 AI CFO" title="Financial model" onClose={() => setView(null)}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Tile label="Monthly burn" value={money(k.monthlyBurn)} sub="Model" />
            <Tile label="Runway" value={`${k.runwayDays}d`} sub={`Out ${k.runOutDate}`} tone="text-cyan" />
            <Tile label="Lowest cash" value={money(k.minCash)} sub="Forecast" tone={k.minCash < 0 ? 'text-hot' : 'text-neon'} />
            <Tile label="Month-18 cash" value={money(k.endCash)} sub="Forecast" tone={k.endCash < 0 ? 'text-hot' : 'text-neon'} />
          </div>
          <div className="mt-4 rounded-2xl border border-edge bg-ink/60 p-3"><Chart forecast={report.forecast} /></div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-[13px]">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="text-left">Month</th><th className="text-right">Revenue</th><th className="text-right">Expenses</th><th className="text-right">Debt service</th><th className="text-right">End cash</th></tr></thead>
              <tbody>{report.forecast.months.map((m) => <tr key={m.m} className="border-t border-edge/60"><td className="py-1.5 text-slate-300">M{m.m}</td><td className={TD}>{money(m.revenue)}</td><td className={TD}>{money(m.expenses)}</td><td className={TD}>{money(m.debt)}</td><td className={`${TD} ${m.cash < 0 ? 'text-hot' : 'text-white'}`}>{money(m.cash)}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="mt-2 text-xs text-slate-500">{report.forecast.basis} All months are forecasts from the game engine.</div>
        </Modal>
      )}
      {view === 'apps' && (
        <Modal kicker="🔍 AI Underwriter" title="Application analysis" onClose={() => setView(null)}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Tile label="Mock score" value={report.underwriting.fundability} sub={`Tier ${report.underwriting.tier.tier} · ${report.underwriting.tier.label}`} tone="text-cyan" />
            <Tile label="FICO" value={report.underwriting.profile.fico} sub="Illustrative" />
            <Tile label="Utilization" value={`${report.underwriting.profile.utilization}%`} sub="Revolving" />
            <Tile label="Inquiries" value={report.underwriting.profile.inquiries} sub="Incl. applications" />
          </div>
          <div className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">Applications</div>
          {report.underwriting.applications.length === 0 ? <div className="mt-2 text-sm text-slate-500">{report.underwriting.done ? 'No applications yet.' : 'Underwriting not run yet.'}</div> : (
            <ul className="mt-2 space-y-2">{report.underwriting.applications.map((x, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-edge bg-ink/60 p-3 text-[13px]">
                <span className="font-bold text-white">{x.label}</span>
                <span className={`font-black uppercase ${x.status === 'declined' ? 'text-hot' : x.status === 'available' ? 'text-neon' : 'text-gold'}`}>{x.status} · {money(x.amount)}</span>
                <span className="w-full text-slate-400">{x.reason}</span>
              </li>
            ))}</ul>
          )}
          <div className="mt-2 text-xs text-slate-500">Simulated underwriting. Not an Experian or lender decision.</div>
          {goTo && <button onClick={() => { setView(null); goTo('underwrite') }} className="mt-4 min-h-[48px] w-full rounded-2xl bg-cyan text-sm font-black uppercase text-ink">Go to Underwriting step</button>}
        </Modal>
      )}
      {view === 'builder' && (
        <Modal kicker="📊 Reporting Agent" title="Live report builder" onClose={() => setView(null)}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {REPORT_TYPES.map((t) => (
              <button key={t.id} onClick={() => setTypeId(t.id)} className={`min-h-[48px] rounded-xl border px-3 py-2 text-left text-[13px] font-bold ${typeId === t.id ? 'border-gold bg-gold text-ink' : 'border-edge text-slate-300 hover:border-gold/60'}`}>{t.name}</button>
            ))}
          </div>
          <div className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">Sections being assembled</div>
          <ol className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">{reportType(typeId).sections.map((id, i) => <li key={id} className="flex items-center gap-2 text-[13px] text-slate-300"><span className="grid h-5 w-5 place-items-center rounded-full bg-neon/20 text-[10px] font-black text-neon">✓</span>{i + 1}. {SECTION_TITLE[id]}</li>)}</ol>
          <div className="mt-4 rounded-xl border border-gold/40 bg-gold/5 p-3 text-[13px] text-slate-300">{report.commentary.map((l) => <p key={l} className="mb-1">{l}</p>)}</div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button onClick={download} disabled={busy} className="min-h-[48px] rounded-2xl bg-gold text-sm font-black uppercase text-ink disabled:opacity-60">{busy ? 'Building PDF…' : 'Download PDF'}</button>
            <button onClick={() => { setView(null); setTalk(true) }} className="min-h-[48px] rounded-2xl border border-cyan/60 text-sm font-black uppercase text-cyan">🧭 Discuss this report</button>
          </div>
          {err && <div className="mt-2 text-sm text-hot">{err}</div>}
        </Modal>
      )}
      {view === 'risks' && (
        <Modal kicker="🛡️ Risk Officer" title="Risk review" onClose={() => setView(null)}>
          {report.risks.length === 0 && <div className="text-sm text-neon">No material risks found.</div>}
          <ul className="space-y-2">{report.risks.map((r) => <li key={r.id} className={`rounded-xl border bg-ink/60 p-3 ${sev[r.severity]}`}><div className="flex justify-between gap-2 text-sm font-black"><span>{r.title}</span><span className="text-[11px] uppercase">{r.severity}</span></div><div className="text-[13px] text-slate-300">{r.evidence}</div></li>)}</ul>
        </Modal>
      )}
      {view === 'capital' && (
        <Modal kicker="🏛️ Capital Architect" title="Capital plan" onClose={() => setView(null)}>
          <ul className="space-y-2">{report.alternatives.map((x) => <li key={x.id} className="flex flex-wrap justify-between gap-2 rounded-xl border border-edge bg-ink/60 p-3 text-[13px]"><span className="font-bold text-white">{x.label}</span><span className="font-mono text-slate-300">IQ {x.score} · M18 {money(x.endCash)}</span></li>)}</ul>
        </Modal>
      )}
      {view === 'team' && (
        <Modal kicker="📈 Growth Strategist" title="Team and costs" onClose={() => setView(null)}>
          {report.team.length === 0 ? <div className="text-sm text-slate-400">No team hired yet.</div> : <ul className="space-y-2">{report.team.map((t) => <li key={t.name} className="rounded-xl border border-edge bg-ink/60 p-3 text-[13px]"><div className="flex justify-between font-bold text-white"><span>{t.name}</span><span className="font-mono">{money(t.cost)}/mo</span></div><div className="text-slate-400">{t.effect}</div></li>)}</ul>}
        </Modal>
      )}
      {view === 'medals' && (
        <Modal kicker="🏅 Achievements Coach" title="Medals this run" onClose={() => setView(null)}>
          {report.achievements.length === 0 ? <div className="text-sm text-slate-400">No medals yet.</div> : <ul className="space-y-2">{report.achievements.map((m) => <li key={m.name} className="rounded-xl border border-edge bg-ink/60 p-3 text-[13px]"><b className="text-gold">{m.name}</b> <span className="text-slate-400">· {m.desc}</span></li>)}</ul>}
        </Modal>
      )}
      {(view === 'empty9' || view === 'empty10') && (
        <Modal kicker="Open desk" title={`Future Agent ${view === 'empty9' ? 9 : 10}`} onClose={() => setView(null)}>
          <p className="text-sm text-slate-300">Desk open for a future agent. New helpers can move in here later.</p>
        </Modal>
      )}
    </section>
  )
}
