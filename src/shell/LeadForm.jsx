import { useState } from 'react'
import { INDUSTRIES } from '../data'
import { totals } from '../engine'
import { fmt } from '../game'
import { btnPrimary, card, kicker } from './ui'

const HELP = [
  ['assessment', 'Real funding eligibility assessment'],
  ['partnership', 'Capital partnership discussion'],
  ['cco', 'Fractional Chief Capital Officer consult'],
]
const VERCEL = 'https://fund-your-vision.vercel.app'
const endpoint = () => `${window.location.hostname.endsWith('github.io') ? VERCEL : ''}/api/lead`
const input = 'min-h-[46px] w-full rounded-xl border border-edge bg-ink px-3 text-white placeholder:text-slate-600 focus:border-gold focus:outline-none'

function gameSummary(s) {
  if (!s || s.phase === 'setup') return null
  const t = totals(s)
  return {
    business: s.startup.name, industry: INDUSTRIES[s.startup.industry]?.label, target: s.startup.target,
    fundedPct: Math.round((t.available / s.startup.target) * 100), score: s.result?.score ?? null, outcome: s.result?.outcome ?? null,
  }
}

export default function LeadForm({ s, initialHelp = 'assessment' }) {
  const summary = gameSummary(s)
  const [f, setF] = useState({ name: '', email: '', phone: '', business: s?.phase !== 'setup' ? s?.startup?.name || '' : '', help: initialHelp, message: '', website: '' })
  const [share, setShare] = useState(false)
  const [contact, setContact] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [state, setState] = useState({ k: 'idle' })
  const [started] = useState(() => Date.now())
  const on = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!contact || state.k === 'sending') return
    setState({ k: 'sending' })
    try {
      const r = await fetch(endpoint(), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, consentContact: true, consentMarketing: marketing, game: share ? summary : null, startedAt: started }),
      })
      const j = await r.json().catch(() => ({}))
      setState(r.ok && j.ok ? { k: 'sent' } : { k: 'error', msg: j.error || 'We could not send this right now.' })
    } catch {
      setState({ k: 'error', msg: 'Network error. Check your connection and try again.' })
    }
  }

  if (state.k === 'sent') return (
    <div className={`${card} border-neon/50`} role="status">
      <div className={`${kicker} text-neon`}>Request delivered</div>
      <p className="mt-2 text-lg font-bold text-white">Thanks, {f.name.split(' ')[0] || 'founder'}. Your request reached the Nationwide Business Funding inbox.</p>
      <p className="mt-1 text-sm text-slate-400">Someone may reach out at {f.email}. Nothing has been applied for or approved.</p>
    </div>
  )

  return (
    <form onSubmit={submit} className={`${card} space-y-4`}>
      <fieldset>
        <legend className="text-sm font-bold text-slate-300">What would help most?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {HELP.map(([id, label]) => (
            <label key={id} className={`flex min-h-[48px] cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm font-bold ${f.help === id ? 'border-gold bg-gold/10 text-gold' : 'border-edge text-slate-300'}`}>
              <input type="radio" name="help" value={id} checked={f.help === id} onChange={on('help')} className="accent-amber-400" />{label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-300">Your name<input required maxLength={80} value={f.name} onChange={on('name')} autoComplete="name" className={`${input} mt-1`} /></label>
        <label className="text-sm text-slate-300">Email<input required type="email" maxLength={120} value={f.email} onChange={on('email')} autoComplete="email" className={`${input} mt-1`} /></label>
        <label className="text-sm text-slate-300">Phone (optional)<input type="tel" maxLength={30} value={f.phone} onChange={on('phone')} autoComplete="tel" className={`${input} mt-1`} /></label>
        <label className="text-sm text-slate-300">Business name (optional)<input maxLength={80} value={f.business} onChange={on('business')} className={`${input} mt-1`} /></label>
      </div>
      <label className="block text-sm text-slate-300">Anything we should know? (optional)<textarea maxLength={1000} rows={3} value={f.message} onChange={on('message')} className={`${input} mt-1 py-2`} /></label>
      <label className="hidden" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={on('website')} /></label>
      {summary && (
        <label className="flex items-start gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} className="mt-1 accent-amber-400" />
          <span>Include my game summary: {summary.business}, {summary.industry}, goal {fmt(summary.target)}, {summary.fundedPct}% funded{summary.score != null ? `, Capital IQ ${summary.score}` : ''}. <span className="text-slate-500">No credit data.</span></span>
        </label>
      )}
      <label className="flex items-start gap-2 text-sm text-slate-300">
        <input type="checkbox" required checked={contact} onChange={(e) => setContact(e.target.checked)} className="mt-1 accent-amber-400" />
        <span>I agree that Nationwide Business Funding may contact me by email or phone about this request. <b>Required.</b></span>
      </label>
      <label className="flex items-start gap-2 text-sm text-slate-400">
        <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-1 accent-amber-400" />
        <span>Also send me occasional funding tips (optional).</span>
      </label>
      <p className="text-xs text-slate-500">We send only what you type here, plus the game summary if you check it. This is not a loan application and nothing is approved here.</p>
      {state.k === 'error' && <p role="alert" className="rounded-xl border border-hot/50 bg-hot/10 p-3 text-sm text-hot">{state.msg} You can also visit <a href="https://nationwidebusinessfunding.com" target="_blank" rel="noreferrer" className="underline">nationwidebusinessfunding.com</a>.</p>}
      <button disabled={!contact || state.k === 'sending'} className={`${btnPrimary} w-full`}>{state.k === 'sending' ? 'Sending…' : 'Send my request'}</button>
    </form>
  )
}

export function RealWorldPanel({ s }) {
  return (
    <section className="rounded-3xl border border-cyan/40 bg-gradient-to-br from-cyan/10 via-ink to-gold/5 p-5 sm:p-7">
      <div className={`${kicker} text-cyan`}>Take this into the real world</div>
      <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Ready to explore real funding?</h2>
      <p className="mt-2 max-w-3xl text-slate-300">This game is presented by Nationwide Business Funding, a Fractional Chief Capital Officer platform. If you want help with your real business, send a request. It is optional and the game works the same either way.</p>
      <div className="mt-5"><LeadForm s={s} /></div>
    </section>
  )
}
