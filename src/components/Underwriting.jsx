import { useState } from 'react'
import Panel, { Stat } from './Panel'
import { fmt, tierFor } from '../game'
import { liveProfile, liveScore } from '../engine'

function Field({ label, value, display, min, max, step = 1, onChange, locked }) {
  return (
    <label className="block">
      <div className="flex justify-between text-[13px] text-slate-400">
        <span>{label}</span>
        <span className="font-mono text-slate-200">{display ?? value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} disabled={locked}
        onChange={(e) => onChange(Number(e.target.value))} className="range-neon w-full disabled:opacity-40" />
    </label>
  )
}

export function ProfileFields({ s, dispatch, locked }) {
  const p = s.profile
  const set = (k) => (v) => dispatch({ type: 'PROFILE', patch: { [k]: v } })
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field locked={locked} label="FICO score" value={p.fico} min={500} max={850} onChange={set('fico')} />
      <Field locked={locked} label="Revolving utilization" value={p.utilization} display={`${p.utilization}%`} min={0} max={100} onChange={set('utilization')} />
      <Field locked={locked} label="Hard inquiries (6 mo)" value={Math.min(p.inquiries, 6)} display={p.inquiries >= 6 ? '6+ (max penalty)' : p.inquiries} min={0} max={6} onChange={set('inquiries')} />
      <Field locked={locked} label="Oldest account age" value={Math.min(p.oldestYears, 7)} display={p.oldestYears >= 7 ? '7+ yrs (max credit)' : `${p.oldestYears} yrs`} min={0} max={7} onChange={set('oldestYears')} />
      <Field locked={locked} label="Open accounts" value={Math.min(p.openAccounts, 5)} display={p.openAccounts >= 5 ? '5+ (max credit)' : p.openAccounts} min={0} max={5} onChange={set('openAccounts')} />
      <Field locked={locked} label="Annual personal income" value={p.income} display={fmt(p.income)} min={0} max={300000} step={5000} onChange={set('income')} />
      <label className="flex items-center gap-2 text-[13px] text-slate-400">
        <input type="checkbox" disabled={locked} checked={p.derogatory} onChange={(e) => set('derogatory')(e.target.checked)} className="accent-hot" />
        Recent late payment / collection
      </label>
    </div>
  )
}

export function ScorePreview({ s }) {
  const score = liveScore(s)
  const t = tierFor(score)
  return (
    <div className="mt-3 flex items-center justify-between rounded-xl border border-edge bg-ink p-3">
      <div className="text-xs uppercase tracking-widest text-slate-500">Mock fundability score</div>
      <div className="flex items-baseline gap-2"><span className={`font-mono text-2xl font-black ${t.color}`}>{score}</span><span className="text-xs font-bold text-slate-300">Tier {t.tier}</span></div>
    </div>
  )
}

export default function Underwriting({ s, dispatch, blocked }) {
  const [scanning, setScanning] = useState(false)
  const eff = liveProfile(s)
  const score = liveScore(s)
  const t = tierFor(score)
  const run = () => {
    setScanning(true)
    setTimeout(() => { setScanning(false); dispatch({ type: 'UNDERWRITE' }) }, 1100)
  }
  return (
    <Panel guide="underwrite" num="2" accent="cyan" title="Mock AI Underwriting"
      subtitle="Transparent, simulated rules. Not an Experian product or a credit decision.">
      <ProfileFields s={s} dispatch={dispatch} locked />
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Live FICO" value={eff.fico} className={eff.fico < s.profile.fico ? 'text-hot' : 'text-white'} />
        <Stat label="Inquiries" value={eff.inquiries} className={eff.inquiries > 6 ? 'text-hot' : 'text-white'} />
        <Stat label="Utilization" value={`${eff.utilization}%`} className={eff.utilization <= 30 ? 'text-neon' : 'text-hot'} />
      </div>
      <div className="relative mt-4 overflow-hidden rounded-xl border border-edge bg-ink p-4">
        {scanning && <div className="scan-line absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-transparent via-cyan/30 to-transparent" />}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500">Fundability score (live)</div>
            <div className="flex items-baseline gap-2">
              <span className={`font-mono text-4xl font-black ${t.color}`}>{score}</span>
              <span className="text-sm font-bold text-slate-300">Tier {t.tier} · {t.label}</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">Each debt application adds a hard inquiry and lowers this score.</div>
          </div>
          {!s.underwritten ? (
            <button onClick={run} disabled={scanning || blocked}
              className="shrink-0 rounded-lg bg-cyan px-4 py-2 text-xs font-black uppercase text-ink hover:brightness-110 disabled:opacity-60">
              {scanning ? 'Scanning…' : 'Run AI Underwriting'}
            </button>
          ) : (
            <span className="shrink-0 rounded-lg border border-cyan/50 px-3 py-1.5 text-[13px] font-black uppercase text-cyan">Underwritten ✓</span>
          )}
        </div>
      </div>
    </Panel>
  )
}
