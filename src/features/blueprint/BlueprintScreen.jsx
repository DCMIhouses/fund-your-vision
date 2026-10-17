import { useEffect, useState } from 'react'
import { REPORT_TYPES, compareSnapshots, formatMetric, snapshotOf } from '../../report'
import { QUESTIONS, answer } from '../../consultant'
import { Button, Card, Eyebrow, Pill, SIM_NOTE } from '../../shared/ui'
import NbfPanel from './NbfPanel'

const SNAP_KEY = 'fyv-report-snapshots'
const loadSnaps = () => { try { return JSON.parse(localStorage.getItem(SNAP_KEY)) || [] } catch { return [] } }
const ARTIFACTS = [
  ['health', 'My Business Snapshot', 'A short overview: health, risks and next actions.'],
  ['funding', 'My Funding Plan', 'Your capital structure, applications and decisions.'],
  ['all', 'Complete Executive Blueprint', 'The full multi-section professional report.'],
]

export default function BlueprintScreen({ s, report }) {
  const [busy, setBusy] = useState(null)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(null)
  const [more, setMore] = useState(false)
  const [q, setQ] = useState(null)
  const [snaps, setSnaps] = useState(loadSnaps)
  useEffect(() => { localStorage.setItem(SNAP_KEY, JSON.stringify(snaps.slice(-30))) }, [snaps])
  const mine = snaps.filter((x) => x.company === report.company.name)
  const last = mine[mine.length - 1]
  const changes = last ? compareSnapshots(last, snapshotOf(report)).filter((c) => c.material) : []

  const strength = [...report.iq.breakdown].sort((a, b) => b.pts / b.max - a.pts / a.max)[0]
  const risk = report.risks[0]
  const next = report.actions[0]
  const recOk = report.reconciliation.filter((c) => c.ok).length

  const download = async (typeId) => {
    setBusy(typeId); setErr(''); setDone(null)
    try { const { downloadReportPdf } = await import('../../pdf/generate.jsx'); await downloadReportPdf(report, typeId); setDone(typeId) } catch (e) { setErr(`PDF failed: ${e.message}`) }
    setBusy(null)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">
      <div>
        <Eyebrow>Blueprint · {report.company.name}</Eyebrow>
        <h1 className="fos-display mt-1 text-[32px]">Here is what your business is telling you.</h1>
        <p className="mt-1 text-sm text-fos-muted">Your simulation results. {recOk}/{report.reconciliation.length} number checks match the game engine. Advisors are rule-based, not live AI.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="p-5"><Eyebrow>Biggest strength</Eyebrow><div className="mt-1 text-[17px] font-semibold">{strength.label}</div><p className="text-sm text-fos-muted">{strength.pts} of {strength.max} points in your Capital IQ.</p></Card>
        <Card className="p-5"><Eyebrow>Biggest risk</Eyebrow><div className="mt-1 text-[17px] font-semibold">{risk ? risk.title : 'No material risks found'}</div><p className="text-sm text-fos-muted">{risk ? risk.evidence : 'The model did not flag any risks.'}</p></Card>
        <Card className="p-5"><Eyebrow>Recommended next decision</Eyebrow><div className="mt-1 text-[17px] font-semibold">{next ? next.action : 'Hold the plan'}</div><p className="text-sm text-fos-muted">{next?.why}</p></Card>
      </div>

      <Card className="p-5">
        <Eyebrow>Your reports</Eyebrow>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {ARTIFACTS.map(([id, title, sub]) => (
            <div key={id} className="flex flex-col rounded-[18px] border border-fos-line p-4">
              <div className="font-semibold">{title}</div><p className="mt-1 flex-1 text-sm text-fos-muted">{sub}</p>
              <Button variant={id === 'all' ? 'gold' : 'secondary'} className="mt-3" disabled={!!busy} onClick={() => download(id)}>{busy === id ? 'Building PDF…' : done === id ? 'Downloaded ✓' : 'Download PDF'}</Button>
            </div>
          ))}
        </div>
        <button onClick={() => setMore((v) => !v)} aria-expanded={more} className="mt-4 min-h-[44px] text-sm font-semibold text-fos-info">{more ? 'Hide more reports' : `More reports (${REPORT_TYPES.length})`}</button>
        {more && (
          <ul className="mt-2 divide-y divide-fos-line">
            {REPORT_TYPES.map((t) => <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><span>{t.name}</span><Button variant="secondary" disabled={!!busy} onClick={() => download(t.id)}>{busy === t.id ? 'Building…' : 'PDF'}</Button></li>)}
          </ul>
        )}
        {err && <p className="mt-2 text-sm text-fos-risk">{err}</p>}
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><Eyebrow>Snapshots</Eyebrow><p className="text-sm text-fos-muted">Save a snapshot, play on, then see what changed. {mine.length} saved for this startup.</p></div>
          <Button variant="secondary" onClick={() => setSnaps((x) => [...x, snapshotOf(report, `${report.company.name} · ${new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · ${s.phase}`)])}>Save snapshot</Button>
        </div>
        {last && <ul className="mt-3 space-y-1 text-sm">{changes.length ? changes.map((c) => <li key={c.key}>{c.label}: {formatMetric(c.from, c.fmt)} → {formatMetric(c.to, c.fmt)}</li>) : <li className="text-fos-muted">No material change since your last snapshot.</li>}</ul>}
      </Card>

      <Card className="p-5">
        <div className="text-sm font-semibold text-fos-gold">Ask Naomi, your Mentor · guided explanations (rule-based)</div>
        <div className="mt-3 flex flex-wrap gap-2">{QUESTIONS.map(([id, label]) => <button key={id} onClick={() => setQ(id)} className={`min-h-[44px] rounded-full border px-4 text-sm ${q === id ? 'border-fos-gold bg-fos-gold/10' : 'border-fos-line hover:bg-fos-soft'}`}>{label}</button>)}</div>
        {q && <ul className="mt-3 space-y-1.5 text-[15px]" aria-live="polite">{answer({ ...report, changes: last ? compareSnapshots(last, snapshotOf(report)) : null }, q).map((l) => <li key={l}>{l}</li>)}</ul>}
      </Card>

      <NbfPanel s={s} />
      <p className="text-[13px] text-fos-muted">{SIM_NOTE} <Pill>Report {report.meta.id}</Pill></p>
    </div>
  )
}
