import { useState } from 'react'
import Panel, { Stat } from './Panel'
import { fundabilityScore, tierFor, fmt } from '../game'

function Field({ label, value, display, min, max, step = 1, onChange }) {
  return (
    <label className="block">
      <div className="flex justify-between text-[11px] text-slate-400">
        <span>{label}</span>
        <span className="font-mono text-slate-200">{display ?? value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} className="range-neon w-full" />
    </label>
  )
}

export default function Underwriting({ profile, setProfile, effective, result, onRun }) {
  const [scanning, setScanning] = useState(false)
  const score = fundabilityScore(effective)
  const t = tierFor(score)
  const set = (k) => (v) => setProfile({ ...profile, [k]: v })

  const run = () => {
    setScanning(true)
    setTimeout(() => { setScanning(false); onRun(score) }, 1400)
  }

  const stale = result && result.score !== score

  return (
    <Panel num="2" accent="cyan" title="Experian-Style AI Underwriting"
      subtitle="Simulated bureau scoring: fundability decides your approval odds and 0% limits.">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="FICO score (base)" value={profile.fico} min={500} max={850} onChange={set('fico')} />
        <Field label="Revolving utilization" value={profile.utilization} display={`${profile.utilization}%`} min={0} max={100} onChange={set('utilization')} />
        <Field label="Hard inquiries (6 mo)" value={profile.inquiries} min={0} max={12} onChange={set('inquiries')} />
        <Field label="Oldest account age" value={profile.oldestYears} display={`${profile.oldestYears} yrs`} min={0} max={30} onChange={set('oldestYears')} />
        <Field label="Open accounts" value={profile.openAccounts} min={0} max={20} onChange={set('openAccounts')} />
        <Field label="Total revolving limits" value={profile.totalLimits} display={fmt(profile.totalLimits)} min={0} max={100000} step={1000} onChange={set('totalLimits')} />
        <Field label="Annual personal income" value={profile.income} display={fmt(profile.income)} min={0} max={300000} step={5000} onChange={set('income')} />
        <label className="flex items-center gap-2 self-end text-[11px] text-slate-400">
          <input type="checkbox" checked={profile.derogatory} onChange={(e) => set('derogatory')(e.target.checked)} className="accent-hot" />
          Recent late payment / collection
        </label>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <Stat label="Eff. FICO" value={effective.fico} className="text-white" />
        <Stat label="Eff. Util" value={`${effective.utilization.toFixed(0)}%`} className={effective.utilization <= 10 ? 'text-neon' : effective.utilization <= 30 ? 'text-cyan' : 'text-hot'} />
        <Stat label="Inquiries" value={effective.inquiries} className={effective.inquiries > 6 ? 'text-hot' : 'text-white'} />
        <Stat label="AU Boost" value={`+${effective.auBoost}`} className="text-gold" />
      </div>

      <div className="relative mt-4 overflow-hidden rounded-xl border border-edge bg-ink p-4">
        {scanning && <div className="scan-line absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-transparent via-cyan/30 to-transparent" />}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500">Fundability Score</div>
            {result ? (
              <div className="flex items-baseline gap-2">
                <span className={`font-mono text-4xl font-black ${tierFor(result.score).color}`}>{result.score}</span>
                <span className="text-sm font-bold text-slate-300">Tier {tierFor(result.score).tier} · {tierFor(result.score).label}</span>
              </div>
            ) : (
              <div className="font-mono text-2xl font-black text-slate-600">— not run —</div>
            )}
            {stale && <div className="mt-1 text-[11px] text-gold">Profile changed: live score {score} (Tier {t.tier}). Re-run to lock it in.</div>}
          </div>
          <button onClick={run} disabled={scanning}
            className="shrink-0 rounded-lg bg-cyan px-4 py-2 text-xs font-black uppercase text-ink hover:brightness-110 disabled:opacity-60">
            {scanning ? 'Scanning…' : result ? 'Re-Run AI' : 'Run AI Underwriting'}
          </button>
        </div>
      </div>
    </Panel>
  )
}
