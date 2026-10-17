import { useMemo, useState } from 'react'
import { buildReport } from '../report'
import { agentStates } from '../agents'
import CommandCenter from '../components/CommandCenter'
import { RealWorldPanel } from './LeadForm'
import { btnGhost, card, go, kicker } from './ui'

const ARTIFACTS = [
  ['health', 'My Business Snapshot', 'A short health check: summary, risks and next steps.'],
  ['funding', 'My Funding Plan', 'Where your money comes from and how lenders see you.'],
  ['blueprint', 'Complete Executive Blueprint', 'The full multi-section report with forecast and options.'],
]

export default function Blueprint({ g }) {
  const { s } = g
  const report = useMemo(() => buildReport(s), [s])
  const agents = useMemo(() => agentStates(report), [report])
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const dl = async (id) => {
    setBusy(id); setErr('')
    try { const { downloadReportPdf } = await import('../pdf/generate.jsx'); await downloadReportPdf(report, id) } catch (e) { setErr(`PDF failed: ${e.message}`) }
    setBusy('')
  }
  const strong = agents.find((a) => a.status === 'ok')
  const risk = report.risks[0]
  const next = report.actions[0]
  const brief = [
    ['Biggest strength', strong ? strong.finding : 'Nothing stands out yet. Keep building.', strong ? `${strong.person}, ${strong.role}` : '', 'border-neon/40', 'text-neon'],
    ['Biggest risk', risk ? `${risk.title}. ${risk.evidence}` : 'No material risks found.', risk ? `${risk.severity} risk` : '', 'border-hot/40', 'text-hot'],
    ['Next decision', next ? `${next.action}. ${next.why}` : 'Hold the plan.', 'Recommended by your advisors', 'border-gold/40', 'text-gold'],
  ]
  return (
    <div className="space-y-8">
      <div>
        <div className={`${kicker} text-gold`}>Blueprint</div>
        <h1 className="mt-1 text-3xl font-black text-white sm:text-4xl">Here is what your business is telling you.</h1>
        <p className="mt-1 text-sm text-slate-400">Simulated results from rule-based advisors. Not financial advice.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {brief.map(([k, v, by, b, c]) => (
          <section key={k} className={`${card} ${b}`}>
            <div className={`${kicker} ${c}`}>{k}</div>
            <p className="mt-2 text-white">{v}</p>
            {by && <p className="mt-2 text-xs text-slate-500">{by}</p>}
          </section>
        ))}
      </div>
      <section>
        <h2 className="text-xl font-black text-white">Your reports</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {ARTIFACTS.map(([id, title, sub]) => (
            <div key={id} className={`${card} flex flex-col`}>
              <div className="text-3xl">▤</div>
              <div className="mt-2 text-lg font-black text-white">{title}</div>
              <p className="mt-1 flex-1 text-sm text-slate-400">{sub}</p>
              <button onClick={() => dl(id)} disabled={!!busy} className={`${btnGhost} mt-4`}>{busy === id ? 'Building PDF…' : 'Download PDF'}</button>
            </div>
          ))}
        </div>
        {err && <p role="alert" className="mt-2 text-sm text-hot">{err}</p>}
      </section>
      <details className="rounded-3xl border border-edge bg-panel/50 p-4 sm:p-6">
        <summary className="cursor-pointer text-lg font-black text-white">More reports, charts & ask your advisors</summary>
        <div className="mt-6"><CommandCenter s={s} noOffice goTo={(t) => go(t === 'team' ? 'business' : 'play')} /></div>
      </details>
      <RealWorldPanel s={s} />
    </div>
  )
}
